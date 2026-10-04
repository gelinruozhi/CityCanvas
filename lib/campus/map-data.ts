import type { BuildingType } from "@/lib/types";

/**
 * 校园画布数据 —— 完全按用户提供的卡通平面图 1:1 绘制。
 * 坐标 = 平面图像素位置（1px = 1 画布单位），楼栋大小与平面图一致。
 * 画布 1080 × 1500。
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
  // ===== 教学楼 =====
  { id: "b1", name: "一号教学楼", buildingType: "teaching", x: 160, y: 370, size: [150, 60], floorCount: 5 },
  { id: "b2", name: "二号教学楼", buildingType: "teaching", x: 530, y: 490, size: [150, 60], floorCount: 5 },
  { id: "b3", name: "三号教学楼", buildingType: "teaching", x: 145, y: 570, size: [150, 60], floorCount: 5 },
  { id: "b4", name: "四号教学楼", buildingType: "teaching", x: 500, y: 640, size: [150, 60], floorCount: 5 },
  { id: "b5", name: "五号教学楼", buildingType: "teaching", x: 490, y: 770, size: [150, 60], floorCount: 5 },
  { id: "b7", name: "七号教学楼", buildingType: "teaching", x: 475, y: 1030, size: [150, 60], floorCount: 5 },
  { id: "b9", name: "九号教学楼", buildingType: "teaching", x: 505, y: 1160, size: [150, 60], floorCount: 5 },
  { id: "b6", name: "六号教学楼", buildingType: "teaching", x: 850, y: 1080, size: [150, 60], floorCount: 5 },
  { id: "b8", name: "八号教学楼", buildingType: "teaching", x: 850, y: 1220, size: [150, 60], floorCount: 5 },
  { id: "lib", name: "图书馆", buildingType: "library", x: 320, y: 510, size: [130, 85], floorCount: 5 },
  // ===== 餐饮 =====
  { id: "canteen1", name: "第一餐厅", buildingType: "canteen", x: 950, y: 690, size: [130, 70], floorCount: 3 },
  { id: "canteen2", name: "第二餐厅", buildingType: "canteen", x: 520, y: 900, size: [130, 70], floorCount: 3 },
  { id: "canteen3", name: "第三餐厅", buildingType: "canteen", x: 390, y: 1300, size: [130, 70], floorCount: 3 },
  // ===== A 区学生公寓（东北纵列 1-3 号） =====
  { id: "dorm1", name: "一号学生公寓", buildingType: "dorm", x: 880, y: 320, size: [110, 45], floorCount: 6 },
  { id: "dorm2", name: "二号学生公寓", buildingType: "dorm", x: 860, y: 450, size: [110, 45], floorCount: 6 },
  { id: "dorm3", name: "三号学生公寓", buildingType: "dorm", x: 850, y: 570, size: [110, 45], floorCount: 6 },
  // ===== B 区学生公寓（西，4-5 号 + 教师之家） =====
  { id: "dorm4", name: "四号学生公寓", buildingType: "dorm", x: 250, y: 790, size: [110, 45], floorCount: 6 },
  { id: "dorm5", name: "五号学生公寓", buildingType: "dorm", x: 235, y: 930, size: [110, 45], floorCount: 6 },
  { id: "teacher", name: "教师之家", buildingType: "dorm", x: 200, y: 860, size: [80, 45], floorCount: 4 },
  // ===== C 区学生公寓（南，6/7/8/9 号） =====
  { id: "dorm6", name: "六号学生公寓", buildingType: "dorm", x: 880, y: 1330, size: [110, 45], floorCount: 6 },
  { id: "dorm7", name: "七号学生公寓", buildingType: "dorm", x: 620, y: 1330, size: [110, 45], floorCount: 6 },
  { id: "dorm8", name: "八号学生公寓", buildingType: "dorm", x: 640, y: 1410, size: [110, 45], floorCount: 6 },
  { id: "dorm9", name: "九号学生公寓", buildingType: "dorm", x: 400, y: 1430, size: [110, 45], floorCount: 6 },
  // ===== 服务与配套 =====
  { id: "activity", name: "大学生活动中心", buildingType: "culture", x: 830, y: 890, size: [120, 60], floorCount: 3 },
  { id: "museum", name: "校史馆", buildingType: "culture", x: 900, y: 950, size: [90, 50], floorCount: 2 },
  { id: "shop", name: "校园超市", buildingType: "store", x: 790, y: 655, size: [70, 40], floorCount: 2 },
  { id: "clinic", name: "医务室", buildingType: "store", x: 940, y: 125, size: [60, 40], floorCount: 1 },
  // ===== 运动场（floorCount=0，室外） =====
  { id: "eastField", name: "东运动场", buildingType: "field", x: 880, y: 790, size: [220, 110], floorCount: 0 },
  { id: "northField", name: "北运动场", buildingType: "field", x: 890, y: 230, size: [200, 110], floorCount: 0 },
  { id: "westField", name: "西运动场", buildingType: "field", x: 250, y: 1160, size: [180, 100], floorCount: 0 },
];

/** 主干道路（折线）—— 按卡通平面图路网走向 */
export const CAMPUS_ROADS: Array<{ pts: Array<[number, number]>; width: number }> = [
  { pts: [[540, 160], [520, 480], [500, 880], [490, 1290]], width: 26 }, // 北门主路贯穿
  { pts: [[950, 250], [920, 850], [880, 1300]], width: 24 },             // 东环路
  { pts: [[90, 350], [80, 900], [140, 1300]], width: 22 },               // 西环路
  { pts: [[300, 190], [950, 200]], width: 22 },                          // 北门横路（经十东路边）
  { pts: [[150, 640], [900, 660]], width: 22 },                          // 图书馆前横路
  { pts: [[230, 880], [850, 890]], width: 20 },                          // 二餐前横路
  { pts: [[300, 1250], [880, 1250]], width: 20 },                        // 南区横路
  { pts: [[490, 1290], [400, 1400]], width: 16 },                        // 南区支路
];

/** 景观湖（椭圆）—— 北门内 */
export const CAMPUS_LAKE = { x: 600, y: 300, rx: 85, ry: 48 };

/** 绿地树丛装饰 */
export const CAMPUS_GREENS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 380, y: 220, w: 220, h: 120 },   // 湖西侧绿地
  { x: 620, y: 240, w: 240, h: 120 },   // 湖东侧绿地
  { x: 240, y: 700, w: 180, h: 120 },   // 三号教学楼前
  { x: 620, y: 740, w: 180, h: 100 },   // 四号教学楼前
  { x: 620, y: 950, w: 200, h: 130 },   // 二餐与活动中心间
  { x: 300, y: 1180, w: 160, h: 120 },  // 西运动场北
  { x: 700, y: 1140, w: 120, h: 120 },  // 七号楼旁
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
  const ns = y < 500 ? "北" : y < 800 ? "中北" : y < 1100 ? "中南" : "南";
  const ew = x < 300 ? "西" : x < 700 ? "中" : "东";
  return `${ns}${ew}区`;
}
