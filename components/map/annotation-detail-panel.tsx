"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { X, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import { getBuildingTypeMeta, BUILDING_TYPES } from "@/lib/types";
import type { AIScore } from "@/lib/types";
import { useEvaluateAnnotation } from "@/lib/hooks/use-evaluate-annotation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AnnotationDetailPanel() {
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const annotation = useAnnotationStore((s) =>
    s.annotations.find((a) => a.id === selectedId)
  );
  const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);
  const removeAnnotation = useAnnotationStore((s) => s.removeAnnotation);
  const selectAnnotation = useAnnotationStore((s) => s.selectAnnotation);

  const evaluate = useEvaluateAnnotation();

  return (
    <AnimatePresence>
      {annotation && (
        <motion.aside
          key={annotation.id}
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="pointer-events-auto absolute right-4 top-20 bottom-4 z-20 flex w-[380px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/85 backdrop-blur-2xl shadow-2xl shadow-black/40"
        >
          <header className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {getBuildingTypeMeta(annotation.buildingType).emoji}
              </span>
              <div>
                <div className="text-xs uppercase tracking-wider text-zinc-500">
                  标点详情
                </div>
                <div className="text-sm font-semibold text-white">
                  {annotation.title || "未命名"}
                </div>
              </div>
            </div>
            <button
              onClick={() => selectAnnotation(null)}
              className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">标题</label>
              <Input
                value={annotation.title}
                onChange={(e) =>
                  updateAnnotation(annotation.id, { title: e.target.value })
                }
                placeholder="给这个创意取个名字"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">类型</label>
              <Select
                value={getBuildingTypeMeta(annotation.buildingType).value}
                onValueChange={(v) =>
                  updateAnnotation(annotation.id, {
                    buildingType: v as typeof annotation.buildingType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUILDING_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <span>{t.emoji}</span>
                        <span>{t.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">
                创意描述
                <span className="ml-2 text-zinc-600">
                  {annotation.content.length}/500
                </span>
              </label>
              <Textarea
                value={annotation.content}
                onChange={(e) =>
                  updateAnnotation(annotation.id, {
                    content: e.target.value.slice(0, 500),
                  })
                }
                rows={4}
                placeholder="想象这里有一座什么样的建筑？它会给校园带来什么？"
              />
            </div>

            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="text-xs text-zinc-500">坐标</div>
              <div className="mt-1 font-mono text-xs text-zinc-300">
                {annotation.lng.toFixed(6)}, {annotation.lat.toFixed(6)}
              </div>
            </div>

            {annotation.aiScore ? (
              <AIScoreCard score={annotation.aiScore} />
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
                <Sparkles className="mx-auto mb-2 h-5 w-5 text-orange-400" />
                <div className="text-sm text-zinc-300">让 AI 评估这个创意</div>
                <div className="mt-1 text-xs text-zinc-500">
                  Claude 会分析周边设施 + 人流 + 功能协同
                </div>
              </div>
            )}
          </div>

          <footer className="flex items-center justify-between gap-2 border-t border-white/5 px-5 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeAnnotation(annotation.id)}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={
                evaluate.isPending ||
                !annotation.title.trim() ||
                !annotation.content.trim()
              }
              onClick={() => evaluate.mutate(annotation.id)}
            >
              {evaluate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {annotation.aiScore ? "重新评估" : "AI 评估"}
            </Button>
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsubscribe = rounded.on("change", setDisplay);
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, motionValue, rounded]);

  return <span>{display}</span>;
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-mono text-zinc-200">
          <AnimatedNumber value={value} />
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

function AIScoreCard({ score }: { score: AIScore }) {
  const ratingColor =
    score.overallScore >= 80
      ? "from-emerald-500/20 to-teal-500/5"
      : score.overallScore >= 65
      ? "from-orange-500/15 to-rose-500/5"
      : "from-rose-500/15 to-red-500/5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br ${ratingColor} p-4`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-orange-400" />
          AI 评估
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-orange-400">
            <AnimatedNumber value={score.overallScore} />
          </span>
          <Badge variant="default">{score.rating}</Badge>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar label="舒适度" value={score.comfortScore} color="linear-gradient(90deg, #f59e0b, #f97316)" />
        <ScoreBar label="便捷度" value={score.convenienceScore} color="linear-gradient(90deg, #0ea5e9, #6366f1)" />
      </div>

      <p className="text-sm leading-relaxed text-zinc-100">{score.summary}</p>

      {score.vibeTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {score.vibeTags.map((tag, i) => (
            <span
              key={i}
              className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <Accordion title="✨ 优点" items={score.strengths} accent="text-emerald-300" />
      <Accordion title="⚠️ 隐患" items={score.concerns} accent="text-amber-300" />
      <Accordion title="💡 改进建议" items={score.suggestions} accent="text-sky-300" />
    </motion.div>
  );
}

function Accordion({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: string;
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-1.5">
      <div className={`text-xs font-medium ${accent}`}>{title}</div>
      <ul className="space-y-1 text-xs leading-relaxed text-zinc-200">
        {items.map((it, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="flex gap-1.5"
          >
            <span className="text-zinc-500">·</span>
            <span>{it}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
