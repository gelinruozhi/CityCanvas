"use client";

import type { CampusBuildingDef } from "@/lib/campus/map-data";

type Proj = (x: number, y: number) => [number, number];

const WALL = "#8a6f4d";
const WALL_W = 1.2;
const PARTITION = "#c2ae8c";
const CORRIDOR_FILL = "#efe6cf";
const FURNITURE = "#d8c8a8";
const FURNITURE_EDGE = "#b09a72";

/**
 * 程序化楼层平面：走廊 + 房间隔墙 + 类型化家具示意（纯几何，无随机）。
 * 全部画在楼体画布矩形内，经 proj 投影，随室内视野铺满屏幕。
 */
export function IndoorFloorPlan({
  building,
  floor,
  proj,
  s,
}: {
  building: CampusBuildingDef;
  floor: string;
  proj: Proj;
  s: number;
}) {
  const [w, h] = building.size;
  const x0 = building.x - w / 2;
  const y0 = building.y - h / 2;
  const P = (x: number, y: number): [number, number] => proj(x0 + x, y0 + y);

  const line = (x1: number, y1: number, x2: number, y2: number, stroke = PARTITION, sw = 0.5) => {
    const [ax, ay] = P(x1, y1);
    const [bx, by] = P(x2, y2);
    return <line key={`${x1},${y1}-${x2},${y2}`} x1={ax} y1={ay} x2={bx} y2={by} stroke={stroke} strokeWidth={sw * s} strokeLinecap="round" />;
  };
  const rect = (key: string, x: number, y: number, rw: number, rh: number, fill: string, stroke?: string) => {
    const [px, py] = P(x, y);
    return <rect key={key} x={px} y={py} width={rw * s} height={rh * s} rx={0.6 * s} fill={fill} stroke={stroke} strokeWidth={stroke ? 0.35 * s : undefined} />;
  };
  const text = (key: string, x: number, y: number, str: string, size: number, fill = "#8a7154") => {
    const [px, py] = P(x, y);
    return (
      <text key={key} x={px} y={py} textAnchor="middle" dominantBaseline="middle" className="pointer-events-none select-none" style={{ fontSize: size * s, fontWeight: 700, fill }}>
        {str}
      </text>
    );
  };

  const horizontal = w >= h;
  const main = horizontal ? h : w; // 走廊方向的跨度
  const span = horizontal ? w : h; // 房间排列方向
  const corridorH = Math.min(9, main * 0.2);
  const cor0 = main / 2 - corridorH / 2;
  const cor1 = main / 2 + corridorH / 2;
  const m = 2.5; // 外墙内侧留白
  const rooms = Math.max(2, Math.round(span / 24));
  const roomW = span / rooms;
  const type = building.buildingType;

  const els: React.ReactNode[] = [];

  // 走廊带 + 名称
  if (horizontal) {
    els.push(rect("cor", m, cor0, w - m * 2, corridorH, CORRIDOR_FILL));
    els.push(text("corT", w / 2, (cor0 + cor1) / 2, "走 廊", Math.min(3, corridorH * 0.42)));
  } else {
    els.push(rect("cor", cor0, m, corridorH, h - m * 2, CORRIDOR_FILL));
    els.push(text("corT", (cor0 + cor1) / 2, h / 2, "走 廊", Math.min(3, corridorH * 0.42)));
  }

  // 房间隔墙（垂直于走廊方向），房间号
  for (let i = 1; i < rooms; i++) {
    const p = i * roomW;
    if (horizontal) els.push(line(p, m, p, cor0));
    else els.push(line(m, p, cor0, p));
    if (horizontal) els.push(line(p, cor1, p, h - m));
    else els.push(line(cor1, p, h - m, p));
  }
  for (let i = 0; i < rooms; i++) {
    const cx = (i + 0.5) * roomW;
    const cy = (m + cor0) / 2;
    const cy2 = h - (m + (main - cor1)) / 2;
    const num = (n: number) => `${floor}-${String(n).padStart(2, "0")}`;
    if (horizontal) {
      els.push(text(`n${i}t`, cx, cy, num(i + 1), 2.1));
      els.push(text(`n${i}b`, cx, cy2, num(rooms + i + 1), 2.1));
    } else {
      els.push(text(`n${i}t`, cy, cx, num(i + 1), 2.1));
      els.push(text(`n${i}b`, cy2, cx, num(rooms + i + 1), 2.1));
    }
  }

  // 家具示意（按建筑类型，画在每间房内）
  const furn: React.ReactNode[] = [];
  for (let i = 0; i < rooms; i++) {
    const rx = i * roomW;
    for (const row of [0, 1]) {
      // row 0 = 上/左排房，row 1 = 下/右排房
      const isTop = row === 0;
      if (horizontal) {
        const fx = rx + roomW / 2;
        const fy = isTop ? (m + cor0) / 2 : h - (m + (main - cor1)) / 2;
        furn.push(...furnitureFor(type, fx, fy, roomW, cor0 - m, i, row, rect));
      } else {
        const fx = isTop ? (m + cor0) / 2 : h - (m + (main - cor1)) / 2;
        const fy = rx + roomW / 2;
        furn.push(...furnitureForV(type, isTop ? fx : fx, fy, cor0 - m, roomW, i, row, rect));
      }
    }
  }
  els.push(...furn);

  // 楼梯间：走廊两端
  const stW = Math.min(7, corridorH * 1.1);
  for (const end of [0, 1]) {
    const steps: React.ReactNode[] = [];
    if (horizontal) {
      const sx = end === 0 ? m + 0.5 : w - m - stW - 0.5;
      els.push(rect(`st${end}`, sx, cor0 + 0.4, stW, corridorH - 0.8, "#e0d2b2", FURNITURE_EDGE));
      for (let k = 1; k <= 4; k++) {
        const sy = cor0 + 0.4 + ((corridorH - 0.8) * k) / 5;
        els.push(line(sx + 0.6, sy, sx + stW - 0.6, sy, FURNITURE_EDGE, 0.3));
      }
    } else {
      const sy = end === 0 ? m + 0.5 : h - m - stW - 0.5;
      els.push(rect(`st${end}`, cor0 + 0.4, sy, corridorH - 0.8, stW, "#e0d2b2", FURNITURE_EDGE));
      for (let k = 1; k <= 4; k++) {
        const sx = cor0 + 0.4 + ((corridorH - 0.8) * k) / 5;
        els.push(line(sx, sy + 0.6, sx, sy + stW - 0.6, FURNITURE_EDGE, 0.3));
      }
    }
    els.push(...steps);
  }

  return (
    <g className="pointer-events-none">
      {/* 外墙 */}
      <rect
        x={P(0, 0)[0]}
        y={P(0, 0)[1]}
        width={w * s}
        height={h * s}
        fill="none"
        stroke={WALL}
        strokeWidth={WALL_W * s}
        rx={2 * s}
      />
      {els}
    </g>
  );
}

