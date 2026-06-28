"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Sparkles, Trash2 } from "lucide-react";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import { getBuildingTypeMeta } from "@/lib/types";
import type { BuildingType } from "@/lib/types";
import { useMemo } from "react";

export function AnnotationsListPanel() {
  const annotations = useAnnotationStore((s) => s.annotations);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const selectAnnotation = useAnnotationStore((s) => s.selectAnnotation);
  const removeAnnotation = useAnnotationStore((s) => s.removeAnnotation);

  const stats = useMemo(() => {
    const evaluated = annotations.filter((a) => a.aiScore).length;
    const scores = annotations
      .map((a) => a.aiScore?.overallScore)
      .filter((v): v is number => typeof v === "number");
    const avg = scores.length
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : null;
    return { total: annotations.length, evaluated, avg };
  }, [annotations]);

  if (annotations.length === 0) return null;

  return (
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.5 }}
      className="pointer-events-auto absolute left-1/2 top-4 z-20 flex max-w-[680px] -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-zinc-950/70 px-3 py-2 backdrop-blur-xl shadow-2xl shadow-black/20"
    >
      <div className="flex items-center gap-1.5 px-2 text-xs text-zinc-300">
        <MapPin className="h-3.5 w-3.5 text-orange-400" />
        <span className="font-semibold text-white">{stats.total}</span>
        <span className="text-zinc-500">个</span>
      </div>
      {stats.avg != null && (
        <>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5 px-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-zinc-500">均分</span>
            <span className="font-semibold text-orange-300">{stats.avg}</span>
          </div>
        </>
      )}
      <div className="h-4 w-px bg-white/10" />
      <ul className="flex max-w-[400px] items-center gap-1 overflow-x-auto pr-1 [&::-webkit-scrollbar]:hidden">
        <AnimatePresence initial={false}>
          {annotations.map((a) => {
            const meta = getBuildingTypeMeta(a.buildingType as BuildingType);
            const isSelected = a.id === selectedId;
            const score = a.aiScore?.overallScore;
            return (
              <motion.li
                key={a.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
              >
                <button
                  onClick={() => selectAnnotation(a.id)}
                  className={`group relative flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition ${
                    isSelected
                      ? "bg-orange-500/20 text-orange-200 ring-1 ring-orange-500/40"
                      : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  }`}
                  title={a.title}
                >
                  <span className="text-sm leading-none">{meta.emoji}</span>
                  <span className="max-w-[100px] truncate">{a.title || "未命名"}</span>
                  {score != null && (
                    <span className={`font-mono text-[10px] ${
                      score >= 80
                        ? "text-emerald-400"
                        : score >= 60
                        ? "text-orange-300"
                        : "text-rose-300"
                    }`}>
                      {score}
                    </span>
                  )}
                  {isSelected && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAnnotation(a.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          removeAnnotation(a.id);
                        }
                      }}
                      className="ml-0.5 grid h-4 w-4 cursor-pointer place-items-center rounded-full text-rose-300 transition hover:bg-rose-500/30"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </span>
                  )}
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </motion.div>
  );
}
