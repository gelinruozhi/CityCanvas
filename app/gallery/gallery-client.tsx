"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Clock, Flame, Trophy } from "lucide-react";
import { CreationCard } from "@/components/gallery/creation-card";
import {
  BUILDING_TYPES,
  BUILDING_GROUPS,
  type BuildingType,
} from "@/lib/types";

type SortMode = "latest" | "hot" | "top";

interface RawCreation {
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

function avgScore(c: RawCreation): number {
  const scores = c.annotations
    .map((a) => {
      if (!a.aiScore) return null;
      try {
        return JSON.parse(a.aiScore).overallScore as number;
      } catch {
        return null;
      }
    })
    .filter((v): v is number => typeof v === "number");
  if (!scores.length) return 0;
  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

export function GalleryClient({ creations }: { creations: RawCreation[] }) {
  const [sort, setSort] = useState<SortMode>("latest");
  const [typeFilter, setTypeFilter] = useState<BuildingType | "all">("all");
  const [showAllTypes, setShowAllTypes] = useState(false);

  // 高分排序需要每张卡的平均分 —— 一次预计算，避免排序比较器里反复 JSON.parse
  const scoreById = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of creations) m.set(c.id, avgScore(c));
    return m;
  }, [creations]);

  const filtered = useMemo(() => {
    let arr = [...creations];

    if (typeFilter !== "all") {
      arr = arr.filter((c) =>
        c.annotations.some((a) => a.buildingType === typeFilter)
      );
    }

    if (sort === "hot") {
      arr.sort((a, b) => b._count.likes - a._count.likes);
    } else if (sort === "top") {
      arr.sort(
        (a, b) => (scoreById.get(b.id) ?? 0) - (scoreById.get(a.id) ?? 0)
      );
    } else {
      arr.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return arr;
  }, [creations, sort, typeFilter, scoreById]);

  return (
    <>
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-[68px] z-30 -mx-6 mb-6 space-y-3 border-b border-white/5 bg-zinc-950/70 px-6 py-4 backdrop-blur-xl"
      >
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            active={sort === "latest"}
            onClick={() => setSort("latest")}
            icon={Clock}
          >
            最新
          </FilterPill>
          <FilterPill
            active={sort === "hot"}
            onClick={() => setSort("hot")}
            icon={Flame}
          >
            最热
          </FilterPill>
          <FilterPill
            active={sort === "top"}
            onClick={() => setSort("top")}
            icon={Trophy}
          >
            高分
          </FilterPill>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
            <Sparkles className="h-3.5 w-3.5" />
            筛选出{" "}
            <span className="font-semibold text-zinc-300">
              {filtered.length}
            </span>{" "}
            / {creations.length} 个作品
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-1 shrink-0 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            类型
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            <TypePill
              active={typeFilter === "all"}
              onClick={() => setTypeFilter("all")}
              emoji="✦"
              label="全部"
            />
            {BUILDING_GROUPS.map((group) => {
              const groupTypes = BUILDING_TYPES.filter(
                (t) => t.group === group.value
              );
              if (groupTypes.length === 0) return null;

              const visibleTypes = showAllTypes
                ? groupTypes
                : groupTypes.slice(0, 2);

              return (
                <div
                  key={group.value}
                  className="flex items-center gap-1 rounded-full border border-white/5 bg-white/[0.02] py-0.5 pl-2 pr-1"
                >
                  <span className="text-[10px] text-zinc-500">
                    {group.icon}
                  </span>
                  {visibleTypes.map((t) => (
                    <TypePill
                      key={t.value}
                      active={typeFilter === t.value}
                      onClick={() => setTypeFilter(t.value)}
                      emoji={t.emoji}
                      label={t.label}
                    />
                  ))}
                </div>
              );
            })}
            <button
              onClick={() => setShowAllTypes((v) => !v)}
              className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              {showAllTypes ? "收起" : "展开全部"}
            </button>
          </div>
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <EmptyState filtered={typeFilter !== "all" || creations.length === 0} />
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {filtered.map((c, i) => (
            <CreationCard key={c.id} creation={c} index={i} />
          ))}
        </div>
      )}
    </>
  );
}

function FilterPill({
  children,
  active,
  onClick,
  icon: Icon,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
        active
          ? "border-orange-500/50 bg-orange-500/15 text-orange-300 shadow-lg shadow-orange-500/10"
          : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function TypePill({
  active,
  onClick,
  emoji,
  label,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition-all ${
        active
          ? "bg-orange-500/15 text-orange-200 ring-1 ring-orange-500/40"
          : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-md flex-col items-center py-32 text-center"
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-500/10 text-orange-400">
        <Sparkles className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-white">
        {filtered ? "没有匹配的作品" : "还没有人发布作品"}
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        {filtered
          ? "试试切换筛选条件，或自己发布一个作品。"
          : "成为第一个在山财地图上画下创意的人吧。"}
      </p>
    </motion.div>
  );
}

