import type { BuildingType } from "@/lib/types";

/**
 * 校园画布数据 —— 严格按卡通平面图标注：
 * 31 栋（9 教学楼 + 图书馆 + 3 餐厅 + 1-9 号学生公寓 + 教师之家 +
 * 活动中心 + 校史馆 + 超市 + 医务室）+ 3 运动场 + 景观湖。
 * 位置/大小 = 卡通平面图等比映射到标准布局图尺寸（x×0.878, y×0.479）。
 * 不拆分座别、不发明多余楼栋。
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
  // ===== 教学楼 =====
  { id: "b1", name: "一号教学楼", buildingType: "teaching", x: 140, y: 177, size: [132, 29], floorCount: 5 },
  { id: "b2", name: "二号教学楼", buildingType: "teaching", x: 465, y: 235, size: [132, 29], floorCount: 5 },
  { id: "b3", name: "三号教学楼", buildingType: "teaching", x: 127, y: 273, size: [132, 29], floorCount: 5 },
  { id: "lib", name: "图书馆", buildingType: "library", x: 281, y: 244, size: [114, 41], floorCount: 5 },
  { id: "b4", name: "四号教学楼", buildingType: "teaching", x: 439, y: 307, size: [132, 29], floorCount: 5 },
  { id: "b5", name: "五号教学楼", buildingType: "teaching", x: 435, y: 410, size: [132, 29], floorCount: 5 },
  { id: "b7", name: "七号教学楼", buildingType: "teaching", x: 417, y: 493, size: [132, 29], floorCount: 5 },
  { id: "b9", name: "九号教学楼", buildingType: "teaching", x: 443, y: 556, size: [132, 29], floorCount: 5 },
  { id: "b6", name: "六号教学楼", buildingType: "teaching", x: 746, y: 517, size: [132, 29], floorCount: 5 },
  { id: "b8", name: "八号教学楼", buildingType: "teaching", x: 746, y: 584, size: [132, 29], floorCount: 5 },
  // ===== 餐饮 =====
  { id: "canteen1", name: "第一餐厅", buildingType: "canteen", x: 834, y: 330, size: [114, 34], floorCount: 3 },
  { id: "canteen2", name: "第二餐厅", buildingType: "canteen", x: 457, y: 431, size: [114, 34], floorCount: 3 },
  { id: "canteen3", name: "第三餐厅", buildingType: "canteen", x: 343, y: 623, size: [114, 34], floorCount: 3 },
  // ===== 学生公寓（一至九号，各一栋） =====
  { id: "dorm1", name: "一号学生公寓", buildingType: "dorm", x: 773, y: 153, size: [97, 22], floorCount: 6 },
  { id: "dorm2", name: "二号学生公寓", buildingType: "dorm", x: 755, y: 216, size: [97, 22], floorCount: 6 },
  { id: "dorm3", name: "三号学生公寓", buildingType: "dorm", x: 746, y: 273, size: [97, 22], floorCount: 6 },
  { id: "dorm4", name: "四号学生公寓", buildingType: "dorm", x: 219, y: 378, size: [97, 22], floorCount: 6 },
  { id: "dorm5", name: "五号学生公寓", buildingType: "dorm", x: 206, y: 445, size: [97, 22], floorCount: 6 },
  { id: "dorm6", name: "六号学生公寓", buildingType: "dorm", x: 773, y: 637, size: [97, 22], floorCount: 6 },
  { id: "dorm7", name: "七号学生公寓", buildingType: "dorm", x: 544, y: 637, size: [97, 22], floorCount: 6 },
  { id: "dorm8", name: "八号学生公寓", buildingType: "dorm", x: 562, y: 671, size: [97, 22], floorCount: 6 },
  { id: "dorm9", name: "九号学生公寓", buildingType: "dorm", x: 351, y: 685, size: [97, 22], floorCount: 6 },
  // ===== 服务与配套 =====
  { id: "teacher", name: "教师之家", buildingType: "dorm", x: 176, y: 412, size: [70, 22], floorCount: 4 },
  { id: "activity", name: "大学生活动中心", buildingType: "culture", x: 729, y: 426, size: [105, 29], floorCount: 3 },
  { id: "museum", name: "校史馆", buildingType: "culture", x: 790, y: 455, size: [79, 24], floorCount: 2 },
  { id: "shop", name: "校园超市", buildingType: "store", x: 694, y: 314, size: [61, 19], floorCount: 2 },
  { id: "clinic", name: "医务室", buildingType: "store", x: 825, y: 60, size: [53, 19], floorCount: 1 },
  // ===== 运动场 =====
  { id: "eastField", name: "东运动场", buildingType: "field", x: 773, y: 378, size: [193, 53], floorCount: 0 },
  { id: "northField", name: "北运动场", buildingType: "field", x: 781, y: 110, size: [176, 53], floorCount: 0 },
  { id: "westField", name: "西运动场", buildingType: "field", x: 219, y: 556, size: [158, 48], floorCount: 0 },
];

/** 景观湖（椭圆）—— 北门内 */
export const CAMPUS_LAKE = { x: 527, y: 144, rx: 75, ry: 23 };

/** 主干道路（折线）—— 按平面图路网等比映射 */
export const CAMPUS_ROADS: Array<{ pts: Array<[number, number]>; width: number }> = [
  { pts: [[474, 77], [457, 230], [439, 422], [430, 618]], width: 13 },  // 北门主路贯穿
  { pts: [[834, 120], [808, 407], [773, 623]], width: 12 },             // 东环路
  { pts: [[79, 168], [70, 431], [123, 623]], width: 11 },               // 西环路
  { pts: [[263, 91], [834, 96]], width: 12 },                            // 北横路
  { pts: [[132, 307], [790, 316]], width: 12 },                          // 图书馆前横路
  { pts: [[202, 421], [746, 426]], width: 11 },                          // 二餐前横路
  { pts: [[263, 599], [773, 599]], width: 11 },                          // 南横路
  { pts: [[430, 618], [351, 671]], width: 9 },                           // 南区支路
];

/** 绿地树丛装饰 */
export const CAMPUS_GREENS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 334, y: 105, w: 193, h: 58 },   // 湖西绿地
  { x: 545, y: 115, w: 211, h: 58 },   // 湖东绿地
  { x: 211, y: 335, w: 158, h: 58 },   // 三号教学楼前
  { x: 545, y: 355, w: 158, h: 48 },   // 四号教学楼前
  { x: 545, y: 455, w: 176, h: 62 },   // 二餐与活动中心间
  { x: 264, y: 565, w: 141, h: 58 },   // 西运动场北
  { x: 615, y: 546, w: 105, h: 58 },   // 七号楼旁
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
  const ns = y < 240 ? "北" : y < 360 ? "中北" : y < 500 ? "中南" : "南";
  const ew = x < 260 ? "西" : x < 650 ? "中" : "东";
  return `${ns}${ew}区`;
}
