import type { BuildingType } from "@/lib/types";

/**
 * 校园画布数据 —— 圣井校区局部米坐标系：
 * 原点 = (117.3715°E, 36.6725°N)（校园西北外一点），x 向东（0~560m），y 向南（0~1330m）。
 * 楼栋坐标来自高德 POI 实测锚点 + 学校平面图相对布局，误差 <80m。
 * 换算：x = (lng - 117.3715) × 71424；y = (36.6725 - lat) × 111320。
 */
export const CAMPUS_WIDTH = 560;
export const CAMPUS_HEIGHT = 1330;
export const CAMPUS_LNG0 = 117.3715;
export const CAMPUS_LAT0 = 36.6725;
export const METERS_PER_LNG = 71424; // at lat 36.667
export const METERS_PER_LAT = 111320;

export interface CampusBuildingDef {
  id: string;
  name: string;
  buildingType: BuildingType;
  /** 楼体中心（米） */
  x: number;
  y: number;
  /** 楼体尺寸（米）：[东西宽, 南北深] */
  size: [number, number];
  floorCount: number;
}

export const CAMPUS_BUILDINGS: CampusBuildingDef[] = [
  // ===== 教学区 =====
  { id: "b1", name: "一号教学楼", buildingType: "teaching", x: 43, y: 124, size: [55, 18], floorCount: 5 },
  { id: "b2", name: "二号教学楼", buildingType: "teaching", x: 236, y: 101, size: [55, 18], floorCount: 5 },
  { id: "b3", name: "三号教学楼", buildingType: "teaching", x: 78, y: 253, size: [55, 18], floorCount: 5 },
  { id: "lib", name: "图书馆", buildingType: "library", x: 144, y: 179, size: [60, 30], floorCount: 5 },
  { id: "b4", name: "四号教学楼", buildingType: "teaching", x: 227, y: 314, size: [55, 18], floorCount: 5 },
  { id: "b5", name: "五号教学楼", buildingType: "teaching", x: 235, y: 524, size: [55, 18], floorCount: 5 },
  { id: "b7", name: "七号教学楼", buildingType: "teaching", x: 214, y: 847, size: [55, 18], floorCount: 5 },
  { id: "b9", name: "九号教学楼", buildingType: "teaching", x: 214, y: 967, size: [55, 18], floorCount: 5 },
  { id: "b6", name: "六号教学楼", buildingType: "teaching", x: 378, y: 813, size: [55, 18], floorCount: 5 },
  { id: "b8", name: "八号教学楼", buildingType: "teaching", x: 382, y: 750, size: [55, 18], floorCount: 5 },
  // ===== 餐饮 =====
  { id: "canteen1", name: "第一餐厅", buildingType: "canteen", x: 358, y: 314, size: [45, 28], floorCount: 3 },
  { id: "canteen2", name: "第二餐厅", buildingType: "canteen", x: 234, y: 673, size: [45, 28], floorCount: 3 },
  { id: "canteen3", name: "第三餐厅", buildingType: "canteen", x: 192, y: 973, size: [45, 28], floorCount: 3 },
  // ===== A 区学生公寓（东北，1-3 号） =====
  { id: "dorm1", name: "一号学生公寓", buildingType: "dorm", x: 365, y: 134, size: [38, 14], floorCount: 6 },
  { id: "dorm2", name: "二号学生公寓", buildingType: "dorm", x: 366, y: 186, size: [38, 14], floorCount: 6 },
  { id: "dorm3", name: "三号学生公寓", buildingType: "dorm", x: 370, y: 234, size: [38, 14], floorCount: 6 },
  // ===== B 区学生公寓（中西，4-5 号 + 教师之家） =====
  { id: "dorm4", name: "四号学生公寓", buildingType: "dorm", x: 136, y: 538, size: [38, 14], floorCount: 6 },
  { id: "dorm5", name: "五号学生公寓", buildingType: "dorm", x: 105, y: 646, size: [38, 14], floorCount: 6 },
  { id: "teacher", name: "教师之家", buildingType: "dorm", x: 107, y: 713, size: [30, 14], floorCount: 4 },
  // ===== C 区学生公寓（南，6/7/8/9 号） =====
  { id: "dorm6", name: "六号学生公寓", buildingType: "dorm", x: 327, y: 958, size: [38, 14], floorCount: 6 },
  { id: "dorm7", name: "七号学生公寓", buildingType: "dorm", x: 273, y: 981, size: [38, 14], floorCount: 6 },
  { id: "dorm8", name: "八号学生公寓", buildingType: "dorm", x: 273, y: 1048, size: [38, 14], floorCount: 6 },
  { id: "dorm9", name: "九号学生公寓", buildingType: "dorm", x: 164, y: 981, size: [38, 14], floorCount: 6 },
  { id: "dorm5b", name: "五号学生公寓B座", buildingType: "dorm", x: 407, y: 1034, size: [38, 14], floorCount: 6 },
  // ===== 服务与配套 =====
  { id: "activity", name: "大学生活动中心", buildingType: "culture", x: 336, y: 801, size: [40, 25], floorCount: 3 },
  { id: "museum", name: "校史馆", buildingType: "culture", x: 364, y: 857, size: [28, 18], floorCount: 2 },
  { id: "shop", name: "校园超市", buildingType: "store", x: 329, y: 290, size: [20, 12], floorCount: 2 },
  { id: "clinic", name: "医务室", buildingType: "store", x: 286, y: 300, size: [18, 12], floorCount: 1 },
  // ===== 运动场（floorCount=0，室外） =====
  { id: "eastField", name: "东运动场", buildingType: "field", x: 407, y: 696, size: [105, 68], floorCount: 0 },
  { id: "northField", name: "北运动场", buildingType: "field", x: 450, y: 279, size: [95, 62], floorCount: 0 },
  { id: "westField", name: "西运动场", buildingType: "field", x: 57, y: 858, size: [80, 50], floorCount: 0 },
];

