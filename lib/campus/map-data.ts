import type { BuildingType } from "@/lib/types";

/**
 * 校园画布数据 —— 自绘卡通平面图（1080×1500）。
 * 楼栋坐标与卡通示意图 1:1 对齐；道路沿楼间空隙手绘，禁止穿楼。
 * 上北下南：y 小 = 北。
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
  { id: "b1", name: "一号教学楼", buildingType: "teaching", x: 170, y: 445, size: [180, 70], floorCount: 5 },
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

/** 景观湖 —— 五号公寓右上、第二餐厅上方（照卡通图） */
export const CAMPUS_LAKE = { x: 400, y: 855, rx: 80, ry: 55 };

/** 中央广场（北门内圆盘） */
export const CAMPUS_PLAZA = { x: 460, y: 490, r: 38 };

/** 主干道路（折线，半宽 = width/2）—— 全部沿楼间空隙，经程序校验不压楼不压场 */
export const CAMPUS_ROADS: Array<{ pts: Array<[number, number]>; width: number }> = [
  // 北横路：贯穿北门大道
  { pts: [[55, 385], [1015, 385]], width: 20 },
  // 西纵路（西边缘）
  { pts: [[55, 385], [55, 1395]], width: 20 },
  // 东纵路（东边缘）
  { pts: [[1015, 385], [1015, 1395]], width: 20 },
  // 北纵路：北门 → 中央广场 → 图书馆/二教之间
  { pts: [[460, 150], [460, 696]], width: 18 },
  // 中央横路：图书馆/四教之间的东西主干（东段收窄避让三号公寓与第一餐厅）
  { pts: [[55, 696], [760, 696]], width: 22 },
  { pts: [[760, 698], [1015, 698]], width: 14 },
  // 中纵路：中央横路 → 南辅路（沿四教/二餐/西运动场东侧）
  { pts: [[435, 696], [435, 1395]], width: 18 },
  // 南横路西段（西运动场西侧）
  { pts: [[55, 1195], [239, 1195]], width: 18 },
  // 南横路主段（七教/九教之间）
  { pts: [[421, 1195], [1015, 1195]], width: 18 },
  // 南辅横路（三餐/七八号公寓之间）
  { pts: [[55, 1395], [795, 1395]], width: 18 },
  { pts: [[935, 1395], [1015, 1395]], width: 18 },
];

/** 绿地树丛装饰（楼间空隙） */
export const CAMPUS_GREENS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 640, y: 470, w: 220, h: 90 },
  { x: 130, y: 950, w: 100, h: 100 },
  { x: 730, y: 1250, w: 80, h: 60 },
];
/** 运动场（独立渲染为跑道环） */
export const CAMPUS_FIELDS: Array<{ id: string; name: string; x: number; y: number; rx: number; ry: number }> = [
  { id: "fieldE", name: "东运动场", x: 880, y: 855, rx: 115, ry: 58 },
  { id: "fieldN", name: "北运动场", x: 900, y: 310, rx: 105, ry: 58 },
  { id: "fieldW", name: "西运动场", x: 330, y: 1180, rx: 80, ry: 48 },
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
