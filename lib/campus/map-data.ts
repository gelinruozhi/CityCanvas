import type { BuildingType } from "@/lib/types";

/**
 * 校园画布数据 —— 局部米坐标系：
 * 原点 = 校园西南角，x 向东（0~700m），y 向北（0~1400m）。
 * 布局依据学校官方平面图 1:1 换算。
 */
export const CAMPUS_WIDTH = 700;
export const CAMPUS_HEIGHT = 1400;

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
  /** 楼层名列表（floorCount=0 为室外场地） */
  shape?: "rect" | "L";
}

export const CAMPUS_BUILDINGS: CampusBuildingDef[] = [
  // ===== 教学区（自北向南 1→9 号） =====
  { id: "b1", name: "一号教学楼", buildingType: "teaching", x: 67, y: 1030, size: [55, 18], floorCount: 5 },
  { id: "b2", name: "二号教学楼", buildingType: "teaching", x: 252, y: 1015, size: [55, 18], floorCount: 5 },
  { id: "b3", name: "三号教学楼", buildingType: "teaching", x: 82, y: 968, size: [55, 18], floorCount: 5 },
  { id: "lib", name: "图书馆", buildingType: "library", x: 175, y: 953, size: [60, 30], floorCount: 5 },
  { id: "b4", name: "四号教学楼", buildingType: "teaching", x: 257, y: 902, size: [55, 18], floorCount: 5 },
  { id: "b5", name: "五号教学楼", buildingType: "teaching", x: 273, y: 618, size: [55, 18], floorCount: 5 },
  { id: "b7", name: "七号教学楼", buildingType: "teaching", x: 278, y: 376, size: [55, 18], floorCount: 5 },
  { id: "b6", name: "六号教学楼", buildingType: "teaching", x: 443, y: 376, size: [55, 18], floorCount: 5 },
  { id: "b9", name: "九号教学楼", buildingType: "teaching", x: 278, y: 284, size: [55, 18], floorCount: 5 },
  { id: "b8", name: "八号教学楼", buildingType: "teaching", x: 443, y: 284, size: [55, 18], floorCount: 5 },
  // ===== 餐饮 =====
  { id: "canteen1", name: "第一餐厅", buildingType: "canteen", x: 448, y: 824, size: [45, 28], floorCount: 3 },
  { id: "canteen2", name: "第二餐厅", buildingType: "canteen", x: 252, y: 453, size: [45, 28], floorCount: 3 },
  { id: "canteen3", name: "第三餐厅", buildingType: "canteen", x: 175, y: 149, size: [45, 28], floorCount: 3 },
  // ===== A 区学生公寓（东北，1-3 号） =====
  { id: "dorm1", name: "一号学生公寓", buildingType: "dorm", x: 422, y: 1029, size: [38, 14], floorCount: 6 },
  { id: "dorm2", name: "二号学生公寓", buildingType: "dorm", x: 427, y: 979, size: [38, 14], floorCount: 6 },
  { id: "dorm3", name: "三号学生公寓", buildingType: "dorm", x: 432, y: 928, size: [38, 14], floorCount: 6 },
  // ===== B 区学生公寓（西，4-5 号 + 教师之家） =====
  { id: "dorm4", name: "四号学生公寓", buildingType: "dorm", x: 175, y: 757, size: [38, 14], floorCount: 6 },
  { id: "dorm5", name: "五号学生公寓", buildingType: "dorm", x: 170, y: 673, size: [38, 14], floorCount: 6 },
  { id: "teacher", name: "教师之家", buildingType: "dorm", x: 113, y: 716, size: [30, 14], floorCount: 4 },
  // ===== C 区学生公寓（南，6/7/8/9 号） =====
  { id: "dorm7", name: "七号学生公寓", buildingType: "dorm", x: 371, y: 129, size: [38, 14], floorCount: 6 },
  { id: "dorm8", name: "八号学生公寓", buildingType: "dorm", x: 371, y: 67, size: [38, 14], floorCount: 6 },
  { id: "dorm9", name: "九号学生公寓", buildingType: "dorm", x: 196, y: 88, size: [38, 14], floorCount: 6 },
  { id: "dorm6", name: "六号学生公寓", buildingType: "dorm", x: 474, y: 103, size: [38, 14], floorCount: 6 },
  { id: "dorm5b", name: "五号学生公寓B座", buildingType: "dorm", x: 484, y: 72, size: [38, 14], floorCount: 6 },
  // ===== 服务与配套 =====
  { id: "activity", name: "大学生活动中心", buildingType: "culture", x: 484, y: 469, size: [40, 25], floorCount: 3 },
  { id: "museum", name: "校史馆", buildingType: "culture", x: 530, y: 420, size: [28, 18], floorCount: 2 },
  { id: "shop", name: "校园超市", buildingType: "store", x: 392, y: 845, size: [20, 12], floorCount: 2 },
  { id: "clinic", name: "医务室", buildingType: "store", x: 463, y: 1250, size: [18, 12], floorCount: 1 },
  // ===== 运动场（floorCount=0，室外） =====
  { id: "eastField", name: "东运动场", buildingType: "field", x: 520, y: 618, size: [105, 68], floorCount: 0 },
  { id: "northField", name: "北运动场", buildingType: "field", x: 427, y: 1196, size: [95, 62], floorCount: 0 },
  { id: "westField", name: "西运动场", buildingType: "field", x: 82, y: 325, size: [80, 50], floorCount: 0 },
];

