"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getBuildingTypeMeta } from "@/lib/types";
import type { AIScore, BuildingType } from "@/lib/types";

const CampusReadonly = dynamic(
  () => import("@/components/map/campus-readonly").then((m) => m.CampusReadonly),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-zinc-950 text-zinc-500">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    ),
  }
);

export interface DetailAnnotation {
  id: string;
  x: number;
  y: number;
  title: string;
  content: string;
  buildingType: string;
  aiScore: string | null;
  shape?: string | null;
  radius?: number | null;
  bounds?: string | null;
  buildingName?: string | null;
  floor?: string | null;
}

export function CreationDetailMap({
  annotations,
}: {
  annotations: DetailAnnotation[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = annotations.find((a) => a.id === selectedId);
  let parsedScore: AIScore | null = null;
  if (selected?.aiScore) {
    try {
      parsedScore = JSON.parse(selected.aiScore);
    } catch {}
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
      <CampusReadonly
        annotations={annotations}
        onSelect={(a) => setSelectedId(a.id === "__close__" ? null : a.id)}
        selectedId={selectedId}
      />

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="absolute right-3 top-3 bottom-3 z-20 flex w-[320px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {getBuildingTypeMeta(selected.buildingType as BuildingType).emoji}
                </span>
                <span className="text-sm font-semibold text-white">
                  {selected.title}
                </span>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="grid h-7 w-7 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              <p className="text-sm leading-relaxed text-zinc-300">
                {selected.content}
              </p>

              {parsedScore ? (
                <div className="space-y-3 rounded-xl border border-white/10 bg-gradient-to-br from-orange-500/10 to-rose-500/5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Sparkles className="h-3 w-3 text-orange-400" />
                      AI 评估
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-bold text-orange-400">
                        {parsedScore.overallScore}
                      </span>
                      <Badge variant="default" className="text-[10px]">
                        {parsedScore.rating}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-white/5 py-1.5">
                      <div className="text-zinc-500">舒适</div>
                      <div className="font-semibold text-white">
                        {parsedScore.comfortScore}
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/5 py-1.5">
                      <div className="text-zinc-500">便捷</div>
                      <div className="font-semibold text-white">
                        {parsedScore.convenienceScore}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-200">
                    {parsedScore.summary}
                  </p>
                  {parsedScore.vibeTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {parsedScore.vibeTags.map((t, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-3 text-center text-xs text-zinc-500">
                  作者未对此点触发 AI 评估
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
