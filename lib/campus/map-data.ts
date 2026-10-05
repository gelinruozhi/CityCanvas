import type { BuildingType } from "@/lib/types";

/**
 * 校园画布数据 —— 楼栋位置完全按用户标准布局图，
 * 道路仅沿楼间空隙布置（5 条，均不与任何楼重叠）。
 * 画布 948 × 718。
 */
export const CAMPUS_WIDTH = 948;
export const CAMPUS_HEIGHT = 718;

export interface CampusBuildingDef {
  id: string;
  name: string;
  buildingType: BuildingType;
  x: number;
  y: number;
  size: [number, number];
  floorCount: number;
}

export const CAMPUS_BUILDINGS: CampusBuildingDef[] = [
  // ===== 北部 =====
  { id: "clinic", name: "医务室", buildingType: "store", x: 815, y: 71, size: [66, 32], floorCount: 1 },
  { id: "northField", name: "北运动场", buildingType: "field", x: 712, y: 118, size: [150, 56], floorCount: 0 },
  { id: "lake", name: "景观湖", buildingType: "plaza", x: 485, y: 152, size: [110, 50], floorCount: 0 },
  { id: "dorm1", name: "一号学生公寓", buildingType: "dorm", x: 737, y: 168, size: [88, 34], floorCount: 6 },
  { id: "b1", name: "一号教学楼", buildingType: "teaching", x: 137, y: 188, size: [94, 38], floorCount: 5 },
  { id: "dorm2", name: "二号学生公寓", buildingType: "dorm", x: 732, y: 228, size: [88, 34], floorCount: 6 },
  { id: "lib", name: "图书馆", buildingType: "library", x: 282, y: 248, size: [95, 38], floorCount: 5 },
  { id: "b2", name: "二号教学楼", buildingType: "teaching", x: 465, y: 248, size: [95, 38], floorCount: 5 },
  { id: "dorm3", name: "三号学生公寓", buildingType: "dorm", x: 727, y: 288, size: [88, 34], floorCount: 6 },
  { id: "b3", name: "三号教学楼", buildingType: "teaching", x: 125, y: 306, size: [95, 38], floorCount: 5 },
  // ===== 中部 =====
  { id: "b4", name: "四号教学楼", buildingType: "teaching", x: 435, y: 348, size: [95, 38], floorCount: 5 },
  { id: "shop", name: "校园超市", buildingType: "store", x: 628, y: 348, size: [70, 32], floorCount: 2 },
  { id: "canteen1", name: "第一餐厅", buildingType: "canteen", x: 760, y: 370, size: [88, 38], floorCount: 3 },
  { id: "b5", name: "五号教学楼", buildingType: "teaching", x: 434, y: 418, size: [96, 38], floorCount: 5 },
  { id: "dorm4", name: "四号学生公寓", buildingType: "dorm", x: 232, y: 418, size: [88, 34], floorCount: 6 },
  { id: "eastField", name: "东运动场", buildingType: "field", x: 712, y: 428, size: [170, 62], floorCount: 0 },
  { id: "teacher", name: "教师之家", buildingType: "dorm", x: 162, y: 458, size: [70, 32], floorCount: 4 },
  { id: "activity", name: "大学生活动中心", buildingType: "culture", x: 718, y: 472, size: [88, 34], floorCount: 3 },
  { id: "dorm5", name: "五号学生公寓", buildingType: "dorm", x: 232, y: 492, size: [88, 34], floorCount: 6 },
  { id: "museum", name: "校史馆", buildingType: "culture", x: 722, y: 500, size: [70, 30], floorCount: 2 },
  // ===== 中南 =====
  { id: "b7", name: "七号教学楼", buildingType: "teaching", x: 435, y: 545, size: [95, 38], floorCount: 5 },
  { id: "dorm6", name: "六号学生公寓", buildingType: "dorm", x: 718, y: 542, size: [88, 34], floorCount: 6 },
  { id: "westField", name: "西运动场", buildingType: "field", x: 175, y: 562, size: [150, 55], floorCount: 0 },
  { id: "b9", name: "九号教学楼", buildingType: "teaching", x: 470, y: 578, size: [96, 38], floorCount: 5 },
  { id: "b8", name: "八号教学楼", buildingType: "teaching", x: 720, y: 578, size: [88, 34], floorCount: 5 },
  { id: "dorm7", name: "七号学生公寓", buildingType: "dorm", x: 520, y: 612, size: [88, 34], floorCount: 6 },
  { id: "dorm6b", name: "六号学生公寓B座", buildingType: "dorm", x: 718, y: 612, size: [88, 34], floorCount: 6 },
  // ===== 南部 =====
  { id: "canteen3", name: "第三餐厅", buildingType: "canteen", x: 365, y: 625, size: [88, 36], floorCount: 3 },
  { id: "dorm8", name: "八号学生公寓", buildingType: "dorm", x: 520, y: 655, size: [88, 34], floorCount: 6 },
  { id: "dorm5b", name: "五号学生公寓B座", buildingType: "dorm", x: 718, y: 648, size: [88, 34], floorCount: 6 },
  { id: "dorm9", name: "九号学生公寓", buildingType: "dorm", x: 390, y: 668, size: [88, 34], floorCount: 6 },
];