/** 主干道路（折线，米坐标），渲染为浅色粗线 */
export const CAMPUS_ROADS: Array<{ pts: Array<[number, number]>; width: number }> = [
  { pts: [[300, 1400], [300, 1000], [60, 1000]], width: 14 },   // 北门主路 + 西横路
  { pts: [[60, 700], [500, 700]], width: 12 },                   // 中横路
  { pts: [[100, 300], [520, 300]], width: 12 },                  // 南横路
  { pts: [[500, 1350], [500, 300]], width: 12 },                 // 东门路
  { pts: [[80, 1250], [80, 300]], width: 10 },                   // 西环路
  { pts: [[500, 700], [500, 560]], width: 10 },                  // 运动场支路
  { pts: [[300, 1400], [500, 1350]], width: 12 },                // 东南连接
];

/** 景观湖（椭圆，米） */
export const CAMPUS_LAKE = { x: 232, y: 1201, rx: 38, ry: 24 };

/** 草地区块（装饰性绿地，米） */
export const CAMPUS_GREENS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 180, y: 1060, w: 200, h: 130 },
  { x: 330, y: 850, w: 150, h: 120 },
  { x: 140, y: 560, w: 220, h: 90 },
  { x: 360, y: 200, w: 220, h: 130 },
  { x: 150, y: 180, w: 180, h: 100 },
  { x: 420, y: 560, w: 160, h: 80 },
];

/** 根据楼栋 id 取定义 */
export function getCampusBuilding(id: string): CampusBuildingDef | undefined {
  return CAMPUS_BUILDINGS.find((b) => b.id === id);
}

/** 楼层列表："1F".."NF"；室外场地（floorCount=0）为空 */
export function buildingFloors(floorCount: number): string[] {
  return Array.from({ length: Math.max(0, floorCount) }, (_, i) => `${i + 1}F`);
}

/** 点位周边建筑（同画布米坐标，按距离排序，取最近 n 个） */
export function nearbyBuildings(x: number, y: number, n = 4) {
  return CAMPUS_BUILDINGS.filter((b) => b.floorCount > 0 || b.buildingType === "field")
    .map((b) => ({
      id: b.id,
      name: b.name,
      dist: Math.round(Math.hypot(b.x - x, b.y - y)),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

/** 点位所在校园区域（用于 AI 上下文） */
export function campusZone(x: number, y: number): string {
  const ns = y > 950 ? "北" : y > 650 ? "中" : y > 350 ? "中南" : "南";
  const ew = x < 180 ? "西" : x < 420 ? "中" : "东";
  return `${ns}${ew}区`;
}
