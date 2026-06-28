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
import type { BuildingType } from "@/lib/types";

interface CardCreation {
  id: string;
  title: string;
  createdAt: Date | string;
  user: { nickname: string };
  annotations: Array<{
    lat: number;
    lng: number;
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
            cardId={creation.id}
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
  cardId,
}: {
  annotations: CardCreation["annotations"];
  cardId: string;
}) {
  if (annotations.length === 0) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-[#1a1f3a] via-[#0f1729] to-[#0a0e1f]" />
    );
  }

  const lngs = annotations.map((a) => a.lng);
  const lats = annotations.map((a) => a.lat);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const padLng = Math.max((maxLng - minLng) * 0.3, 0.0008);
  const padLat = Math.max((maxLat - minLat) * 0.3, 0.0008);

  const projectX = (lng: number) =>
    ((lng - minLng + padLng) / (maxLng - minLng + 2 * padLng)) * 100;
  const projectY = (lat: number) =>
    ((maxLat + padLat - lat) / (maxLat - minLat + 2 * padLat)) * 75;

  const points = annotations.map((a) => ({
    x: projectX(a.lng),
    y: projectY(a.lat),
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

  const seed = hashCode(cardId);
  const buildings = generateBuildings(seed, 6);
  const greens = generateGreens(seed, 3);
  const gridId = `grid-${cardId.slice(0, 6)}`;
  const roadId = `road-${cardId.slice(0, 6)}`;

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-[#161b2e] via-[#0e1426] to-[#06080f]">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 75"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={gridId}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 6 0 L 0 0 0 6"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.25"
            />
          </pattern>
          <linearGradient id={roadId} x1="0" y1="0" x2="100" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
          </linearGradient>
        </defs>

        <rect width="100" height="75" fill={`url(#${gridId})`} />

        {greens.map((g, i) => (
          <polygon
            key={`g-${i}`}
            points={g}
            fill="rgba(34, 197, 94, 0.08)"
            stroke="rgba(34, 197, 94, 0.18)"
            strokeWidth="0.2"
          />
        ))}

        <path
          d={`M -2 ${30 + (seed % 10)} Q 25 ${28 - (seed % 8)} 50 ${
            32 + ((seed >> 3) % 6)
          } T 102 ${36 + ((seed >> 5) % 8)}`}
          stroke={`url(#${roadId})`}
          strokeWidth="1.4"
          fill="none"
        />
        <path
          d={`M -2 ${55 + ((seed >> 2) % 8)} L 102 ${52 + ((seed >> 4) % 6)}`}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.7"
          fill="none"
        />

        {buildings.map((b, i) => (
          <rect
            key={`b-${i}`}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.15"
            rx="0.6"
          />
        ))}

        {points.length > 1 && (
          <polyline
            points={points
              .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
              .join(" ")}
            stroke="rgba(251, 146, 60, 0.55)"
            strokeWidth="0.5"
            strokeDasharray="1 0.7"
            fill="none"
          />
        )}
      </svg>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-32 w-32 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/3 h-32 w-32 rounded-full bg-sky-500/12 blur-3xl" />
      </div>

      {points.map((p, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.1 + i * 0.04,
            type: "spring",
            stiffness: 280,
            damping: 22,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${p.x.toFixed(2)}%`,
            top: `${((p.y / 75) * 100).toFixed(2)}%`,
          }}
        >
          <div
            className="absolute -inset-1 rounded-full opacity-40"
            style={{
              background: `radial-gradient(circle, ${p.color}, transparent 70%)`,
            }}
          />
          <div
            className="relative h-2.5 w-2.5 rounded-full ring-2 ring-white/70"
            style={{
              background: p.color,
              boxShadow: `0 0 10px ${p.color}, 0 0 3px ${p.color}`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pseudoRand(seed: number, i: number): number {
  const x = Math.sin(seed * 9301 + i * 49297) * 233280;
  return x - Math.floor(x);
}

function generateBuildings(seed: number, count: number) {
  const items: { x: string; y: string; w: string; h: string }[] = [];
  for (let i = 0; i < count; i++) {
    const r1 = pseudoRand(seed, i);
    const r2 = pseudoRand(seed, i + 100);
    const r3 = pseudoRand(seed, i + 200);
    const r4 = pseudoRand(seed, i + 300);
    items.push({
      x: (8 + r1 * 80).toFixed(1),
      y: (8 + r2 * 55).toFixed(1),
      w: (4 + r3 * 6).toFixed(1),
      h: (3 + r4 * 5).toFixed(1),
    });
  }
  return items;
}

function generateGreens(seed: number, count: number): string[] {
  const polys: string[] = [];
  for (let i = 0; i < count; i++) {
    const cx = 15 + pseudoRand(seed, i + 500) * 70;
    const cy = 10 + pseudoRand(seed, i + 600) * 55;
    const radius = 5 + pseudoRand(seed, i + 700) * 6;
    const points: string[] = [];
    const sides = 5 + Math.floor(pseudoRand(seed, i + 800) * 3);
    for (let j = 0; j < sides; j++) {
      const angle = (j / sides) * Math.PI * 2;
      const r = radius * (0.7 + pseudoRand(seed, i * 10 + j) * 0.6);
      const px = (cx + Math.cos(angle) * r).toFixed(1);
      const py = (cy + Math.sin(angle) * r).toFixed(1);
      points.push(`${px},${py}`);
    }
    polys.push(points.join(" "));
  }
  return polys;
}
