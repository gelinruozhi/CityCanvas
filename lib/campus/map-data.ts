import type { BuildingType } from "@/lib/types";

/**
 * 校园画布数据 —— 网格纪律版：
 * 路网先定（北横 y95 / 中横 y262 / 南横 y430 / 东小横 y555 / 主纵 x420 / 东纵 x760 / 西纵 x155），
 * 所有楼放在街区中央，与道路间距 ≥30m，楼与楼间距 ≥45m，零重叠。
 * 布局对应学校平面图（一号楼西北/二号中北/三号西/图书馆中北/四号中/五号中南/
 * 七号中南/九号中南偏西/六号东南/八号东南/一餐东北/二餐中南/三餐南/
 * A区公寓东北/B区公寓西/C区公寓南/教师之家西）。
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
  // ===== 北带（北横路上方） =====
  { id: "clinic", name: "医务室", buildingType: "store", x: 830, y: 48, size: [60, 30], floorCount: 1 },
  { id: "northField", name: "北运动场", buildingType: "field", x: 660, y: 50, size: [150, 48], floorCount: 0 },
  // ===== 行1（y 135~240，北横与中横之间） =====
  { id: "b1", name: "一号教学楼", buildingType: "teaching", x: 300, y: 190, size: [110, 32], floorCount: 5 },
  { id: "b2", name: "二号教学楼", buildingType: "teaching", x: 540, y: 190, size: [110, 32], floorCount: 5 },
  { id: "dorm1", name: "一号学生公寓", buildingType: "dorm", x: 700, y: 190, size: [88, 28], floorCount: 6 },
  { id: "b3", name: "三号教学楼", buildingType: "teaching", x: 150, y: 255, size: [110, 32], floorCount: 5 },
  { id: "lib", name: "图书馆", buildingType: "library", x: 310, y: 255, size: [100, 42], floorCount: 5 },
  { id: "b4", name: "四号教学楼", buildingType: "teaching", x: 500, y: 255, size: [110, 32], floorCount: 5 },
  { id: "dorm2", name: "二号学生公寓", buildingType: "dorm", x: 700, y: 255, size: [88, 28], floorCount: 6 },
  // ===== 行2（y 320~430，中横与南横之间） =====
  { id: "b5", name: "五号教学楼", buildingType: "teaching", x: 300, y: 375, size: [110, 32], floorCount: 5 },
  { id: "dorm4", name: "四号学生公寓", buildingType: "dorm", x: 170, y: 375, size: [88, 28], floorCount: 6 },
  { id: "shop", name: "校园超市", buildingType: "store", x: 620, y: 330, size: [65, 30], floorCount: 2 },
  { id: "canteen1", name: "第一餐厅", buildingType: "canteen", x: 870, y: 375, size: [95, 36], floorCount: 3 },
  // ===== 行3（y 460~555） =====
  { id: "teacher", name: "教师之家", buildingType: "dorm", x: 160, y: 470, size: [70, 32], floorCount: 4 },
  { id: "canteen2", name: "第二餐厅", buildingType: "canteen", x: 450, y: 492, size: [95, 36], floorCount: 3 },
  { id: "dorm5", name: "五号学生公寓", buildingType: "dorm", x: 230, y: 492, size: [88, 28], floorCount: 6 },
  { id: "b7", name: "七号教学楼", buildingType: "teaching", x: 300, y: 525, size: [110, 32], floorCount: 5 },
  { id: "westField", name: "西运动场", buildingType: "field", x: 170, y: 600, size: [150, 48], floorCount: 0 },
  { id: "b9", name: "九号教学楼", buildingType: "teaching", x: 330, y: 660, size: [110, 32], floorCount: 5 },
  { id: "b6", name: "六号教学楼", buildingType: "teaching", x: 470, y: 600, size: [110, 32], floorCount: 5 },
  { id: "b8", name: "八号教学楼", buildingType: "teaching", x: 610, y: 600, size: [110, 32], floorCount: 5 },
  { id: "dorm6", name: "六号学生公寓", buildingType: "dorm", x: 730, y: 600, size: [88, 28], floorCount: 6 },
  { id: "canteen3", name: "第三餐厅", buildingType: "canteen", x: 430, y: 690, size: [95, 34], floorCount: 3 },
  { id: "dorm7", name: "七号学生公寓", buildingType: "dorm", x: 560, y: 690, size: [88, 28], floorCount: 6 },
  { id: "dorm8", name: "八号学生公寓", buildingType: "dorm", x: 650, y: 690, size: [88, 28], floorCount: 6 },
  { id: "dorm9", name: "九号学生公寓", buildingType: "dorm", x: 330, y: 690, size: [88, 28], floorCount: 6 },
];

/** 景观湖（椭圆）—— 北横路上方、主纵路西侧 */
export const CAMPUS_LAKE = { x: 260, y: 48, rx: 55, ry: 22 };

/** 主干道路（折线）—— 网格路网，全部避让楼栋 */
export const CAMPUS_ROADS: Array<{ pts: Array<[number, number]>; width: number }> = [
  { pts: [[420, 20], [420, 718]], width: 15 },   // 主纵路（北门贯穿）
  { pts: [[760, 20], [760, 690]], width: 13 },   // 东纵路
  { pts: [[155, 95], [155, 520]], width: 12 },   // 西纵路
  { pts: [[130, 95], [900, 95]], width: 14 },    // 北横路
  { pts: [[130, 262], [900, 262]], width: 14 },  // 中横路
  { pts: [[130, 430], [760, 430]], width: 12 },  // 南横路
  { pts: [[130, 555], [900, 555]], width: 12 },  // 东小横路
];

/** 绿地树丛装饰（楼间空地） */
export const CAMPUS_GREENS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 200, y: 130, w: 110, h: 90 },   // 一号楼与主纵路间
  { x: 610, y: 130, w: 90, h: 120 },   // 二号楼与一号公寓间
  { x: 210, y: 210, w: 90, h: 160 },   // 一号楼与三号楼间
  { x: 380, y: 210, w: 110, h: 160 },  // 图书馆与四号楼间
  { x: 600, y: 300, w: 100, h: 120 },  // 四号楼与一餐间
  { x: 380, y: 420, w: 110, h: 100 },  // 五号楼与二餐间
  { x: 160, y: 430, w: 60, h: 90 },    // 教师之家用
  { x: 290, y: 585, w: 90, h: 80 },    // 七号楼与九号楼间
  { x: 540, y: 590, w: 90, h: 80 },    // 九号楼与六号楼间
  { x: 660, y: 650, w: 60, h: 90 },    // 六号公寓与八号公寓间
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
  const ns = y < 200 ? "北" : y < 400 ? "中北" : y < 555 ? "中南" : "南";
  const ew = x < 250 ? "西" : x < 600 ? "中" : "东";
  return `${ns}${ew}区`;
}
