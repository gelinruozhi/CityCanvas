import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import { nearbyBuildings, campusZone } from "@/lib/campus/map-data";
import type { AIScore, Annotation } from "@/lib/types";

interface EvaluatePayload {
  annotation: Pick<
    Annotation,
    "x" | "y" | "title" | "content" | "buildingType"
  > & {
    shape?: Annotation["shape"];
    radius?: number;
    bounds?: Annotation["bounds"];
    buildingName?: string;
    floor?: string;
  };
  siblings: Array<Pick<Annotation, "x" | "y" | "title" | "buildingType">>;
  nearbyBuildings: Array<{ name: string; dist: number }>;
  zone: string;
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

  return useMutation({
    mutationFn: async (annotationId: string) => {
      const target = annotations.find((a) => a.id === annotationId);
      if (!target) throw new Error("标点不存在");

      // 位置上下文：画布坐标系里的周边建筑与所属区域
      const near = nearbyBuildings(target.x, target.y, 5);
      const siblings = annotations
        .filter((a) => a.id !== annotationId)
        .map((a) => ({
          x: a.x,
          y: a.y,
          title: a.title,
          buildingType: a.buildingType,
        }));

      return await postEvaluate({
        annotation: {
          x: target.x,
          y: target.y,
          title: target.title,
          content: target.content,
          buildingType: target.buildingType,
          shape: target.shape,
          radius: target.radius,
          bounds: target.bounds,
          buildingName: target.buildingName,
          floor: target.floor,
        },
        siblings,
        nearbyBuildings: near,
        zone: campusZone(target.x, target.y),
      });
    },
    onMutate: () => {
      const toastId = toast.loading("✨ AI 正在评估这个创意…", {
        description: "分析周边楼栋布局与功能协同性",
      });
      return { toastId };
    },
    onSuccess: (score, annotationId, ctx) => {
      setAIScore(annotationId, score);
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
