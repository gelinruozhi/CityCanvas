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
  if (score == null) return "#fb923c";
  const clamped = Math.max(0, Math.min(100, score));
  const hue = Math.round((clamped / 100) * 120);
  return `hsl(${hue}, 85%, 55%)`;
}

/** 编辑器画布：校园自绘 SVG（米坐标系），替代高德地图 */
export function CampusCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1280, h: 720 });
  // 视口：中心（画布米坐标）+ 比例（px/m）
  const viewRef = useRef({ cx: 350, cy: 700, s: 0.6 });
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
  
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const [drawPreview, setDrawPreview] = useState<
    | { kind: "circle"; x: number; y: number; r: number }
    | { kind: "rect"; sw: [number, number]; ne: [number, number] }
    | null
  >(null);
  const panRef = useRef<{ sx: number; sy: number; cx: number; cy: number; moved: boolean } | null>(null);

  // 尺寸自适应
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    // 初始视野：让全校进入画面并居中
    const s = Math.min(el.clientWidth / 780, el.clientHeight / 1480);
    viewRef.current = { cx: CAMPUS_WIDTH / 2, cy: CAMPUS_HEIGHT / 2, s };
    rerender();
    return () => ro.disconnect();
  }, [rerender]);

  // 绘图工具光标
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.cursor =
      drawTool === "circle" || drawTool === "rect" ? "crosshair" : "default";
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

  // ===== 交互 =====
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
    // 绘制预览（circle/rect 第一次点击后）
    if (drawStartRef.current && (drawTool === "circle" || drawTool === "rect")) {
      const [x, y] = unproj(e.clientX, e.clientY);
      const start = drawStartRef.current;
      if (drawTool === "circle") {
        setDrawPreview({
          kind: "circle",
          x: start.x,
          y: start.y,
          r: Math.max(5, Math.hypot(x - start.x, y - start.y)),
        });
      } else {
        setDrawPreview({
          kind: "rect",
          sw: [Math.min(start.x, x), Math.min(start.y, y)],
          ne: [Math.max(start.x, x), Math.max(start.y, y)],
        });
      }
    }
  };
  const onPointerUp = () => {
    panRef.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    const factor = Math.pow(1.1, -e.deltaY / 100);
    const next = Math.min(8, Math.max(0.25, view.s * factor));
    // 以鼠标位置为中心缩放
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

    // 圆/矩形：两次点击
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

    // 点位工具：优先命中建筑（点击点在楼体矩形外扩 8m 内）
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

  drawToolRef.current = drawTool;

  // ===== 渲染 =====
  const labelVisible = view.s > 0.85; // 比例足够大才显示建筑名

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-zinc-950"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      onClick={handleClick}
    >
      <svg width={size.w} height={size.h} className="block">
        {/* 背景 */}
        <rect width={size.w} height={size.h} fill="#0a0a0c" />
        {/* 校园地块 */}
        <rect
          {...pxRect(0, 0, CAMPUS_WIDTH, CAMPUS_HEIGHT)}
          fill="#131f16"
          stroke="#3f3f46"
          strokeWidth={2}
          rx={14}
        />
        {/* 绿地 */}
        {CAMPUS_GREENS.map((g, i) => (
          <rect key={i} {...pxRect(g.x, g.y, g.w, g.h)} fill="#1c3a28" rx={18} />
        ))}
        {/* 湖 */}
        <ellipse
          cx={proj(CAMPUS_LAKE.x, CAMPUS_LAKE.y)[0]}
          cy={proj(CAMPUS_LAKE.x, CAMPUS_LAKE.y)[1]}
          rx={CAMPUS_LAKE.rx * view.s}
          ry={CAMPUS_LAKE.ry * view.s}
          fill="#0c4a6e"
          stroke="#155e75"
          strokeWidth={1.5}
        />
        {/* 道路 */}
        {CAMPUS_ROADS.map((r, i) => (
          <polyline
            key={i}
            points={r.pts.map(([x, y]) => proj(x, y).join(",")).join(" ")}
            fill="none"
            stroke="#52525b"
            strokeWidth={r.width * view.s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* 运动场 */}
        {CAMPUS_BUILDINGS.filter((b) => b.buildingType === "field").map((b) => {
          const [cx, cy] = proj(b.x, b.y);
          return (
            <g key={b.id} onClick={() => selectBuilding(b)} className="cursor-pointer">
              <ellipse
                cx={cx}
                cy={cy}
                rx={(b.size[0] / 2) * view.s}
                ry={(b.size[1] / 2) * view.s}
                fill={selectedBuilding?.id === b.id ? "#fb923c22" : "#1d2b22"}
                stroke={selectedBuilding?.id === b.id ? "#fb923c" : "#3f6148"}
                strokeWidth={selectedBuilding?.id === b.id ? 2.5 : 1.5}
              />
              <ellipse
                cx={cx}
                cy={cy}
                rx={(b.size[0] / 2 - 8) * view.s}
                ry={(b.size[1] / 2 - 6) * view.s}
                fill="#1a3a2a"
              />
            </g>
          );
        })}
        {/* 楼栋 */}
        {CAMPUS_BUILDINGS.filter((b) => b.buildingType !== "field").map((b) => {
          const meta = getBuildingTypeMeta(b.buildingType);
          const isSelected = selectedBuilding?.id === b.id;
          const [cx, cy] = proj(b.x, b.y);
          const w = b.size[0] * view.s;
          const h = b.size[1] * view.s;
          return (
            <g
              key={b.id}
              onClick={(e) => {
                e.stopPropagation();
                if (panRef.current?.moved) return;
                selectBuilding(b);
              }}
              className="cursor-pointer"
            >
              <rect
                x={cx - w / 2}
                y={cy - h / 2}
                width={w}
                height={h}
                rx={4}
                fill={isSelected ? "#fb923c44" : `${meta.color}55`}
                stroke={isSelected ? "#fb923c" : `${meta.color}cc`}
                strokeWidth={isSelected ? 2.4 : 1.3}
              />
              {/* 楼层指示线 */}
              {view.s > 1.2 &&
                Array.from({ length: b.floorCount - 1 }, (_, i) => (
                  <line
                    key={i}
                    x1={cx - w / 2 + 3}
                    y1={cy - h / 2 + ((i + 1) * h) / b.floorCount}
                    x2={cx + w / 2 - 3}
                    y2={cy - h / 2 + ((i + 1) * h) / b.floorCount}
                    stroke="#ffffff"
                    strokeOpacity={0.08}
                  />
                ))}
            </g>
          );
        })}
        {/* 建筑名称标签 */}
        {CAMPUS_BUILDINGS.map((b) => {
          const [x, y] = proj(b.x, b.y - b.size[1] / 2 - (labelVisible ? 6 : 0));
          const shortName = b.name.replace(/\(.*?\)/g, "");
          if (x < -40 || x > size.w + 40 || y < -20 || y > size.h + 20) return null;
          return (
            <text
              key={`t-${b.id}`}
              x={x}
              y={y}
              textAnchor="middle"
              className="pointer-events-none select-none"
              style={{
                fontSize: 11,
                fontWeight: 600,
                fill: "#e4e4e7",
                paintOrder: "stroke",
                stroke: "#09090b",
                strokeWidth: 3,
                strokeLinejoin: "round",
                opacity: labelVisible ? 0.95 : 0.55,
              }}
            >
              {shortName}
            </text>
          );
        })}
        {/* 用户标注：circle / rect */}
        {annotations
          .filter((a) => a.shape === "circle")
          .map((a) => renderShapeAnnotation(a, proj, a.id === selectedId))}
        {annotations
          .filter((a) => a.shape === "rect")
          .map((a) => renderRectAnnotation(a, proj, a.id === selectedId))}
        {/* 用户标注：point marker */}
        {annotations
          .filter((a) => a.shape === "point")
          .map((a) => renderPointAnnotation(a, proj, a.id === selectedId))}
        {/* 待创建预览（point） */}
        {pendingPosition?.shape !== "circle" &&
          pendingPosition?.shape !== "rect" &&
          pendingPosition &&
          renderPendingPoint(pendingPosition.x, pendingPosition.y, proj)}
        {/* 待创建预览（circle/rect） */}
        {pendingPosition?.shape === "circle" && pendingPosition.radius && (
          <circle
            {...(() => {
              const [cx, cy] = proj(pendingPosition.x, pendingPosition.y);
              return { cx, cy };
            })()}
            r={pendingPosition.radius * view.s}
            fill="#fb923c14"
            stroke="#fb923c"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            className="pointer-events-none"
          />
        )}
        {pendingPosition?.shape === "rect" && pendingPosition.bounds && (() => {
          const [x1, y1] = proj(pendingPosition.bounds.sw[0], pendingPosition.bounds.ne[1]);
          const [x2, y2] = proj(pendingPosition.bounds.ne[0], pendingPosition.bounds.sw[1]);
          return (
            <rect
              x={x1}
              y={y1}
              width={x2 - x1}
              height={y2 - y1}
              fill="#fb923c14"
              stroke="#fb923c"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              className="pointer-events-none"
            />
          );
        })()}
        {/* 绘制预览 */}
        {drawPreview?.kind === "circle" &&
          (() => {
            const [cx, cy] = proj(drawPreview.x, drawPreview.y);
            return (
              <circle
                cx={cx}
                cy={cy}
                r={drawPreview.r * view.s}
                fill="#fb923c1e"
                stroke="#fb923c"
                strokeWidth={2}
                strokeDasharray="6 4"
                className="pointer-events-none"
              />
            );
          })()}
        {drawPreview?.kind === "rect" &&
          (() => {
            const [x1, y1] = proj(drawPreview.sw[0], drawPreview.ne[1]);
            const [x2, y2] = proj(drawPreview.ne[0], drawPreview.sw[1]);
            return (
              <rect
                x={x1}
                y={y1}
                width={x2 - x1}
                height={y2 - y1}
                fill="#fb923c1e"
                stroke="#fb923c"
                strokeWidth={2}
                strokeDasharray="6 4"
                className="pointer-events-none"
              />
            );
          })()}
      </svg>
    </div>
  );

  // ===== 子渲染函数 =====
  function pxRect(x: number, y: number, w: number, h: number) {
    const [px1, py1] = proj(x, y + h);
    const [px2, py2] = proj(x + w, y);
    return { x: px1, y: py1, width: px2 - px1, height: py1 - py2 };
  }

  function renderShapeAnnotation(
    a: Annotation,
    proj: (x: number, y: number) => [number, number],
    selected: boolean
  ) {
    const color = a.aiScore ? scoreToColor(a.aiScore.overallScore) : "#fb923c";
    const [cx, cy] = proj(a.x, a.y);
    return (
      <g
        key={a.id}
        onClick={(e) => {
          e.stopPropagation();
          if (!panRef.current?.moved) selectAnnotation(a.id);
        }}
        className="cursor-pointer"
      >
        <circle
          cx={cx}
          cy={cy}
          r={(a.radius ?? 60) * view.s}
          fill={`${color}${selected ? "59" : "2b"}`}
          stroke={color}
          strokeWidth={selected ? 3 : 2}
          strokeOpacity={0.95}
        />
        <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
      </g>
    );
  }

  function renderRectAnnotation(
    a: Annotation,
    proj: (x: number, y: number) => [number, number],
    selected: boolean
  ) {
    const color = a.aiScore ? scoreToColor(a.aiScore.overallScore) : "#fb923c";
    if (!a.bounds) return null;
    const [x1, y1] = proj(a.bounds.sw[0], a.bounds.ne[1]);
    const [x2, y2] = proj(a.bounds.ne[0], a.bounds.sw[1]);
    return (
      <g
        key={a.id}
        onClick={(e) => {
          e.stopPropagation();
          if (!panRef.current?.moved) selectAnnotation(a.id);
        }}
        className="cursor-pointer"
      >
        <rect
          x={x1}
          y={y1}
          width={x2 - x1}
          height={y2 - y1}
          fill={`${color}${selected ? "59" : "2b"}`}
          stroke={color}
          strokeWidth={selected ? 3 : 2}
          strokeOpacity={0.95}
        />
        <circle
          cx={(x1 + x2) / 2}
          cy={(y1 + y2) / 2}
          r={4}
          fill={color}
          stroke="#fff"
          strokeWidth={1.5}
        />
      </g>
    );
  }

  function renderPointAnnotation(
    a: Annotation,
    proj: (x: number, y: number) => [number, number],
    selected: boolean
  ) {
    const meta = getBuildingTypeMeta(a.buildingType);
    const color = a.aiScore ? scoreToColor(a.aiScore.overallScore) : meta.color;
    const [px, py] = proj(a.x, a.y);
    const scale = selected ? 1.2 : 1;
    return (
      <g
        key={a.id}
        onClick={(e) => {
          e.stopPropagation();
          if (!panRef.current?.moved) selectAnnotation(a.id);
        }}
        className="cursor-pointer"
        style={{ transform: `translate(${px}px, ${py}px) scale(${scale})` }}
      >
        {/* 水滴标针（SVG，锚点在针尖） */}
        <g transform="translate(0,0)">
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
          {a.floor && (
            <text x={0} y={-40} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff" stroke="#09090b" strokeWidth={2.5} paintOrder="stroke">
              {a.buildingName?.replace(/山东财经大学(圣井|章丘)校区/, "")}·{a.floor}
            </text>
          )}
        </g>
      </g>
    );
  }

  function renderPendingPoint(
    x: number,
    y: number,
    proj: (x: number, y: number) => [number, number]
  ) {
    const [px, py] = proj(x, y);
    return (
      <g key="pending" className="pointer-events-none">
        <circle cx={px} cy={py} r={16} fill="#fb923c44">
          <animate attributeName="r" values="8;22" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="1.4s" repeatCount="indefinite" />
        </circle>
        <circle cx={px} cy={py} r={7} fill="#fb923c" stroke="#fff" strokeWidth={2.5} />
        <circle
          {...(() => {
            const [cx, cy] = proj(x, y);
            return { cx, cy };
          })()}
          r={60 * view.s}
          fill="none"
          stroke="#fb923c"
          strokeOpacity={0.6}
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />
      </g>
    );
  }
}
