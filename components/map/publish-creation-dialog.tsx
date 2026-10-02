"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import { useUserStore } from "@/lib/store/user-store";
import { DEFAULT_MAP_VIEW } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PublishCreationDialog() {
  const router = useRouter();
  const isOpen = useAnnotationStore((s) => s.isPublishOpen);
  const closeDialog = useAnnotationStore((s) => s.closePublishDialog);
  const annotations = useAnnotationStore((s) => s.annotations);
  const clearAll = useAnnotationStore((s) => s.clearAll);
  const userId = useUserStore((s) => s.id);
  const nickname = useUserStore((s) => s.nickname);

  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setTitle("");
  }, [isOpen]);

  const handlePublish = async () => {
    if (!userId) {
      toast.error("匿名用户还在创建，稍等几秒重试");
      return;
    }
    if (!title.trim()) {
      toast.error("给你的作品取个标题");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: title.trim(),
          mapView: DEFAULT_MAP_VIEW,
          annotations: annotations.map((a) => ({
            lat: a.lat,
            lng: a.lng,
            title: a.title,
            content: a.content,
            buildingType: a.buildingType,
            shape: a.shape,
            radius: a.radius,
            bounds: a.bounds,
            buildingName: a.buildingName,
            floor: a.floor,
            aiScore: a.aiScore,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "发布失败");

      toast.success("🎉 作品发布成功！", {
        description: `${nickname ?? "你"} · ${annotations.length} 个标点`,
      });
      clearAll();
      closeDialog();
      router.push(`/gallery/${json.data.id}`);
    } catch (e) {
      console.error(e);
      toast.error("发布失败，请重试", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Rocket className="h-5 w-5 text-orange-400" />
            发布到灵感广场
          </DialogTitle>
          <DialogDescription>
            你的作品将出现在 Gallery，其他同学可以浏览、点赞、二次创作。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-orange-500/10 to-rose-500/5 p-4">
          <div className="text-xs text-zinc-400">本次作品</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-orange-400">
              {annotations.length}
            </span>
            <span className="text-sm text-zinc-400">个标点</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            作者：{nickname ?? "（加载中…）"}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400">
            作品标题 <span className="text-zinc-600">{title.length}/30</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 30))}
            placeholder="如：我心中的山财 2026"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={closeDialog} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handlePublish} disabled={submitting || !userId}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            发布作品
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
