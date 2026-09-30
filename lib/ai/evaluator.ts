import { anthropic, API_STYLE, openaiChatComplete, MODEL_CHAIN } from "./anthropic";
import { ANNOTATION_EVALUATOR_SYSTEM_PROMPT, buildEvaluatorUserPrompt } from "./prompts";
import { searchNearbyPois } from "@/lib/amap/poi";
import type { AIScore, Annotation, BuildingType } from "@/lib/types";

export interface NearbyPlaceInput {
  name: string;
  type: string;
  distance: number;
  address?: string;
}

interface EvaluateRequest {
  annotation: {
    lat: number;
    lng: number;
    title: string;
    content: string;
    buildingType: BuildingType;
  };
  siblings: Array<{
    lat: number;
    lng: number;
    title: string;
    buildingType: BuildingType;
  }>;
  campusCenter?: { lng: number; lat: number } | null;
  nearbyPlaces?: NearbyPlaceInput[];
}

function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function ratingFromScore(score: number): AIScore["rating"] {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

function extractJson(text: string): any {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  const raw = fenced ? fenced[1] : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    console.error("[ai] AI 未返回 JSON。原始输出：", text);
    throw new Error("AI 未返回 JSON");
  }
  const slice = raw.slice(start, end + 1);

  // 第 1 道防线：直接尝试
  try {
    return JSON.parse(slice);
  } catch {}

  // 第 2 道防线：字符替换（中文标点 → ASCII）
  const repaired = slice
    .replace(/[“”]/g, '"') // " " → "
    .replace(/[‘’]/g, "'") // ' ' → '
    .replace(/，/g, ",")
    .replace(/。/g, ".")
    .replace(/：/g, ":")
    .replace(/；/g, ";")
    .replace(/【/g, "[")
    .replace(/】/g, "]")
    .replace(/(\}|\])(\s*[\}\]])/g, "$1$2")  // trailing 内容兼容
    .replace(/,\s*([}\]])/g, "$1")             // 删除 trailing comma
    .replace(/"\s*\n\s*"/g, '",\n"');           // 字符串数组里漏写逗号

  try {
    return JSON.parse(repaired);
  } catch (err) {
    console.error("[ai] JSON 修复失败。原始 raw：", slice);
    console.error("[ai] 修复后 repaired：", repaired);
    throw new Error(
      `AI 输出的 JSON 无法解析: ${err instanceof Error ? err.message : err}`
    );
  }
}

function normalizeScore(input: any): AIScore {
  const comfort = clamp(Math.round(Number(input.comfortScore) || 0), 0, 100);
  const convenience = clamp(
    Math.round(Number(input.convenienceScore) || 0),
    0,
    100
  );
  let overall = Math.round(Number(input.overallScore));
  if (!Number.isFinite(overall)) {
    overall = Math.round((comfort + convenience) / 2);
  }
  overall = clamp(overall, 0, 100);

  const fallbackRating = ratingFromScore(overall);
  const rating = (["A+", "A", "B", "C", "D"] as const).includes(input.rating)
    ? input.rating
    : fallbackRating;

  return {
    comfortScore: comfort,
    convenienceScore: convenience,
    overallScore: overall,
    rating,
    summary: String(input.summary ?? "").slice(0, 80) || "暂无总结",
    strengths: Array.isArray(input.strengths) ? input.strengths.slice(0, 3).map(String) : [],
    concerns: Array.isArray(input.concerns) ? input.concerns.slice(0, 3).map(String) : [],
    suggestions: Array.isArray(input.suggestions) ? input.suggestions.slice(0, 3).map(String) : [],
    vibeTags: Array.isArray(input.vibeTags) ? input.vibeTags.slice(0, 4).map(String) : [],
  };
}

async function callClaudeWithFallback(
  systemPrompt: string,
  userPrompt: string,
  modelChain: readonly string[]
): Promise<string> {
  let lastErr: unknown;
  for (const model of modelChain) {
    try {
      if (API_STYLE === "openai") {
        // 推理模型会先消耗 token 思考，max_tokens 放大到 3 倍保证正文有空间
        return await openaiChatComplete(systemPrompt, userPrompt, model, 3072);
      }
      const response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        temperature: 0.2,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = response.content.find((b) => b.type === "text");
      if (block && block.type === "text") return block.text;
      throw new Error("AI 响应缺少文本内容");
    } catch (err) {
      lastErr = err;
      console.warn(`[ai] model ${model} 失败，尝试下一个:`, err);
    }
  }
  throw lastErr ?? new Error("所有 AI 模型尝试均失败");
}

export async function evaluateAnnotation(
  req: EvaluateRequest
): Promise<AIScore> {
  const { annotation, siblings, campusCenter, nearbyPlaces } = req;

  if (!campusCenter) {
    throw new Error("缺少校园中心坐标：前端必须先完成 PlaceSearch 定位再触发评估");
  }

  // 距校园中心的纯数字距离（不再翻译成"南部/北部"等抽象方位）
  const distanceFromCenter = distanceMeters(
    { lat: campusCenter.lat, lng: campusCenter.lng },
    { lat: annotation.lat, lng: annotation.lng }
  );

  // 用户已创建的其他标点：只给"距离 X 米"，不给方位词
  const nearbyAnnotations = siblings
    .filter((s) => s.title !== annotation.title)
    .map((s) => ({
      title: s.title,
      buildingType: s.buildingType,
      distance: distanceMeters(annotation, s),
    }))
    .filter((s) => s.distance <= 600)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);

  // 周边真实建筑：优先用前端 PlaceSearch 的结果；为空时回退到后端 REST API
  let realPois: NearbyPlaceInput[] = Array.isArray(nearbyPlaces) ? nearbyPlaces : [];
  if (realPois.length === 0) {
    const restPois = await searchNearbyPois(annotation.lng, annotation.lat, 250);
    realPois = restPois;
  }

  const userPrompt = buildEvaluatorUserPrompt({
    annotation: {
      ...annotation,
      distanceFromCenter,
    },
    nearbyAnnotations,
    realPois,
  });

  const text = await callClaudeWithFallback(
    ANNOTATION_EVALUATOR_SYSTEM_PROMPT,
    userPrompt,
    MODEL_CHAIN.default
  );

  const parsed = extractJson(text);
  return normalizeScore(parsed);
}

export type { Annotation };