/* ===== 家具生成（横楼版本：fx/fy 为房间中心，rw×rh 为房间可用尺寸） ===== */
type RectFn = (key: string, x: number, y: number, rw: number, rh: number, fill: string, stroke?: string) => React.ReactNode;

function furnitureFor(
  type: string,
  fx: number,
  fy: number,
  rw: number,
  rh: number,
  roomIdx: number,
  row: number,
  rect: RectFn
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  if (type === "dorm") {
    // 两张床贴外侧墙 + 内侧一张书桌
    const bedY = row === 0 ? fy - rh / 2 + 1.6 : fy + rh / 2 - 1.6 - 4;
    out.push(rect(`bed${row}a${roomIdx}`, fx - rw / 2 + 2, bedY, Math.min(7, rw * 0.3), 4, FURNITURE, FURNITURE_EDGE));
    out.push(rect(`bed${row}b${roomIdx}`, fx, bedY, Math.min(7, rw * 0.3), 4, FURNITURE, FURNITURE_EDGE));
    const deskY = row === 0 ? fy + rh / 2 - 3.4 : fy - rh / 2 + 1.4;
    out.push(rect(`dsk${row}${roomIdx}`, fx - 3, deskY, 6, 2, "#e6d9bc", FURNITURE_EDGE));
  } else if (type === "teaching" || type === "lab") {
    // 课桌 2 排 × 3 列
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const dx = fx - rw / 2 + 2 + (c * (rw - 4)) / 3;
        const dy = fy - rh / 2 + 2 + r * (rh - 6);
        out.push(rect(`tk${row}${roomIdx}${r}${c}`, dx, dy, Math.min(4, (rw - 6) / 3), Math.min(3, (rh - 6) / 2), FURNITURE, FURNITURE_EDGE));
      }
    }
  } else if (type === "library" || type === "studyroom") {
    // 书架长排 × 2
    for (let r = 0; r < 2; r++) {
      const dy = fy - rh / 2 + 2 + r * Math.max(3, rh / 2.4);
      out.push(rect(`bk${row}${roomIdx}${r}`, fx - rw / 2 + 2, dy, rw - 4, 1.8, "#dcc9a0", FURNITURE_EDGE));
    }
  } else if (type === "canteen") {
    // 圆桌 2×2
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const dx = fx - rw / 4 + c * (rw / 2);
        const dy = fy - rh / 4 + r * (rh / 2);
        out.push(rect(`ct${row}${roomIdx}${r}${c}`, dx - 1.6, dy - 1.6, 3.2, 3.2, FURNITURE, FURNITURE_EDGE));
      }
    }
  } else if (type === "store" || type === "culture" || type === "activity") {
    // 一张长台
    out.push(rect(`tb${row}${roomIdx}`, fx - rw / 4, fy - 1.2, rw / 2, 2.4, FURNITURE, FURNITURE_EDGE));
  }
  return out;
}

/* 竖楼版本：坐标轴互换（fx = 房间带中心沿短轴，fy 沿长轴） */
function furnitureForV(
  type: string,
  fx: number,
  fy: number,
  rw: number,
  rh: number,
  roomIdx: number,
  row: number,
  rect: RectFn
): React.ReactNode[] {
  // 竖楼在本校数据里极少（所有楼都 w>=h），退化为长台示意
  const out: React.ReactNode[] = [];
  out.push(rect(`vtb${row}${roomIdx}`, fx - rw / 4, fy - rh / 4, rw / 2, rh / 2, FURNITURE, FURNITURE_EDGE));
  return out;
}
