"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Sparkles,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getBuildingTypeMeta } from "@/lib/types";
import {
  CAMPUS_BUILDINGS,
  CAMPUS_GREENS,
  CAMPUS_ROADS,
} from "@/lib/campus/map-data";
import type { BuildingType } from "@/lib/types";

interface CardCreation {
  id: string;
  title: string;
  createdAt: Date | string;
  user: { nickname: string };
  annotations: Array<{
    x: number;
    y: number;
    title: string;
    buildingType: string;
    aiScore: string | null;
  }>;
  _count: { likes: number; comments: number };
}

interface ParsedAnnotation {
  title: string;
  buildingType: BuildingType;
  score: number | null;
}

export function CreationCard({
  creation,
  index,
}: {
  creation: CardCreation;
  index: number;
}) {
  const annotations: ParsedAnnotation[] = creation.annotations.map((a) => {
    let score: number | null = null;
    try {
      if (a.aiScore) score = JSON.parse(a.aiScore).overallScore;
    } catch {}
    return {
      title: a.title,
      buildingType: a.buildingType as BuildingType,
      score,
    };
  });

  // 综合分（取所有标点平均）
  const avgScore = (() => {
    const scores = annotations
      .map((a) => a.score)
      .filter((v): v is number => typeof v === "number");
    if (!scores.length) return null;
    return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  })();

  // Top 3 标点（按 AI 分数排序，未评分的排后）
  const topAnnotations = [...annotations]
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    .slice(0, 3);

  // 建筑类型分布（去重）— 用 getBuildingTypeMeta 走 LEGACY 兼容映射，
  // 避免数据库里旧值（如 dining/study）找不到 meta 报 undefined.label
  const typeStats = (() => {
    const counts = new Map<string, number>();
    annotations.forEach((a) => {
      const meta = getBuildingTypeMeta(a.buildingType);
      counts.set(meta.value, (counts.get(meta.value) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([typeValue, count]) => ({
        meta: getBuildingTypeMeta(typeValue),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  })();

  const avgScoreColor =
    avgScore == null
      ? "from-zinc-700 to-zinc-800"
      : avgScore >= 80
      ? "from-emerald-500 to-teal-600"
      : avgScore >= 65
      ? "from-orange-500 to-rose-500"
      : "from-rose-600 to-red-700";

  const ratingLabel =
    avgScore == null
      ? null
      : avgScore >= 90
      ? "A+"
      : avgScore >= 80
      ? "A"
      : avgScore >= 65
      ? "B"
      : avgScore >= 50
      ? "C"
      : "D";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
      className="mb-4 break-inside-avoid"
    >
      <Link
        href={`/gallery/${creation.id}`}
        className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/15"
      >
        {/* 顶部：紧凑型小地图（aspect 改成 21:9，把更多空间留给内容） */}
        <div className="relative aspect-[21/9] overflow-hidden">
          <MiniMapPreview
            annotations={creation.annotations}
          />

          {/* 综合分大徽章 */}
          {avgScore != null && (
            <div
              className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-2xl bg-gradient-to-br ${avgScoreColor} px-3 py-1.5 shadow-xl backdrop-blur-md`}
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
              <span className="text-lg font-bold leading-none tabular-nums text-white">
                {avgScore}
              </span>
              {ratingLabel && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                  {ratingLabel}
                </span>
              )}
            </div>
          )}

          {/* 左上角标点数 */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-zinc-950/80 px-3 py-1 text-xs backdrop-blur-md">
            <MapPin className="h-3 w-3 text-orange-400" />
            <span className="font-medium tabular-nums text-zinc-200">
              {annotations.length} 个标点
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-zinc-950 to-transparent" />
        </div>

        {/* 中部：标题 + 类型分布 */}
        <div className="space-y-3 px-5 pt-4">
          <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-white transition group-hover:text-orange-300">
            {creation.title}
          </h3>

          {/* 建筑类型分布徽章组 */}
          <div className="flex flex-wrap gap-1.5">
            {typeStats.map(({ meta, count }) => (
              <span
                key={meta.value}
                className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-300"
                title={`${meta.label} × ${count}`}
              >
                <span>{meta.emoji}</span>
                <span className="font-medium">{meta.label}</span>
                {count > 1 && (
                  <span className="text-zinc-500 tabular-nums">×{count}</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* 标点亮点列表（最有改造价值的 Top 3） */}
        {topAnnotations.length > 0 && (
          <div className="mx-5 mt-4 space-y-1.5 rounded-2xl border border-white/5 bg-white/[0.025] p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              <Sparkles className="h-2.5 w-2.5" />
              核心改造
            </div>
            {topAnnotations.map((a, i) => {
              const meta = getBuildingTypeMeta(a.buildingType);
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="text-sm leading-none">{meta.emoji}</span>
                  <span className="min-w-0 flex-1 truncate text-zinc-200">
                    {a.title || "未命名"}
                  </span>
                  {a.score != null && (
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-semibold tabular-nums ${
                        a.score >= 80
                          ? "bg-emerald-500/15 text-emerald-300"
                          : a.score >= 60
                          ? "bg-orange-500/15 text-orange-300"
                          : "bg-rose-500/15 text-rose-300"
                      }`}
                    >
                      {a.score}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 底部：作者 + 互动 */}
        <div className="mx-5 mb-4 mt-4 flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-400">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="text-[10px]">
                {creation.user.nickname.slice(-1)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-zinc-300">
                {creation.user.nickname}
              </div>
              <div className="text-[10px] text-zinc-600">
                {new Date(creation.createdAt).toLocaleDateString("zh-CN", {
                  month: "2-digit",
                  day: "2-digit",
                })}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-zinc-400">
            <span className="flex items-center gap-1 transition group-hover:text-rose-400">
              <Heart className="h-3.5 w-3.5" />
              {creation._count.likes}
            </span>
            <span className="flex items-center gap-1 transition group-hover:text-sky-400">
              <MessageCircle className="h-3.5 w-3.5" />
              {creation._count.comments}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-orange-400" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ========== 紧凑型地图缩略图 ========== */

function MiniMapPreview({
  annotations,
}: {
  annotations: CardCreation["annotations"];
}) {
  const points = annotations.map((a) => ({
    x: a.x,
    y: 1400 - a.y, // 校园 y 向北，SVG y 向下
    color: (() => {
      let score: number | null = null;
      try {
        if (a.aiScore) score = JSON.parse(a.aiScore).overallScore;
      } catch {}
      const meta = getBuildingTypeMeta(a.buildingType as BuildingType);
      return score != null
        ? `hsl(${Math.round((score / 100) * 120)}, 80%, 55%)`
        : meta.color;
    })(),
  }));

  return (
    <div className="relative h-full w-full bg-[#0d1a12]">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 700 1400"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width={700} height={1400} fill="#0d1a12" />
        {CAMPUS_GREENS.map((g, i) => (
          <rect key={`g${i}`} x={g.x} y={1400 - g.y - g.h} width={g.w} height={g.h} fill="#16301f" rx={10} />
        ))}
        {CAMPUS_ROADS.map((r, i) => (
          <polyline
            key={`r${i}`}
            points={r.pts.map(([x, y]) => `${x},${1400 - y}`).join(" ")}
            fill="none"
            stroke="#2e3a33"
            strokeWidth={r.width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {CAMPUS_BUILDINGS.filter((b) => b.buildingType !== "field").map((b) => (
          <rect
            key={b.id}
            x={b.x - b.size[0] / 2}
            y={1400 - b.y - b.size[1] / 2}
            width={b.size[0]}
            height={b.size[1]}
            rx={3}
            fill="#1f2b24"
            stroke="#3a4a3e"
            strokeWidth={2}
          />
        ))}
        {CAMPUS_BUILDINGS.filter((b) => b.buildingType === "field").map((b) => (
          <ellipse
            key={`f-${b.id}`}
            cx={b.x}
            cy={1400 - b.y}
            rx={b.size[0] / 2}
            ry={b.size[1] / 2}
            fill="#1a3324"
            stroke="#3f6148"
            strokeWidth={3}
          />
        ))}
        {points.map((p, i) => (
          <circle key={`p${i}`} cx={p.x} cy={p.y} r={14} fill={p.color} stroke="#fff" strokeWidth={3} />
        ))}
      </svg>
    </div>
  );
}





