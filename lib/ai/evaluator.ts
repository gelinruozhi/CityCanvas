import { anthropic, API_STYLE, openaiChatComplete, MODEL_CHAIN } from "./anthropic";
import { ANNOTATION_EVALUATOR_SYSTEM_PROMPT, buildEvaluatorUserPrompt } from "./prompts";
import type { AIScore, BuildingType } from "@/lib/types";

interface EvaluateRequest {
  annotation: {
    x: number;
    y: number;
    title: string;
    content: string;
    buildingType: BuildingType;
    shape?: "point" | "circle" | "rect";
    radius?: number;
    buildingName?: string;
    floor?: string;
  };
  siblings: Array<{
    x: number;
    y: number;
    title: string;
    buildingType: BuildingType;
  }>;
  nearbyBuildings?: Array<{ name: string; dist: number }>;
  zone?: string;
}

function distanceMeters(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.round(Math.hypot(b.x - a.x, b.y - a.y));
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
  const { annotation, siblings, nearbyBuildings, zone } = req;

  // 用户已创建的其他标点：画布坐标距离
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

  const userPrompt = buildEvaluatorUserPrompt({
    annotation: { ...annotation },
    nearbyAnnotations,
    nearbyBuildings: nearbyBuildings ?? [],
    zone: zone ?? "",
  });

  const text = await callClaudeWithFallback(
    ANNOTATION_EVALUATOR_SYSTEM_PROMPT,
    userPrompt,
    MODEL_CHAIN.default
  );

  const parsed = extractJson(text);
  return normalizeScore(parsed);
}

