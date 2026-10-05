import type { BuildingType } from "@/lib/types";

/**
 * 校园画布数据 —— 完全按用户提供的标准布局图 1:1 绘制。
 * 每个楼的位置 = 布局图上标签的位置；道路 = 图上白色路带。
 * 画布 948 × 718（与布局图同尺寸）。
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
  // ===== 顶部 =====
  { id: "clinic", name: "医务室", buildingType: "store", x: 815, y: 72, size: [70, 34], floorCount: 1 },
  { id: "northField", name: "北运动场", buildingType: "field", x: 712, y: 118, size: [150, 58], floorCount: 0 },
  // ===== A 区学生公寓（东侧纵列） =====
  { id: "dorm1", name: "一号学生公寓", buildingType: "dorm", x: 737, y: 168, size: [88, 34], floorCount: 6 },
  { id: "dorm2", name: "二号学生公寓", buildingType: "dorm", x: 732, y: 228, size: [88, 34], floorCount: 6 },
  { id: "dorm3", name: "三号学生公寓", buildingType: "dorm", x: 727, y: 288, size: [88, 34], floorCount: 6 },
  // ===== 西北教学区 =====
  { id: "b1", name: "一号教学楼", buildingType: "teaching", x: 137, y: 188, size: [95, 38], floorCount: 5 },
  { id: "lib", name: "图书馆", buildingType: "library", x: 282, y: 248, size: [95, 38], floorCount: 5 },
  { id: "b2", name: "二号教学楼", buildingType: "teaching", x: 465, y: 248, size: [95, 38], floorCount: 5 },
  { id: "b3", name: "三号教学楼", buildingType: "teaching", x: 125, y: 306, size: [95, 38], floorCount: 5 },
  // ===== 中部 =====
  { id: "b4", name: "四号教学楼", buildingType: "teaching", x: 435, y: 348, size: [95, 38], floorCount: 5 },
  { id: "shop", name: "校园超市", buildingType: "store", x: 628, y: 348, size: [70, 32], floorCount: 2 },
  { id: "canteen1", name: "第一餐厅", buildingType: "canteen", x: 760, y: 370, size: [88, 38], floorCount: 3 },
  { id: "b5", name: "五号教学楼", buildingType: "teaching", x: 300, y: 418, size: [95, 38], floorCount: 5 },
  // ===== B 区学生公寓（西） =====
  { id: "dorm4", name: "四号学生公寓", buildingType: "dorm", x: 230, y: 418, size: [88, 34], floorCount: 6 },
  { id: "teacher", name: "教师之家", buildingType: "dorm", x: 162, y: 458, size: [70, 32], floorCount: 4 },
  { id: "dorm5", name: "五号学生公寓", buildingType: "dorm", x: 232, y: 492, size: [88, 34], floorCount: 6 },
  // ===== 东部 =====
  { id: "eastField", name: "东运动场", buildingType: "field", x: 712, y: 428, size: [170, 64], floorCount: 0 },
  { id: "activity", name: "大学生活动中心", buildingType: "culture", x: 718, y: 478, size: [88, 34], floorCount: 3 },
  { id: "museum", name: "校史馆", buildingType: "culture", x: 722, y: 505, size: [70, 30], floorCount: 2 },
  // ===== 中南 =====
  { id: "b7", name: "七号教学楼", buildingType: "teaching", x: 435, y: 548, size: [95, 38], floorCount: 5 },
  { id: "dorm6", name: "六号学生公寓", buildingType: "dorm", x: 718, y: 545, size: [88, 34], floorCount: 6 },
  { id: "b9", name: "九号教学楼", buildingType: "teaching", x: 470, y: 582, size: [95, 38], floorCount: 5 },
  { id: "b8", name: "八号教学楼", buildingType: "teaching", x: 720, y: 585, size: [88, 34], floorCount: 5 },
  { id: "dorm7", name: "七号学生公寓", buildingType: "dorm", x: 520, y: 615, size: [88, 34], floorCount: 6 },
  // ===== 西南 =====
  { id: "westField", name: "西运动场", buildingType: "field", x: 175, y: 565, size: [140, 58], floorCount: 0 },
  { id: "canteen2", name: "第二餐厅", buildingType: "canteen", x: 435, y: 482, size: [88, 38], floorCount: 3 },
  { id: "canteen3", name: "第三餐厅", buildingType: "canteen", x: 365, y: 628, size: [88, 36], floorCount: 3 },
  { id: "dorm9", name: "九号学生公寓", buildingType: "dorm", x: 388, y: 672, size: [88, 34], floorCount: 6 },
  { id: "dorm8", name: "八号学生公寓", buildingType: "dorm", x: 520, y: 655, size: [88, 34], floorCount: 6 },
];

/** 景观湖（椭圆）—— 北门内偏东 */
export const CAMPUS_LAKE = { x: 535, y: 152, rx: 55, ry: 28 };

/** 主干道路（折线）—— 按布局图路网 */
export const CAMPUS_ROADS: Array<{ pts: Array<[number, number]>; width: number }> = [
  { pts: [[470, 60], [470, 380], [460, 660]], width: 18 },      // 北门主纵路
  { pts: [[770, 60], [770, 620]], width: 16 },                   // 东纵路
  { pts: [[150, 100], [790, 100]], width: 16 },                  // 北横路
  { pts: [[135, 345], [790, 345]], width: 16 },                  // 中横路（四号教学楼/超市前）
  { pts: [[135, 455], [600, 455]], width: 14 },                  // 二横路（五号教学楼/教师之家前）
  { pts: [[150, 170], [150, 560]], width: 14 },                  // 西纵路
  { pts: [[250, 610], [780, 612]], width: 14 },                  // 南横路（宿舍区）
  { pts: [[255, 480], [255, 612]], width: 12 },                  // 西南连接
  { pts: [[620, 345], [620, 260]], width: 12 },                  // 超市支路
];

/** 绿地树丛装饰 */
export const CAMPUS_GREENS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 300, y: 120, w: 130, h: 90 },    // 湖西绿地
  { x: 545, y: 120, w: 120, h: 80 },    // 湖东绿地
  { x: 560, y: 380, w: 120, h: 60 },    // 超市北绿地
  { x: 300, y: 380, w: 100, h: 60 },    // 四号教学楼旁
  { x: 560, y: 440, w: 90, h: 90 },     // 东运动场西
  { x: 320, y: 470, w: 90, h: 70 },     // 五号教学楼南
  { x: 560, y: 560, w: 110, h: 60 },    // 中南绿地
  { x: 300, y: 560, w: 80, h: 60 },     // 七号教学楼西
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
  const ns = y < 200 ? "北" : y < 400 ? "中北" : y < 550 ? "中南" : "南";
  const ew = x < 250 ? "西" : x < 600 ? "中" : "东";
  return `${ns}${ew}区`;
}
