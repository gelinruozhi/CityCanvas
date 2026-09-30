import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import { searchNearbyPlaces } from "@/lib/amap/place-search-client";
import type { AIScore, Annotation } from "@/lib/types";
import type { NearbyPlace } from "@/lib/amap/place-search-client";

interface EvaluatePayload {
  annotation: Pick<Annotation, "lat" | "lng" | "title" | "content" | "buildingType">;
  siblings: Array<Pick<Annotation, "lat" | "lng" | "title" | "buildingType">>;
  campusCenter: { lng: number; lat: number } | null;
  nearbyPlaces: NearbyPlace[];
}

async function postEvaluate(payload: EvaluatePayload): Promise<AIScore> {
  let res: Response;
  try {
    res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      throw new Error("评估超时（90 秒），请稍后重试");
    }
    throw e;
  }
  const json = await res.json();
  if (!res.ok) throw new Error(json?.detail ?? json?.error ?? "评估失败");
  return json.data as AIScore;
}

export function useEvaluateAnnotation() {
  const setAIScore = useAnnotationStore((s) => s.setAIScore);
  const annotations = useAnnotationStore((s) => s.annotations);
  const campusCenter = useAnnotationStore((s) => s.campusCenter);

  return useMutation({
    mutationFn: async (annotationId: string) => {
      const target = annotations.find((a) => a.id === annotationId);
      if (!target) throw new Error("标点不存在");
      if (!campusCenter) {
        throw new Error("校园定位未完成，请稍等地图加载后重试");
      }

      // 浏览器端先用高德 JS API 搜真实周边建筑（半径 250m），把名字给 AI。
      // 这是修复"AI 脑补方位"的关键：让它看具体 POI 名而不是抽象区域标签。
      const nearbyPlaces = await searchNearbyPlaces(target.lng, target.lat, 250);

      const siblings = annotations
        .filter((a) => a.id !== annotationId)
        .map((a) => ({
          lat: a.lat,
          lng: a.lng,
          title: a.title,
          buildingType: a.buildingType,
        }));

      const score = await postEvaluate({
        annotation: {
          lat: target.lat,
          lng: target.lng,
          title: target.title,
          content: target.content,
          buildingType: target.buildingType,
        },
        siblings,
        campusCenter,
        nearbyPlaces,
      });
      setAIScore(annotationId, score);
      return score;
    },
    onMutate: () => {
      const toastId = toast.loading("✨ AI 正在评估这个创意…", {
        description: "搜索真实周边建筑 + 分析功能协同性",
      });
      return { toastId };
    },
    onSuccess: (score, _id, ctx) => {
      toast.success(`评估完成 · ${score.rating} (${score.overallScore} 分)`, {
        id: ctx?.toastId,
        description: score.summary,
      });
    },
    onError: (err, _id, ctx) => {
      toast.error("评估失败", {
        id: ctx?.toastId,
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });
}