/**
 * 道路 —— 仅沿楼间空隙布置的 5 条路，全部避让楼栋：
 * 顶横 y=30（医务室上方）、左纵 x=60（一号教学楼/西运动场西侧）、
 * 中横 y=380（四号/五号教学楼与一餐/东运动场之间的空隙）、
 * 底横 y=706（南缘）、右纵 x=870（医务室/一餐/活动中心东侧）。
 */
export const CAMPUS_ROADS: Array<{ pts: Array<[number, number]>; width: number }> = [
  { pts: [[100, 30], [900, 30]], width: 13 },
  { pts: [[60, 30], [60, 700]], width: 12 },
  { pts: [[180, 380], [700, 380]], width: 13 },
  { pts: [[60, 706], [830, 706]], width: 12 },
  { pts: [[870, 30], [870, 690]], width: 12 },
];

/** 景观湖已在 CAMPUS_BUILDINGS 中（plaza 类型，可点击）。此椭圆为兼容保留。 */
export const CAMPUS_LAKE = { x: 485, y: 152, rx: 55, ry: 25 };

/** 绿地树丛装饰（楼间空地） */
export const CAMPUS_GREENS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 340, y: 120, w: 130, h: 90 },   // 湖与一号公寓间
  { x: 200, y: 230, w: 60, h: 120 },   // 一号楼与图书馆间
  { x: 530, y: 230, w: 130, h: 90 },   // 二号教学楼与二号公寓间
  { x: 340, y: 300, w: 60, h: 90 },    // 三号/四号教学楼间
  { x: 540, y: 310, w: 70, h: 80 },    // 四号楼与超市间
  { x: 330, y: 460, w: 70, h: 90 },    // 五号教学楼与四号公寓间
  { x: 540, y: 460, w: 70, h: 110 },   // 五号教学楼与东运动场间
  { x: 330, y: 560, w: 80, h: 90 },    // 七号楼与三餐间
  { x: 620, y: 560, w: 80, h: 100 },   // 九号楼与六号公寓间
  { x: 620, y: 300, w: 40, h: 120 },   // 超市与一号公寓间
];

/** 根据楼栋 id 取定义 */
export function getCampusBuilding(id: string): CampusBuildingDef | undefined {
  return CAMPUS_BUILDINGS.find((b) => b.id === id);
}

/** 楼层列表 */
export function buildingFloors(floorCount: number): string[] {
  return Array.from({ length: Math.max(0, floorCount) }, (_, i) => `${i + 1}F`);
}

/** 点位周边建筑 */
export function nearbyBuildings(x: number, y: number, n = 4) {
  return CAMPUS_BUILDINGS.filter((b) => b.buildingType !== "plaza")
    .map((b) => ({
      id: b.id,
      name: b.name,
      dist: Math.round(Math.hypot(b.x - x, b.y - y)),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

/** 点位所在校园区域 */
export function campusZone(x: number, y: number): string {
  const ns = y < 200 ? "北" : y < 400 ? "中北" : y < 550 ? "中南" : "南";
  const ew = x < 250 ? "西" : x < 600 ? "中" : "东";
  return `${ns}${ew}区`;
}
