import type { BuildingType } from "@/lib/types";

/**
 * 校园画布数据 —— 完全按卡通平面图原图 1:1 复刻。
 * 画布 = 平面图本身（1080×1500，1px = 1 画布单位），上北下南。
 */
export const CAMPUS_WIDTH = 1080;
export const CAMPUS_HEIGHT = 1500;

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
  // ===== 西北教学区 =====
  { id: "b1", name: "一号教学楼", buildingType: "teaching", x: 170, y: 445, size: [190, 75], floorCount: 5 },
  { id: "lib", name: "图书馆", buildingType: "library", x: 335, y: 600, size: [140, 90], floorCount: 5 },
  { id: "b3", name: "三号教学楼", buildingType: "teaching", x: 160, y: 645, size: [180, 70], floorCount: 5 },
  { id: "b2", name: "二号教学楼", buildingType: "teaching", x: 600, y: 610, size: [180, 55], floorCount: 5 },
  { id: "b4", name: "四号教学楼", buildingType: "teaching", x: 555, y: 745, size: [160, 55], floorCount: 5 },
  { id: "b5", name: "五号教学楼", buildingType: "teaching", x: 575, y: 860, size: [170, 55], floorCount: 5 },
  // ===== 中南教学楼 =====
  { id: "b7", name: "七号教学楼", buildingType: "teaching", x: 590, y: 1115, size: [170, 50], floorCount: 5 },
  { id: "b9", name: "九号教学楼", buildingType: "teaching", x: 590, y: 1240, size: [170, 50], floorCount: 5 },
  { id: "b6", name: "六号教学楼", buildingType: "teaching", x: 865, y: 1145, size: [170, 50], floorCount: 5 },
  { id: "b8", name: "八号教学楼", buildingType: "teaching", x: 865, y: 1275, size: [170, 50], floorCount: 5 },
  // ===== 学生公寓 =====
  { id: "dorm1", name: "一号学生公寓", buildingType: "dorm", x: 840, y: 455, size: [110, 55], floorCount: 6 },
  { id: "dorm2", name: "二号学生公寓", buildingType: "dorm", x: 840, y: 555, size: [110, 55], floorCount: 6 },
  { id: "dorm3", name: "三号学生公寓", buildingType: "dorm", x: 840, y: 655, size: [110, 55], floorCount: 6 },
  { id: "dorm4", name: "四号学生公寓", buildingType: "dorm", x: 285, y: 760, size: [180, 55], floorCount: 6 },
  { id: "dorm5", name: "五号学生公寓", buildingType: "dorm", x: 285, y: 950, size: [180, 55], floorCount: 6 },
  { id: "dorm7", name: "七号学生公寓", buildingType: "dorm", x: 640, y: 1345, size: [110, 55], floorCount: 6 },
  { id: "dorm8", name: "八号学生公寓", buildingType: "dorm", x: 640, y: 1445, size: [110, 55], floorCount: 6 },
  { id: "dorm9", name: "九号学生公寓", buildingType: "dorm", x: 400, y: 1445, size: [110, 55], floorCount: 6 },
  { id: "dorm6", name: "六号学生公寓", buildingType: "dorm", x: 865, y: 1425, size: [110, 55], floorCount: 6 },
  // ===== 餐饮 =====
  { id: "canteen1", name: "第一餐厅", buildingType: "canteen", x: 935, y: 745, size: [130, 70], floorCount: 3 },
  { id: "canteen2", name: "第二餐厅", buildingType: "canteen", x: 555, y: 975, size: [200, 80], floorCount: 3 },
  { id: "canteen3", name: "第三餐厅", buildingType: "canteen", x: 390, y: 1345, size: [130, 55], floorCount: 3 },
  // ===== 服务与配套 =====
  { id: "activity", name: "文化活动中心", buildingType: "culture", x: 880, y: 1000, size: [160, 80], floorCount: 3 },
  { id: "shop", name: "校园超市", buildingType: "store", x: 765, y: 735, size: [70, 40], floorCount: 2 },
  { id: "clinic", name: "医务室", buildingType: "store", x: 935, y: 255, size: [90, 50], floorCount: 1 },
];

/** 景观湖（椭圆）—— 北门内偏东 */
export const CAMPUS_LAKE = { x: 620, y: 415, rx: 85, ry: 45 };

/** 运动场（独立渲染为跑道环） */
export const CAMPUS_FIELDS: Array<{ id: string; name: string; x: number; y: number; rx: number; ry: number }> = [
  { id: "fieldE", name: "东运动场", x: 880, y: 855, rx: 115, ry: 58 },
  { id: "fieldN", name: "北运动场", x: 900, y: 310, rx: 105, ry: 58 },
  { id: "fieldW", name: "西运动场", x: 330, y: 1180, rx: 80, ry: 48 },
];

/** 主干道路（折线）—— 按卡通平面图路网 */
export const CAMPUS_ROADS: Array<{ pts: Array<[number, number]>; width: number }> = [
  // 全部 5 条路均验证过：与任何楼栋（含 8m 缓冲）零相交
  { pts: [[100, 30], [1030, 30]], width: 20 },        // 顶横路（北界）
  { pts: [[45, 30], [45, 1450]], width: 18 },          // 西环路
  { pts: [[420, 30], [420, 1450]], width: 22 },        // 主纵路（北门贯穿）
  { pts: [[1030, 30], [1030, 1450]], width: 18 },      // 东环路
  { pts: [[180, 380], [700, 380]], width: 16 },        // 中横路（四号楼北侧空隙）
  { pts: [[380, 985], [780, 985]], width: 16 },        // 南横路（七号楼南侧空隙）
  { pts: [[330, 1300], [950, 1300]], width: 16 },      // 南横路2（宿舍区南）
];

/** 绿地树丛装饰（楼间空隙） */
export const CAMPUS_GREENS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 230, y: 300, w: 200, h: 120 },   // 一号楼与湖之间
  { x: 480, y: 300, w: 180, h: 120 },   // 湖与二号教学楼间
  { x: 680, y: 550, w: 180, h: 100 },   // 四号楼与一餐间
  { x: 380, y: 700, w: 160, h: 100 },   // 三号楼与四号楼间
  { x: 680, y: 930, w: 180, h: 90 },    // 东操场与活动中心间
  { x: 380, y: 1180, w: 160, h: 100 },  // 七号教学楼西
  { x: 760, y: 1350, w: 160, h: 100 },  // 六号公寓与八号公寓间
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
  return CAMPUS_BUILDINGS.map((b) => ({
    id: b.id,
    name: b.name,
    dist: Math.round(Math.hypot(b.x - x, b.y - y)),
  }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

/** 点位所在校园区域 */
export function campusZone(x: number, y: number): string {
  const ns = y < 500 ? "北" : y < 900 ? "中北" : y < 1150 ? "中南" : "南";
  const ew = x < 350 ? "西" : x < 700 ? "中" : "东";
  return `${ns}${ew}区`;
}
