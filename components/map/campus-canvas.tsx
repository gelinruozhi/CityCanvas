"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import {
  CAMPUS_BUILDINGS,
  CAMPUS_ROADS,
  CAMPUS_LAKE,
  CAMPUS_GREENS,
  CAMPUS_WIDTH,
  CAMPUS_HEIGHT,
} from "@/lib/campus/map-data";
import { getBuildingTypeMeta } from "@/lib/types";
import type { Annotation, ShapeBounds } from "@/lib/types";

function scoreToColor(score: number | null | undefined): string {
  if (score == null) return "#e2622b";
  const clamped = Math.max(0, Math.min(100, score));
  const hue = Math.round((clamped / 100) * 120);
  return `hsl(${hue}, 72%, 46%)`;
}

const C = {
  grass: "#a9cd9f",
  road: "#fdfbf4",
  roadEdge: "#d9d2bd",
  roadLine: "#e8b84b",
  water: "#8fc7e8",
  waterEdge: "#5fa8d3",
  buildingBody: "#f6ecd8",
  buildingEdge: "#9a8464",
  buildingShadow: "rgba(90,70,40,0.28)",
  label: "#4a3b28",
  track: "#e8865a",
  field: "#7cbf6e",
};

/** 校园画布编辑器：亮色手绘风自绘 SVG（米坐标系），pan/zoom + 绘图 + 楼栋交互 */
export function CampusCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1280, h: 720 });
  const viewRef = useRef({ cx: 350, cy: 700, s: 1.15 });
  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((v) => v + 1), []);

  const annotations = useAnnotationStore((s) => s.annotations);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const pendingPosition = useAnnotationStore((s) => s.pendingPosition);
  const drawTool = useAnnotationStore((s) => s.drawTool);
  const openCreateDialog = useAnnotationStore((s) => s.openCreateDialog);
  const selectAnnotation = useAnnotationStore((s) => s.selectAnnotation);
  const selectedBuilding = useAnnotationStore((s) => s.selectedBuilding);
  const selectBuilding = useAnnotationStore((s) => s.selectBuilding);

  const drawToolRef = useRef(drawTool);
  drawToolRef.current = drawTool;
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const [drawPreview, setDrawPreview] = useState<
    | { kind: "circle"; x: number; y: number; r: number }
    | { kind: "rect"; sw: [number, number]; ne: [number, number] }
    | null
  >(null);
  const panRef = useRef<{ sx: number; sy: number; cx: number; cy: number; moved: boolean } | null>(null);
  const [hoverBuilding, setHoverBuilding] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    const s = Math.min(el.clientWidth / 820, el.clientHeight / 1060);
    viewRef.current = { cx: 290, cy: 780, s: Math.max(0.95, s) };
    rerender();
    return () => ro.disconnect();
  }, [rerender]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.cursor =
      drawTool === "circle" || drawTool === "rect" ? "crosshair" : "grab";
  }, [drawTool]);

  const view = viewRef.current;
  const proj = useCallback(
    (x: number, y: number): [number, number] => [
      size.w / 2 + (x - view.cx) * view.s,
      size.h / 2 - (y - view.cy) * view.s,
    ],
    [size.w, size.h, view.cx, view.cy, view.s]
  );
  const unproj = useCallback(
    (px: number, py: number): [number, number] => [
      (px - size.w / 2) / view.s + view.cx,
      view.cy - (py - size.h / 2) / view.s,
    ],
    [size.w, size.h, view.cx, view.cy, view.s]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    panRef.current = { sx: e.clientX, sy: e.clientY, cx: view.cx, cy: view.cy, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const pan = panRef.current;
    if (pan) {
      const dx = e.clientX - pan.sx;
      const dy = e.clientY - pan.sy;
      if (Math.abs(dx) + Math.abs(dy) > 5) pan.moved = true;
      view.cx = pan.cx - dx / view.s;
      view.cy = pan.cy + dy / view.s;
      rerender();
      return;
    }
    if (drawStartRef.current && (drawTool === "circle" || drawTool === "rect")) {
      const [x, y] = unproj(e.clientX, e.clientY);
      const start = drawStartRef.current;
      if (drawTool === "circle") {
        setDrawPreview({ kind: "circle", x: start.x, y: start.y, r: Math.max(5, Math.hypot(x - start.x, y - start.y)) });
      } else {
        setDrawPreview({
          kind: "rect",
          sw: [Math.min(start.x, x), Math.min(start.y, y)],
          ne: [Math.max(start.x, x), Math.max(start.y, y)],
        });
      }
    }
  };
  const onPointerUp = () => (panRef.current = null);
  const onWheel = (e: React.WheelEvent) => {
    const factor = Math.pow(1.1, -e.deltaY / 100);
    const next = Math.min(8, Math.max(0.25, view.s * factor));
    const [wx, wy] = unproj(e.clientX, e.clientY);
    view.s = next;
    view.cx = wx - (e.clientX - size.w / 2) / view.s;
    view.cy = wy + (e.clientY - size.h / 2) / view.s;
    rerender();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (panRef.current?.moved) return;
    const [x, y] = unproj(e.clientX, e.clientY);
    const tool = drawToolRef.current;

    if (tool === "circle" || tool === "rect") {
      if (!drawStartRef.current) {
        drawStartRef.current = { x, y };
        return;
      }
      const start = drawStartRef.current;
      drawStartRef.current = null;
      setDrawPreview(null);
      if (tool === "circle") {
        const radius = Math.max(10, Math.round(Math.hypot(x - start.x, y - start.y)));
        openCreateDialog((start.x + x) / 2, (start.y + y) / 2, { shape: "circle", radius });
      } else {
        const bounds: ShapeBounds = {
          sw: [Math.min(start.x, x), Math.min(start.y, y)],
          ne: [Math.max(start.x, x), Math.max(start.y, y)],
        };
        openCreateDialog((start.x + x) / 2, (start.y + y) / 2, { shape: "rect", bounds });
      }
      return;
    }

    const hit = CAMPUS_BUILDINGS.find((b) => {
      const hw = b.size[0] / 2 + 8;
      const hh = b.size[1] / 2 + 8;
      return Math.abs(x - b.x) <= hw && Math.abs(y - b.y) <= hh;
    });
    if (hit) {
      selectBuilding(hit);
      return;
    }
    openCreateDialog(x, y);
  };

  const labelVisible = view.s > 0.75;
  const shortName = (n: string) =>
    n
      .replace(/一号/, "1号")
      .replace(/二号/, "2号")
      .replace(/三号/, "3号")
      .replace(/四号/, "4号")
      .replace(/五号/, "5号")
      .replace(/六号/, "6号")
      .replace(/七号/, "7号")
      .replace(/八号/, "8号")
      .replace(/九号/, "9号")
      .replace(/学生公寓/, "公寓");

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      onClick={handleClick}
    >
      <svg width={size.w} height={size.h} className="block">
        <defs>
          <pattern id="grass-tex" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="8" r="1.1" fill="#8fbb84" opacity={0.5} />
            <circle cx="19" cy="17" r="1.4" fill="#83b078" opacity={0.45} />
            <circle cx="13" cy="23" r="0.9" fill="#9ac78f" opacity={0.5} />
          </pattern>
        </defs>

        <rect width={size.w} height={size.h} fill={C.grass} />
        <rect width={size.w} height={size.h} fill="url(#grass-tex)" />

        {(() => {
          const [x1, y1] = proj(0, CAMPUS_HEIGHT);
          const [x2, y2] = proj(CAMPUS_WIDTH, 0);
          return (
            <>
              <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="#b4d6a8" stroke="#7ba36f" strokeWidth={2.5} rx={6} />
              {CAMPUS_GREENS.map((g, i) => {
                const [gx, gy] = proj(g.x, g.y + g.h);
                return (
                  <g key={i}>
                    <rect x={gx} y={gy} width={g.w * view.s} height={g.h * view.s} fill="#9cc791" rx={14} />
                    {[0.3, 0.62].map((fx, fi) => (
                      <g key={fi}>
                        <circle cx={gx + g.w * view.s * fx} cy={gy + g.h * view.s * (0.4 + fi * 0.3)} r={7 * Math.min(view.s, 1.4)} fill="#6ba862" />
                        <circle cx={gx + g.w * view.s * fx + 2} cy={gy + g.h * view.s * (0.4 + fi * 0.3) - 2} r={5 * Math.min(view.s, 1.4)} fill="#7fb974" />
                      </g>
                    ))}
                  </g>
                );
              })}
            </>
          );
        })()}

        <ellipse
          cx={proj(CAMPUS_LAKE.x, CAMPUS_LAKE.y)[0]}
          cy={proj(CAMPUS_LAKE.x, CAMPUS_LAKE.y)[1]}
          rx={CAMPUS_LAKE.rx * view.s}
          ry={CAMPUS_LAKE.ry * view.s}
          fill={C.water}
          stroke={C.waterEdge}
          strokeWidth={2.5}
        />
        <ellipse
          cx={proj(CAMPUS_LAKE.x - 8, CAMPUS_LAKE.y + 4)[0]}
          cy={proj(CAMPUS_LAKE.x - 8, CAMPUS_LAKE.y + 4)[1]}
          rx={CAMPUS_LAKE.rx * 0.55 * view.s}
          ry={CAMPUS_LAKE.ry * 0.45 * view.s}
          fill="#a8d4ef"
          opacity={0.8}
        />

        {CAMPUS_ROADS.map((r, i) => (
          <g key={i}>
            <polyline
              points={r.pts.map(([x, y]) => proj(x, y).join(",")).join(" ")}
              fill="none"
              stroke={C.roadEdge}
              strokeWidth={(r.width + 3) * view.s}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={r.pts.map(([x, y]) => proj(x, y).join(",")).join(" ")}
              fill="none"
              stroke={C.road}
              strokeWidth={r.width * view.s}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={r.pts.map(([x, y]) => proj(x, y).join(",")).join(" ")}
              fill="none"
              stroke={C.roadLine}
              strokeWidth={1.2}
              strokeDasharray={`${6 * view.s} ${5 * view.s}`}
              opacity={0.85}
            />
          </g>
        ))}

        {CAMPUS_BUILDINGS.filter((b) => b.buildingType === "field").map((b) => {
          const [cx, cy] = proj(b.x, b.y);
          const sel = selectedBuilding?.id === b.id;
          void 0;
          return (
            <g key={b.id} onClick={() => selectBuilding(b)} className="cursor-pointer">
              <ellipse
                cx={cx}
                cy={cy}
                rx={(b.size[0] / 2) * view.s}
                ry={(b.size[1] / 2) * view.s}
                fill={C.track}
                stroke={sel ? "#e2622b" : "#c96a3e"}
                strokeWidth={sel ? 3 : 2}
              />
              <ellipse
                cx={cx}
                cy={cy}
                rx={Math.max(0, (b.size[0] / 2 - 7) * view.s)}
                ry={Math.max(0, (b.size[1] / 2 - 6) * view.s)}
                fill={C.field}
              />
              {labelVisible && (
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  style={{ fontSize: 11, fontWeight: 700, fill: "#3d5c33", paintOrder: "stroke", stroke: "#fff", strokeWidth: 2.5 }}
                >
                  {b.name}
                </text>
              )}
            </g>
          );
        })}

        {CAMPUS_BUILDINGS.filter((b) => b.buildingType !== "field").map((b) => {
          const sel = selectedBuilding?.id === b.id;
          const hov = hoverBuilding === b.id;
          const [cx, cy] = proj(b.x, b.y);
          const w = b.size[0] * view.s;
          const h = b.size[1] * view.s;
          const bodyFill = sel ? "#ffd9a8" : hov ? "#fdf3dd" : C.buildingBody;
          const edge = sel ? "#e2622b" : C.buildingEdge;
          return (
            <g
              key={b.id}
              onClick={(e) => {
                e.stopPropagation();
                if (panRef.current?.moved) return;
                selectBuilding(b);
              }}
              onPointerEnter={() => setHoverBuilding(b.id)}
              onPointerLeave={() => setHoverBuilding(null)}
              className="cursor-pointer"
            >
              <rect x={cx - w / 2 + 4} y={cy - h / 2 + 6} width={w} height={h} rx={5} fill={C.buildingShadow} />
              <rect
                x={cx - w / 2}
                y={cy - h / 2}
                width={w}
                height={h}
                rx={5}
                fill={bodyFill}
                stroke={edge}
                strokeWidth={sel ? 2.6 : hov ? 2 : 1.5}
              />
              {view.s > 0.9 &&
                Array.from({ length: Math.min(b.floorCount, 6) - 1 }, (_, i) => (
                  <line
                    key={i}
                    x1={cx - w / 2 + 4}
                    y1={cy - h / 2 + ((i + 1) * h) / Math.min(b.floorCount, 6)}
                    x2={cx + w / 2 - 4}
                    y2={cy - h / 2 + ((i + 1) * h) / Math.min(b.floorCount, 6)}
                    stroke={edge}
                    strokeOpacity={0.35}
                  />
                ))}
              {labelVisible && (
                <text
                  x={cx}
                  y={cy + h / 2 + 13}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    fill: C.label,
                    paintOrder: "stroke",
                    stroke: "#fdfbf4",
                    strokeWidth: 3.5,
                  }}
                >
                  {shortName(b.name)}
                </text>
              )}
              {sel && (
                <circle cx={cx} cy={cy} r={Math.max(w, h) * 0.7} fill="none" stroke="#e2622b" strokeWidth={2}>
                  <animate attributeName="r" values={`${Math.max(w, h) * 0.5};${Math.max(w, h) * 0.9}`} dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}

        {annotations.filter((a) => a.shape === "circle").map((a) => renderShapeAnnotation(a, a.id === selectedId))}
        {annotations.filter((a) => a.shape === "rect").map((a) => renderRectAnnotation(a, a.id === selectedId))}
        {annotations.filter((a) => a.shape === "point").map((a) => renderPointAnnotation(a, a.id === selectedId))}

        {pendingPosition && pendingPosition.shape !== "circle" && pendingPosition.shape !== "rect" &&
          renderPendingPoint(pendingPosition.x, pendingPosition.y)}
        {pendingPosition?.shape === "circle" && pendingPosition.radius &&
          (() => {
            const [cx, cy] = proj(pendingPosition.x, pendingPosition.y);
            return (
              <g className="pointer-events-none">
                <circle cx={cx} cy={cy} r={pendingPosition.radius * view.s} fill="#e2622b1f" stroke="#e2622b" strokeWidth={2.5} strokeDasharray="7 5" />
                <circle cx={cx} cy={cy} r={5} fill="#e2622b" stroke="#fff" strokeWidth={2} />
              </g>
            );
          })()}
        {pendingPosition?.shape === "rect" && pendingPosition.bounds &&
          (() => {
            const [x1, y1] = proj(pendingPosition.bounds.sw[0], pendingPosition.bounds.ne[1]);
            const [x2, y2] = proj(pendingPosition.bounds.ne[0], pendingPosition.bounds.sw[1]);
            return (
              <g className="pointer-events-none">
                <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="#e2622b1f" stroke="#e2622b" strokeWidth={2.5} strokeDasharray="7 5" />
                <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={5} fill="#e2622b" stroke="#fff" strokeWidth={2} />
              </g>
            );
          })()}
        {drawPreview?.kind === "circle" &&
          (() => {
            const [cx, cy] = proj(drawPreview.x, drawPreview.y);
            return (
              <g className="pointer-events-none">
                <circle cx={cx} cy={cy} r={drawPreview.r * view.s} fill="#e2622b26" stroke="#e2622b" strokeWidth={2.5} strokeDasharray="7 5" />
              </g>
            );
          })()}
        {drawPreview?.kind === "rect" &&
          (() => {
            const [x1, y1] = proj(drawPreview.sw[0], drawPreview.ne[1]);
            const [x2, y2] = proj(drawPreview.ne[0], drawPreview.sw[1]);
            return (
              <g className="pointer-events-none">
                <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="#e2622b26" stroke="#e2622b" strokeWidth={2.5} strokeDasharray="7 5" />
              </g>
            );
          })()}
      </svg>
    </div>
  );


  function renderShapeAnnotation(a: Annotation, selected: boolean) {
    const color = a.aiScore ? scoreToColor(a.aiScore.overallScore) : "#e2622b";
    const [cx, cy] = proj(a.x, a.y);
    return (
      <g key={a.id} onClick={(e) => { e.stopPropagation(); if (!panRef.current?.moved) selectAnnotation(a.id); }} className="cursor-pointer">
        <circle cx={cx} cy={cy} r={(a.radius ?? 60) * view.s} fill={`${color}40`} stroke={color} strokeWidth={selected ? 3.5 : 2.5} strokeOpacity={0.95} />
        <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />
      </g>
    );
  }

  function renderRectAnnotation(a: Annotation, selected: boolean) {
    const color = a.aiScore ? scoreToColor(a.aiScore.overallScore) : "#e2622b";
    if (!a.bounds) return null;
    const [x1, y1] = proj(a.bounds.sw[0], a.bounds.ne[1]);
    const [x2, y2] = proj(a.bounds.ne[0], a.bounds.sw[1]);
    return (
      <g key={a.id} onClick={(e) => { e.stopPropagation(); if (!panRef.current?.moved) selectAnnotation(a.id); }} className="cursor-pointer">
        <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill={`${color}40`} stroke={color} strokeWidth={selected ? 3.5 : 2.5} strokeOpacity={0.95} />
        <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={5} fill={color} stroke="#fff" strokeWidth={2} />
      </g>
    );
  }

  function renderPointAnnotation(a: Annotation, selected: boolean) {
    const meta = getBuildingTypeMeta(a.buildingType);
    const color = a.aiScore ? scoreToColor(a.aiScore.overallScore) : "#e2622b";
    const [px, py] = proj(a.x, a.y);
    const scale = selected ? 1.18 : 1;
    return (
      <g
        key={a.id}
        onClick={(e) => { e.stopPropagation(); if (!panRef.current?.moved) selectAnnotation(a.id); }}
        className="cursor-pointer"
        transform={`translate(${px},${py}) scale(${scale})`}
      >
        <ellipse cx={0} cy={2} rx={9} ry={3.5} fill="rgba(0,0,0,0.25)" />
        <path d="M0,0 C-9,-12 -12,-18 -12,-24 A12,12 0 1,1 12,-24 C12,-18 9,-12 0,0 Z" fill={color} stroke="#fff" strokeWidth={2} filter="drop-shadow(0 2px 4px rgba(0,0,0,.35))" />
        <circle cx={0} cy={-24} r={6.5} fill="#fff" />
        <text x={0} y={-20} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={color}>
          {meta.emoji}
        </text>
        {a.floor && (
          <text x={0} y={-38} textAnchor="middle" fontSize={10} fontWeight={700} fill="#4a3b28" paintOrder="stroke" stroke="#fdfbf4" strokeWidth={3}>
            {a.buildingName?.replace(/山东财经大学(圣井|章丘)校区/, "")}·{a.floor}
          </text>
        )}
      </g>
    );
  }

  function renderPendingPoint(x: number, y: number) {
    const [px, py] = proj(x, y);
    return (
      <g className="pointer-events-none">
        <circle cx={px} cy={py} r={60 * view.s} fill="none" stroke="#e2622b" strokeOpacity={0.55} strokeWidth={1.6} strokeDasharray="6 4" />
        <circle cx={px} cy={py} r={16} fill="#e2622b">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <circle cx={px} cy={py} r={8} fill="#e2622b" stroke="#fff" strokeWidth={3} />
      </g>
    );
  }
}
