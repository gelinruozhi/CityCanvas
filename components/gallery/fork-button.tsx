"use client";

import { useRouter } from "next/navigation";
import { GitFork } from "lucide-react";
import { toast } from "sonner";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import { getBuildingTypeMeta } from "@/lib/types";
import type { Annotation } from "@/lib/types";
import { Button } from "@/components/ui/button";

function safeParseBounds(raw: string): Annotation["bounds"] | undefined {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.sw) &&
      Array.isArray(parsed.ne)
    ) {
      return parsed as Annotation["bounds"];
    }
  } catch {}
  return undefined;
}

interface ForkAnnotation {
  x: number;
  y: number;
  title: string;
  content: string;
  buildingType: string;
  aiScore: string | null;
  shape?: string;
  radius?: number | null;
  bounds?: string | null;
  buildingName?: string | null;
  floor?: string | null;
}

export function ForkButton({
  creationTitle,
  annotations,
}: {
  creationTitle: string;
  annotations: ForkAnnotation[];
}) {
  const router = useRouter();
  const clearAll = useAnnotationStore((s) => s.clearAll);
  const addAnnotation = useAnnotationStore((s) => s.addAnnotation);

  const handleFork = () => {
    clearAll();
    annotations.forEach((a) => {
      addAnnotation({
        x: a.x,
        y: a.y,
        title: a.title,
        content: a.content,
        // 旧值（dining/study 等）经 LEGACY_TYPE_MAP normalize 到新类型
        buildingType: getBuildingTypeMeta(a.buildingType).value,
        shape: (a.shape as Annotation["shape"]) ?? "point",
        radius: a.radius ?? undefined,
        bounds:
          a.bounds && typeof a.bounds === "string"
            ? safeParseBounds(a.bounds)
            : undefined,
        buildingName: a.buildingName ?? undefined,
        floor: a.floor ?? undefined,
      });
    });
    toast.success(`已 Fork "${creationTitle}"`, {
      description: `${annotations.length} 个标点已加入你的画布`,
    });
    router.push("/create");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleFork}>
      <GitFork className="h-4 w-4" />
      Fork 这个创作
    </Button>
  );
}

