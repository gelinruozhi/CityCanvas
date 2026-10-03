"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  CAMPUS_BUILDINGS,
  CAMPUS_ROADS,
  CAMPUS_LAKE,
  CAMPUS_GREENS,
  CAMPUS_WIDTH,
  CAMPUS_HEIGHT,
} from "@/lib/campus/map-data";
import { getBuildingTypeMeta } from "@/lib/types";

export interface ReadonlyAnnotation {
  id: string;
  x: number;
  y: number;
  title: string;
  buildingType: string;
  aiScore: string | null;
  shape?: string | null;
  radius?: number | null;
  bounds?: string | null;
}

function scoreToColor(score: number | null): string {
  if (score == null) return "#fb923c";
  const hue = Math.round((Math.max(0, Math.min(100, score)) / 100) * 120);
  return `hsl(${hue}, 85%, 55%)`;
}

/** 详情页只读校园画布：自绘底图 + 作品标注（point/circle/rect），支持平移缩放 */
export function CampusReadonly({
  annotations,
  onSelect,
  selectedId,
}: {
  annotations: ReadonlyAnnotation[];
  onSelect?: (a: ReadonlyAnnotation) => void;
  selectedId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  const viewRef = useRef({ cx: 350, cy: 700, s: 0.5 });
  const [, forceRender] = useState(0);
  const panRef = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // 初始视野：包住所有标注与校园
  useEffect(() => {
    const xs = annotations.map((a) => a.x).concat([100, 600]);
    const ys = annotations.map((a) => a.y).concat([100, 1300]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const s = Math.min(
      size.w / (Math.max(...xs) - Math.min(...xs) + 260),
      size.h / (Math.max(...ys) - Math.min(...ys) + 260),
      2
    );
    if (Number.isFinite(s) && s > 0) {
      viewRef.current = { cx, cy, s };
      forceRender((v) => v + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  const view = viewRef.current;
  const proj = useCallback(
    (x: number, y: number): [number, number] => [
      size.w / 2 + (x - view.cx) * view.s,
      size.h / 2 - (y - view.cy) * view.s,
    ],
    [size.w, size.h, view.cx, view.cy, view.s]
  );

  const selected = useMemo(
    () => annotations.find((a) => a.id === selectedId) ?? null,
    [annotations, selectedId]
  );
  let parsedScore: { overallScore: number; rating: string } | null = null;
  if (selected?.aiScore) {
    try {
      parsedScore = JSON.parse(selected.aiScore);
    } catch {}
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-grab overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 active:cursor-grabbing"
      onPointerDown={(e) => {
        panRef.current = { sx: e.clientX, sy: e.clientY, cx: view.cx, cy: view.cy };
      }}
      onPointerMove={(e) => {
        const pan = panRef.current;
        if (!pan) return;
        viewRef.current.cx = pan.cx - (e.clientX - pan.sx) / view.s;
        viewRef.current.cy = pan.cy + (e.clientY - pan.sy) / view.s;
        forceRender((v) => v + 1);
      }}
      onPointerUp={() => (panRef.current = null)}
      onPointerLeave={() => (panRef.current = null)}
    >
      <svg width={size.w} height={size.h} className="block">
        <rect width={size.w} height={size.h} fill="#0a0a0c" />
        <rect {...pxRect(0, 0, CAMPUS_WIDTH, CAMPUS_HEIGHT)} fill="#12211a" stroke="#27272a" strokeWidth={2} rx={14} />
        {CAMPUS_GREENS.map((g, i) => (
          <rect key={i} {...pxRect(g.x, g.y, g.w, g.h)} fill="#153122" rx={18} />
        ))}
        <ellipse
          cx={proj(CAMPUS_LAKE.x, CAMPUS_LAKE.y)[0]}
          cy={proj(CAMPUS_LAKE.x, CAMPUS_LAKE.y)[1]}
          rx={CAMPUS_LAKE.rx * view.s}
          ry={CAMPUS_LAKE.ry * view.s}
          fill="#0c4a6e"
          stroke="#155e75"
        />
        {CAMPUS_ROADS.map((r, i) => (
          <polyline
            key={i}
            points={r.pts.map(([x, y]) => proj(x, y).join(",")).join(" ")}
            fill="none"
            stroke="#3f3f46"
            strokeWidth={r.width * view.s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {CAMPUS_BUILDINGS.filter((b) => b.buildingType === "field").map((b) => {
          const [cx, cy] = proj(b.x, b.y);
          return (
            <g key={b.id}>
              <ellipse
                cx={cx}
                cy={cy}
                rx={(b.size[0] / 2) * view.s}
                ry={(b.size[1] / 2) * view.s}
                fill="#1d2b22"
                stroke="#3f6148"
                strokeWidth={1.5}
              />
              <ellipse cx={cx} cy={cy} rx={((b.size[0] / 2) - 8) * view.s} ry={((b.size[1] / 2) - 6) * view.s} fill="#1a3a2a" />
            </g>
          );
        })}
        {CAMPUS_BUILDINGS.filter((b) => b.buildingType !== "field").map((b) => {
          const meta = getBuildingTypeMeta(b.buildingType);
          const [cx, cy] = proj(b.x, b.y);
          return (
            <rect
              key={b.id}
              x={cx - (b.size[0] * view.s) / 2}
              y={cy - (b.size[1] * view.s) / 2}
              width={b.size[0] * view.s}
              height={b.size[1] * view.s}
              rx={4}
              fill={`${meta.color}2e`}
              stroke={`${meta.color}cc`}
              strokeWidth={1.3}
            />
          );
        })}
        {annotations.map((a) => {
          const color = a.aiScore ? scoreToColor(JSON.parse(a.aiScore).overallScore) : "#fb923c";
          const shape = a.shape ?? "point";
          if (shape === "circle" && a.radius) {
            const [cx, cy] = proj(a.x, a.y);
            return (
              <g key={a.id} onClick={() => onSelectRef.current?.(a)} className="cursor-pointer">
                <circle cx={cx} cy={cy} r={a.radius * view.s} fill={`${color}44`} stroke={color} strokeWidth={2} strokeOpacity={0.95} />
                <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
              </g>
            );
          }
          if (shape === "rect" && a.bounds) {
            try {
              const parsed = JSON.parse(a.bounds);
              const [x1, y1] = proj(parsed.sw[0], parsed.ne[1]);
              const [x2, y2] = proj(parsed.ne[0], parsed.sw[1]);
              return (
                <g key={a.id} onClick={() => onSelectRef.current?.(a)} className="cursor-pointer">
                  <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill={`${color}44`} stroke={color} strokeWidth={2} strokeOpacity={0.95} />
                  <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
                </g>
              );
            } catch {}
          }
          const meta = getBuildingTypeMeta(a.buildingType as never);
          const [px, py] = proj(a.x, a.y);
          return (
            <g key={a.id} onClick={() => onSelectRef.current?.(a)} className="cursor-pointer" transform={`translate(${px},${py})`}>
              <path
                d="M0,0 C-10,-14 -13,-20 -13,-26 A13,13 0 1,1 13,-26 C13,-20 10,-14 0,0 Z"
                fill={color}
                stroke="#fff"
                strokeWidth={2}
                filter="drop-shadow(0 3px 5px rgba(0,0,0,.5))"
              />
              <circle cx={0} cy={-26} r={7} fill="#fff" />
              <text x={0} y={-21.5} textAnchor="middle" fontSize={10} fontWeight={700} fill={color}>
                {meta.emoji}
              </text>
            </g>
          );
        })}
      </svg>
      {/* 选中详情卡 */}
      {selected && (
        <div className="absolute right-3 top-3 z-20 w-[300px] rounded-2xl border border-white/10 bg-zinc-950/90 p-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">{selected.title}</span>
            <button
              onClick={() => onSelectRef.current?.({ ...selected, id: "__close__" } as never)}
              className="text-zinc-500 hover:text-white"
            >
              ✕
            </button>
          </div>
          {parsedScore && (
            <div className="mt-2 text-xs text-orange-300">
              AI 评估 {parsedScore.overallScore} 分 · {parsedScore.rating}
            </div>
          )}
          <div className="mt-1 text-[10px] text-zinc-600">画布位置 x={selected.x.toFixed(0)}m, y={selected.y.toFixed(0)}m</div>
        </div>
      )}
    </div>
  );

  function pxRect(x: number, y: number, w: number, h: number) {
    const [px1, py1] = proj(x, y + h);
    const [px2, py2] = proj(x + w, y);
    return { x: px1, y: py1, width: px2 - px1, height: py1 - py2 };
  }
}
