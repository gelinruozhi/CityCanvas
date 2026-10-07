import type { BuildingType } from "@/lib/types";

/**
 * 建筑类型 → 室内允许添加的创意类型。
 * 审时度势：在什么楼里就能提什么创意（餐厅 3F 不能修图书馆）。
 * 未列出的建筑类型默认全部允许。
 */
const COMPATIBLE_INDOOR: Partial<Record<BuildingType, BuildingType[]>> = {
  teaching: ["studyroom", "cafe", "store", "vending", "logistics", "art", "bench", "other"],
  library: ["studyroom", "cafe", "store", "vending", "logistics", "art", "bench", "other"],
  dorm: ["store", "logistics", "vending", "studyroom", "cafe", "art", "bench", "other"],
  canteen: ["canteen", "cafe", "store", "vending", "art", "bench", "other"],
  gym: ["gym", "medical", "vending", "store", "cafe", "bench", "other"],
  culture: ["culture", "art", "cafe", "store", "vending", "bench", "other"],
  lab: ["studyroom", "store", "vending", "logistics", "art", "bench", "other"],
  medical: ["store", "vending", "art", "bench", "other"],
};

export function allowedIndoorTypes(buildingType: BuildingType): BuildingType[] | null {
  return COMPATIBLE_INDOOR[buildingType] ?? null;
}

/** 室内创意的类型是否合理（未定义规则的建筑视为自由） */
export function isIndoorTypeAllowed(
  buildingType: BuildingType,
  ideaType: BuildingType
): boolean {
  const allowed = COMPATIBLE_INDOOR[buildingType];
  return !allowed || allowed.includes(ideaType);
}

/** 给用户的提示文案 */
export function indoorTypeHint(buildingType: BuildingType): string | null {
  const hints: Partial<Record<BuildingType, string>> = {
    teaching: "教学楼内适合：自习区、咖啡角、便利店、贩卖机、文化装饰等",
    library: "图书馆内适合：自习区、咖啡角、书咖、文化展示等",
    dorm: "宿舍楼内适合：便利店、快递柜、自习角、咖啡角、贩卖机等生活服务",
    canteen: "餐厅内适合：档口、奶茶咖啡、便利店等餐饮服务",
    gym: "体育馆内适合：运动空间、健身配套等",
    culture: "文化场馆内适合：展览、艺术装置、文创空间等",
    lab: "实验楼内适合：自习区、便利店配套等",
    medical: "医务室内适合：自助取药、候诊配套、健康宣传设施等",
  };
  return hints[buildingType] ?? null;
}
