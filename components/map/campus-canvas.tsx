"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import {
  CAMPUS_BUILDINGS,
  CAMPUS_WIDTH,
  CAMPUS_HEIGHT,
  CAMPUS_ROADS,
  CAMPUS_LAKE,
  CAMPUS_PLAZA,
  CAMPUS_GREENS,
  CAMPUS_FIELDS,
} from "@/lib/campus/map-data";
import { IndoorFloorPlan } from "@/components/map/indoor-floor-plan";
import { getBuildingTypeMeta } from "@/lib/types";
import type { Annotation } from "@/lib/types";

function scoreToColor(score: number | null | undefined): string {
  if (score == null) return "#e2622b";
  const clamped = Math.max(0, Math.min(100, score));
  const hue = Math.round((clamped / 100) * 120);
  return `hsl(${hue}, 65%, 42%)`;
}

/** 校园画布编辑器 —— 按卡通平面图 1:1 自绘（亮色手绘风），pan/zoom + 绘图 + 楼栋交互 */
export function CampusCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1280, h: 720 });
  const viewRef = useRef({ cx: 540, cy: 750, s: 0.85 });
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
  const indoorFloor = useAnnotationStore((s) => s.indoorFloor);

  const drawToolRef = useRef(drawTool);
  drawToolRef.current = drawTool;
  // 调试/校准句柄：window.__ccMap = 地图实例（rerender 引用稳定，仅挂载时执行一次）
  useEffect(() => {
    (window as any).__ccMap = {
      setZoomAndCenter: (z: number, c: [number, number]) => {
        viewRef.current = { cx: c[0], cy: c[1], s: z };
        rerender();
      },
      getZoom: () => viewRef.current.s,
    };
  }, [rerender]);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const downClientRef = useRef<{ x: number; y: number } | null>(null);
  const [drawPreview, setDrawPreview] = useState<
    | { kind: "circle"; x: number; y: number; r: number }
    | { kind: "rect"; sw: [number, number]; ne: [number, number] }
    | null
  >(null);
  const panRef = useRef<{ sx: number; sy: number; cx: number; cy: number; moved: boolean } | null>(null);
  const [hoverBuilding, setHoverBuilding] = useState<string | null>(null);

  // pan/绘制预览的重渲染按帧合并：pointermove 事件频率高于屏幕刷新率时避免重复渲染
  const rafRef = useRef<number | null>(null);
  const rerenderPerFrame = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      rerender();
    });
  }, [rerender]);
  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Esc（全局快捷键）触发的绘图取消
  useEffect(() => {
    const cancel = () => {
      drawStartRef.current = null;
      setDrawPreview(null);
    };
    window.addEventListener("cc-cancel-draw", cancel);
    return () => window.removeEventListener("cc-cancel-draw", cancel);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.cursor =
      drawTool === "circle" || drawTool === "rect" ? "crosshair" : "grab";
  }, [drawTool]);

  const view = viewRef.current;
  const proj = useCallback(
    (x: number, y: number): [number, number] => [
      size.w / 2 + (x - view.cx) * view.s,
      size.h / 2 + (y - view.cy) * view.s,
    ],
    [size.w, size.h, view.cx, view.cy, view.s]
  );
  const unproj = useCallback(
    (px: number, py: number): [number, number] => [
      (px - size.w / 2) / view.s + view.cx,
      (py - size.h / 2) / view.s + view.cy,
    ],
    [size.w, size.h, view.cx, view.cy, view.s]
  );

  // 视野：室外 fit 全画布 / 室内锁定所选建筑放大铺满
  const isIndoor = Boolean(indoorFloor && selectedBuilding);
  useEffect(() => {
    if (!size.w || size.w < 100) return;
    if (isIndoor && selectedBuilding) {
      viewRef.current = {
        cx: selectedBuilding.x,
        cy: selectedBuilding.y,
        s: Math.min(size.w / (selectedBuilding.size[0] + 120), size.h / (selectedBuilding.size[1] + 140)) * 1.6,
      };
    } else {
      viewRef.current = { cx: CAMPUS_WIDTH / 2, cy: CAMPUS_HEIGHT / 2, s: Math.min(size.w / (CAMPUS_WIDTH + 120), size.h / (CAMPUS_HEIGHT + 120)) };
    }
    rerender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIndoor, selectedBuilding?.id, size.w, size.h]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const tool = drawToolRef.current;
    if (tool === "circle" || tool === "rect") {
      // 截图式拖拽绘制：按下即起点，拖动出预览，松开完成（此模式不平移画布）
      const [x, y] = unproj(e.clientX, e.clientY);
      downClientRef.current = { x: e.clientX, y: e.clientY };
      drawStartRef.current = { x, y };
      panRef.current = null;
      return;
    }
    panRef.current = { sx: e.clientX, sy: e.clientY, cx: view.cx, cy: view.cy, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const pan = panRef.current;
    if (pan) {
      const dx = e.clientX - pan.sx;
      const dy = e.clientY - pan.sy;
      if (Math.abs(dx) + Math.abs(dy) > 5) pan.moved = true;
      view.cx = pan.cx - dx / view.s;
      view.cy = pan.cy - dy / view.s;
      rerenderPerFrame();
      return;
    }
    if (drawStartRef.current && (drawToolRef.current === "circle" || drawToolRef.current === "rect")) {
      const [x, y] = unproj(e.clientX, e.clientY);
      const start = drawStartRef.current;
      if (drawToolRef.current === "circle") {
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
  const cancelDraw = () => {
    drawStartRef.current = null;
    downClientRef.current = null;
    setDrawPreview(null);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const tool = drawToolRef.current;
    const start = drawStartRef.current;
    if (start && (tool === "circle" || tool === "rect")) {
      // 拖拽结束 = 完成；几乎没拖动视为误触，静默取消
      const down = downClientRef.current;
      cancelDraw();
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) return;
      const [x, y] = unproj(e.clientX, e.clientY);
      if (tool === "circle") {
        const radius = Math.max(10, Math.round(Math.hypot(x - start.x, y - start.y)));
        openCreateDialog((start.x + x) / 2, (start.y + y) / 2, { shape: "circle", radius });
      } else {
        if (Math.abs(x - start.x) < 8 && Math.abs(y - start.y) < 8) return;
        openCreateDialog((start.x + x) / 2, (start.y + y) / 2, {
          shape: "rect",
          bounds: {
            sw: [Math.min(start.x, x), Math.min(start.y, y)],
            ne: [Math.max(start.x, x), Math.max(start.y, y)],
          },
        });
      }
      return;
    }
    panRef.current = null;
  };
  const onPointerLeave = () => {
    panRef.current = null;
    // 拖拽绘制中拖出画布 → 取消本次绘制
    if (drawStartRef.current) cancelDraw();
  };
  const onWheel = (e: React.WheelEvent) => {
    const factor = Math.pow(1.1, -e.deltaY / 100);
    const next = Math.min(6, Math.max(0.3, view.s * factor));
    const [wx, wy] = unproj(e.clientX, e.clientY);
    view.s = next;
    view.cx = wx - (e.clientX - size.w / 2) / view.s;
    view.cy = wy - (e.clientY - size.h / 2) / view.s;
    rerender();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (panRef.current?.moved) return;
    const [x, y] = unproj(e.clientX, e.clientY);
    const tool = drawToolRef.current;

    if (tool === "circle" || tool === "rect") return; // 拖拽绘制由 pointerdown/move/up 处理

    // 室内模式：楼内点击直接进入创作（跳过建筑命中——命中的只会是自己这栋楼），
    // 楼外点击拦截并提示
    if (isIndoor && selectedBuilding) {
      const b = selectedBuilding;
      const inRoom =
        Math.abs(x - b.x) <= b.size[0] / 2 && Math.abs(y - b.y) <= b.size[1] / 2;
      if (!inRoom) {
        toast.info("室内模式：请点击楼层平面内部添加创意", {
          description: "想改楼外区域？先点「返回室外」",
        });
        return;
      }
      openCreateDialog(x, y);
      return;
    }

    const hit = CAMPUS_BUILDINGS.find((b) => {
      const hw = b.size[0] / 2 + 6;
      const hh = b.size[1] / 2 + 6;
      return Math.abs(x - b.x) <= hw && Math.abs(y - b.y) <= hh;
    });
    if (hit) {
      selectBuilding(hit);
      return;
    }

    // 点空白分级：已有选中（建筑/标注）时，第一下只取消选中（画布软件惯例），
    // 不弹创作窗，避免误触打断；再点一次空白才进入创作
    if (selectedBuilding) {
      selectBuilding(null);
      return;
    }
    if (selectedId) {
      selectAnnotation(null);
      return;
    }

    openCreateDialog(x, y);
  };

  const labelVisible = view.s > 0.4;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onWheel={onWheel}
      onClick={handleClick}
    >
      <svg width={size.w} height={size.h} className="block">
        <defs>
          <pattern id="grass-tex" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="9" r="1.2" fill="#7fb374" opacity={0.5} />
            <circle cx="21" cy="19" r="1.5" fill="#71a966" opacity={0.45} />
            <circle cx="15" cy="26" r="1" fill="#88c07c" opacity={0.5} />
          </pattern>
          <pattern id="indoor-tex" width="44" height="44" patternUnits="userSpaceOnUse">
            <rect width="44" height="44" fill="#f3ecdb" />
            <path d="M0 0H44V44H0Z" fill="none" stroke="#ddd1b8" strokeWidth={1} />
          </pattern>
        </defs>

        {/* 室内模式背景：该楼内部楼层平面 */}
        {isIndoor && (
          <>
            <rect width={size.w} height={size.h} fill="url(#indoor-tex)" />
            {selectedBuilding && indoorFloor && (
              <IndoorFloorPlan building={selectedBuilding} floor={indoorFloor} proj={proj} s={view.s} />
            )}
            {labelVisible && selectedBuilding && indoorFloor && (
              (() => {
                const title = `${selectedBuilding.name} · ${indoorFloor} 室内`;
                const tw = title.length * 15 + 44;
                return (
                  <g className="pointer-events-none">
                    <rect x={size.w / 2 - tw / 2} y={34} width={tw} height={38} rx={19} fill="rgba(24,24,27,0.82)" stroke="rgba(255,255,255,0.12)" />
                    <text x={size.w / 2} y={58} textAnchor="middle" style={{ fontSize: 15, fontWeight: 700, fill: "#f4e9d8" }}>
                      {title}
                    </text>
                  </g>
                );
              })()
            )}
          </>
        )}

        {/* 室外模式背景：自绘草地 + 绿地/湖/广场/道路 */}
        {!isIndoor && (
          <>
            <rect width={size.w} height={size.h} fill="#a8d08d" />
            <rect width={size.w} height={size.h} fill="url(#grass-tex)" />

            {/* 绿地树丛 */}
            {CAMPUS_GREENS.map((g, i) => {
              const [gx, gy] = proj(g.x, g.y);
              return (
                <rect
                  key={`g${i}`}
                  x={gx - (g.w / 2) * view.s}
                  y={gy - (g.h / 2) * view.s}
                  width={g.w * view.s}
                  height={g.h * view.s}
                  rx={Math.max(4, 16 * view.s)}
                  fill="#8fc98a"
                  stroke="#6db26c"
                  strokeWidth={2}
                  opacity={0.9}
                />
              );
            })}

            {/* 景观湖 */}
            <ellipse
              cx={proj(CAMPUS_LAKE.x, CAMPUS_LAKE.y)[0]}
              cy={proj(CAMPUS_LAKE.x, CAMPUS_LAKE.y)[1]}
              rx={CAMPUS_LAKE.rx * view.s}
              ry={CAMPUS_LAKE.ry * view.s}
              fill="#7cc3e8"
              stroke="#4d9fd0"
              strokeWidth={2.5}
            />
            <ellipse
              cx={proj(CAMPUS_LAKE.x, CAMPUS_LAKE.y)[0] - 6 * view.s}
              cy={proj(CAMPUS_LAKE.x, CAMPUS_LAKE.y)[1] - 4 * view.s}
              rx={CAMPUS_LAKE.rx * 0.62 * view.s}
              ry={CAMPUS_LAKE.ry * 0.55 * view.s}
              fill="#93d1ef"
              opacity={0.8}
            />

            {/* 中央广场 */}
            <ellipse
              cx={proj(CAMPUS_PLAZA.x, CAMPUS_PLAZA.y)[0]}
              cy={proj(CAMPUS_PLAZA.x, CAMPUS_PLAZA.y)[1]}
              r={CAMPUS_PLAZA.r * view.s}
              fill="#e9dfc4"
              stroke="#c9b98f"
              strokeWidth={2.5}
            />

            {/* 道路：土色描边 + 米白路面 */}
            {CAMPUS_ROADS.map((r, i) => {
              const d = r.pts
                .map((p, j) => `${j === 0 ? "M" : "L"}${proj(p[0], p[1])[0]},${proj(p[0], p[1])[1]}`)
                .join(" ");
              return (
                <g key={`r${i}`} className="pointer-events-none">
                  <path d={d} fill="none" stroke="#cdbb92" strokeWidth={r.width * view.s + 3} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={d} fill="none" stroke="#fdf6e3" strokeWidth={r.width * view.s} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              );
            })}
          </>
        )}

        {/* 室外专属元素：道路/运动场/树丛/楼栋 —— 室内模式隐藏 */}
        {!isIndoor && (
          <>

        {/* 运动场：橙红跑道 + 绿茵 */}
        {CAMPUS_FIELDS.map((f) => {
          const [cx, cy] = proj(f.x, f.y);
          return (
            <g key={f.id} className="pointer-events-none">
              <ellipse cx={cx} cy={cy} rx={f.rx * view.s} ry={f.ry * view.s} fill="#f0b26a" stroke="#d98f4e" strokeWidth={2.5} />
              <ellipse cx={cx} cy={cy} rx={Math.max(0, (f.rx - 12) * view.s)} ry={Math.max(0, (f.ry - 9) * view.s)} fill="#8bc98a" stroke="#5da85c" strokeWidth={1.5} />
              {labelVisible && (
                <text
                  x={cx}
                  y={cy + 5}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  style={{ fontSize: 13, fontWeight: 700, fill: "#2d5a2a", paintOrder: "stroke", stroke: "#eaf5df", strokeWidth: 3 }}
                >
                  {f.name}
                </text>
              )}
            </g>
          );
        })}

        {/* 楼栋：立体楼块 + 楼内标签 */}
        {CAMPUS_BUILDINGS.filter((b) => b.buildingType === "plaza").map((b) => {
          const [cx, cy] = proj(b.x, b.y);
          return (
            <g key={b.id} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); if (!panRef.current?.moved) return; }}>
              <ellipse cx={cx} cy={cy} rx={(b.size[0] / 2) * view.s} ry={(b.size[1] / 2) * view.s} fill="#7cc3e8" stroke="#4d9fd0" strokeWidth={2.5} />
              {labelVisible && (
                <text x={cx} y={cy + 5} textAnchor="middle" className="pointer-events-none select-none" style={{ fontSize: 12, fontWeight: 700, fill: "#1a5276", paintOrder: "stroke", stroke: "#d6ecf8", strokeWidth: 3 }}>
                  {b.name}
                </text>
              )}
            </g>
          );
        })}
        {CAMPUS_BUILDINGS.filter((b) => b.buildingType !== "field" && b.buildingType !== "plaza").map((b) => {
          const sel = selectedBuilding?.id === b.id;
          const hov = hoverBuilding === b.id;
          const [cx, cy] = proj(b.x, b.y);
          const w = b.size[0] * view.s;
          const h = b.size[1] * view.s;
          const depth = Math.max(4, 7 * Math.min(view.s, 1.2));
          const bodyFill = sel ? "#fcd9a0" : hov ? "#fdf0d2" : "#f5e7c8";
          const edge = sel ? "#c2410c" : "#a8895f";
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
              {/* 立体侧面 */}
              <path
                d={`M${cx - w / 2},${cy - h / 2 + depth} L${cx + w / 2},${cy - h / 2 + depth} L${cx + w / 2},${cy + h / 2 + depth} L${cx - w / 2},${cy + h / 2 + depth} Z`}
                fill="#c9a96e"
                stroke="#a8895f"
                strokeWidth={1}
              />
              {/* 顶面 */}
              <rect
                x={cx - w / 2}
                y={cy - h / 2}
                width={w}
                height={h}
                rx={3}
                fill={bodyFill}
                stroke={edge}
                strokeWidth={sel ? 3 : hov ? 2.2 : 1.6}
              />
              {/* 顶面高光线 */}
              {view.s > 0.55 &&
                Array.from({ length: Math.min(b.floorCount, 5) }, (_, i) => (
                  <line
                    key={i}
                    x1={cx - w / 2 + 5}
                    y1={cy - h / 2 + 5 + ((i * (h - 8)) / Math.min(b.floorCount, 5))}
                    x2={cx + w / 2 - 5}
                    y2={cy - h / 2 + 5 + ((i * (h - 8)) / Math.min(b.floorCount, 5))}
                    stroke="#fff"
                    strokeOpacity={0.5}
                  />
                ))}
              {/* 楼名（楼内，白描边深棕字） */}
              {labelVisible && (
                <text
                  x={cx}
                  y={cy + 5}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  style={{
                    fontSize: Math.max(11, Math.min(16, 13 * Math.min(view.s, 1.1))),
                    fontWeight: 700,
                    fill: "#5a4630",
                    paintOrder: "stroke",
                    stroke: "#fdf6e3",
                    strokeWidth: 3.5,
                  }}
                >
                  {b.name}
                </text>
              )}
              {/* 选中脉冲 */}
              {sel && (
                <rect
                  x={cx - w / 2 - 6}
                  y={cy - h / 2 - 6}
                  width={w + 12}
                  height={h + 12}
                  rx={8}
                  fill="none"
                  stroke="#e2622b"
                  strokeWidth={2.5}
                >
                  <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
                </rect>
              )}
            </g>
          );
        })}

        {/* 标注（室内：仅本楼本层；室外：仅室外无楼层标注） */}
        {annotations
          .filter((a) => (isIndoor ? a.buildingName === selectedBuilding?.name && a.floor === indoorFloor : !a.buildingName))
          .map((a) =>
            a.shape === "circle" ? (
              renderShapeAnnotation(a, a.id === selectedId)
            ) : a.shape === "rect" ? (
              renderRectAnnotation(a, a.id === selectedId)
            ) : (
              renderPointAnnotation(a, a.id === selectedId)
            )
          )}

        {/* 待创建预览 */}
        {pendingPosition && pendingPosition.shape !== "circle" && pendingPosition.shape !== "rect" &&
          renderPendingPoint(pendingPosition.x, pendingPosition.y)}
        {pendingPosition?.shape === "circle" && pendingPosition.radius &&
          (() => {
            const [cx, cy] = proj(pendingPosition.x, pendingPosition.y);
            return (
              <g className="pointer-events-none">
                <circle cx={cx} cy={cy} r={pendingPosition.radius * view.s} fill="#e2622b26" stroke="#c2410c" strokeWidth={3} strokeDasharray="8 5" />
                <circle cx={cx} cy={cy} r={6} fill="#c2410c" stroke="#fff" strokeWidth={2.5} />
              </g>
            );
          })()}
        {pendingPosition?.shape === "rect" && pendingPosition.bounds &&
          (() => {
            const [x1, y1] = proj(pendingPosition.bounds.sw[0], pendingPosition.bounds.ne[1]);
            const [x2, y2] = proj(pendingPosition.bounds.ne[0], pendingPosition.bounds.sw[1]);
            return (
              <g className="pointer-events-none">
                <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="#e2622b26" stroke="#c2410c" strokeWidth={3} strokeDasharray="8 5" />
                <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={6} fill="#c2410c" stroke="#fff" strokeWidth={2.5} />
              </g>
            );
          })()}
        {drawPreview?.kind === "circle" &&
          (() => {
            const [cx, cy] = proj(drawPreview.x, drawPreview.y);
            return (
              <g className="pointer-events-none">
                <circle cx={cx} cy={cy} r={drawPreview.r * view.s} fill="#e2622b30" stroke="#c2410c" strokeWidth={3} strokeDasharray="8 5" />
              </g>
            );
          })()}
        {drawPreview?.kind === "rect" &&
          (() => {
            const [x1, y1] = proj(drawPreview.sw[0], drawPreview.ne[1]);
            const [x2, y2] = proj(drawPreview.ne[0], drawPreview.sw[1]);
            return (
              <g className="pointer-events-none">
                <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="#e2622b30" stroke="#c2410c" strokeWidth={3} strokeDasharray="8 5" />
              </g>
            );
          })()}
        </>
        )}
      </svg>
    </div>
  );

  function renderShapeAnnotation(a: Annotation, selected: boolean) {
    const color = a.aiScore ? scoreToColor(a.aiScore.overallScore) : "#c2410c";
    const [cx, cy] = proj(a.x, a.y);
    return (
      <g key={a.id} onClick={(e) => { e.stopPropagation(); if (!panRef.current?.moved) selectAnnotation(a.id); }} className="cursor-pointer">
        <circle cx={cx} cy={cy} r={(a.radius ?? 60) * view.s} fill={`${color}45`} stroke={color} strokeWidth={selected ? 4 : 3} strokeOpacity={0.95} />
        <circle cx={cx} cy={cy} r={6} fill={color} stroke="#fff" strokeWidth={2.5} />
      </g>
    );
  }

  function renderRectAnnotation(a: Annotation, selected: boolean) {
    const color = a.aiScore ? scoreToColor(a.aiScore.overallScore) : "#c2410c";
    if (!a.bounds) return null;
    const [x1, y1] = proj(a.bounds.sw[0], a.bounds.ne[1]);
    const [x2, y2] = proj(a.bounds.ne[0], a.bounds.sw[1]);
    return (
      <g key={a.id} onClick={(e) => { e.stopPropagation(); if (!panRef.current?.moved) selectAnnotation(a.id); }} className="cursor-pointer">
        <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill={`${color}45`} stroke={color} strokeWidth={selected ? 4 : 3} strokeOpacity={0.95} />
        <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={6} fill={color} stroke="#fff" strokeWidth={2.5} />
      </g>
    );
  }

  function renderPointAnnotation(a: Annotation, selected: boolean) {
    const meta = getBuildingTypeMeta(a.buildingType);
    const color = a.aiScore ? scoreToColor(a.aiScore.overallScore) : "#c2410c";
    const [px, py] = proj(a.x, a.y);
    const scale = selected ? 1.18 : 1;
    return (
      <g
        key={a.id}
        onClick={(e) => { e.stopPropagation(); if (!panRef.current?.moved) selectAnnotation(a.id); }}
        className="cursor-pointer"
        transform={`translate(${px},${py}) scale(${scale})`}
      >
        <ellipse cx={0} cy={2} rx={10} ry={4} fill="rgba(0,0,0,0.28)" />
        <path d="M0,0 C-10,-13 -13,-19 -13,-26 A13,13 0 1,1 13,-26 C13,-19 10,-13 0,0 Z" fill={color} stroke="#fff" strokeWidth={2.2} filter="drop-shadow(0 2px 4px rgba(0,0,0,.35))" />
        <circle cx={0} cy={-26} r={7} fill="#fff" />
        <text x={0} y={-21.5} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={color}>
          {meta.emoji}
        </text>
        {a.floor && (
          <text x={0} y={-42} textAnchor="middle" fontSize={11} fontWeight={700} fill="#5a4630" paintOrder="stroke" stroke="#fdf6e3" strokeWidth={3.5}>
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
        <circle cx={px} cy={py} r={20} fill="#c2410c">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <circle cx={px} cy={py} r={9} fill="#c2410c" stroke="#fff" strokeWidth={3.5} />
      </g>
    );
  }
}