/** 主干道路（折线，米坐标）—— 按真实卫星路网 */
export const CAMPUS_ROADS: Array<{ pts: Array<[number, number]>; width: number }> = [
  { pts: [[240, 30], [250, 400], [250, 700], [250, 1100], [300, 1330]], width: 14 }, // 北门主路贯穿
  { pts: [[60, 300], [450, 300]], width: 12 },    // 北横路（教学区前）
  { pts: [[80, 650], [480, 650]], width: 12 },    // 中横路（二餐/5号楼前）
  { pts: [[130, 1000], [470, 1000]], width: 12 }, // 南横路（宿舍区）
  { pts: [[500, 900], [534, 908]], width: 12 },   // 东门连接
  { pts: [[60, 130], [60, 1200]], width: 10 },    // 西环路
  { pts: [[500, 1350], [534, 908]], width: 12 },  // 东南环路
];

/** 景观湖（椭圆，米）—— 北门内 */
export const CAMPUS_LAKE = { x: 193, y: 334, rx: 32, ry: 20 };

/** 草地区块（装饰性绿地，米） */
export const CAMPUS_GREENS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 150, y: 380, w: 220, h: 130 },
  { x: 280, y: 560, w: 160, h: 90 },
  { x: 120, y: 880, w: 260, h: 90 },
  { x: 300, y: 1080, w: 180, h: 100 },
  { x: 60, y: 420, w: 120, h: 160 },
  { x: 330, y: 180, w: 150, h: 100 },
];

/** 根据楼栋 id 取定义 */
export function getCampusBuilding(id: string): CampusBuildingDef | undefined {
  return CAMPUS_BUILDINGS.find((b) => b.id === id);
}

/** 楼层列表："1F".."NF"；室外场地（floorCount=0）为空 */
export function buildingFloors(floorCount: number): string[] {
  return Array.from({ length: Math.max(0, floorCount) }, (_, i) => `${i + 1}F`);
}

/** 点位周边建筑（画布米坐标，按距离排序，取最近 n 个） */
export function nearbyBuildings(x: number, y: number, n = 4) {
  return CAMPUS_BUILDINGS.map((b) => ({
    id: b.id,
    name: b.name,
    dist: Math.round(Math.hypot(b.x - x, b.y - y)),
  }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

/** 点位所在校园区域（用于 AI 上下文） */
export function campusZone(x: number, y: number): string {
  const ns = y < 350 ? "北" : y < 700 ? "中北" : y < 1000 ? "中南" : "南";
  const ew = x < 150 ? "西" : x < 350 ? "中" : "东";
  return `${ns}${ew}区`;
}
