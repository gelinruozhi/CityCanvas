export type BuildingType =
  // 建筑（大尺度，可改造可新建）
  | "teaching"
  | "library"
  | "dorm"
  | "canteen"
  | "gym"
  | "culture"
  | "lab"
  // 场地 / 景观（中尺度，户外）
  | "field"
  | "court"
  | "park"
  | "plaza"
  | "parking"
  // 服务节点（小型独立空间）
  | "cafe"
  | "store"
  | "studyroom"
  | "logistics"
  // 设施小品（家具级）
  | "bench"
  | "lamp"
  | "bike"
  | "vending"
  | "art"
  // 兜底
  | "other";

export type BuildingGroup = "building" | "ground" | "service" | "facility" | "other";

export interface BuildingTypeMeta {
  value: BuildingType;
  group: BuildingGroup;
  label: string;
  emoji: string;
  color: string;
  /** 给 AI prompt 用的简短描述 */
  hint: string;
}

export interface BuildingGroupMeta {
  value: BuildingGroup;
  label: string;
  icon: string;
  desc: string;
}

export const BUILDING_GROUPS: BuildingGroupMeta[] = [
  {
    value: "building",
    label: "建筑",
    icon: "🏛️",
    desc: "整栋楼级别的改造或新建",
  },
  {
    value: "ground",
    label: "场地与景观",
    icon: "🌳",
    desc: "操场、绿地、广场等户外空间",
  },
  {
    value: "service",
    label: "服务节点",
    icon: "☕",
    desc: "咖啡店、便利店等小型独立空间",
  },
  {
    value: "facility",
    label: "设施小品",
    icon: "🛠️",
    desc: "座椅、路灯、艺术装置等家具级元素",
  },
  {
    value: "other",
    label: "其他",
    icon: "✨",
    desc: "未列入分类的特殊设想",
  },
];

export const BUILDING_TYPES: BuildingTypeMeta[] = [
  // ===== 建筑（大尺度）=====
  { value: "teaching", group: "building", label: "教学楼", emoji: "🏫", color: "#3b82f6", hint: "教学楼、阶梯教室、研讨教室" },
  { value: "library", group: "building", label: "图书馆", emoji: "📚", color: "#0ea5e9", hint: "图书馆、阅览室、自习楼" },
  { value: "dorm", group: "building", label: "宿舍楼", emoji: "🛏️", color: "#a855f7", hint: "学生公寓、教师宿舍、临时住宿" },
  { value: "canteen", group: "building", label: "食堂", emoji: "🍱", color: "#f97316", hint: "食堂、餐厅、独立餐饮门店" },
  { value: "gym", group: "building", label: "体育馆", emoji: "🏟️", color: "#10b981", hint: "室内体育馆、健身房、游泳馆" },
  { value: "culture", group: "building", label: "文化馆", emoji: "🎭", color: "#ec4899", hint: "展览馆、剧场、文化活动中心、校史馆" },
  { value: "lab", group: "building", label: "实验楼", emoji: "🔬", color: "#eab308", hint: "实验楼、创新中心、孵化器" },

  // ===== 场地与景观（中尺度）=====
  { value: "field", group: "ground", label: "操场", emoji: "⚽", color: "#22c55e", hint: "标准操场、足球场、田径场" },
  { value: "court", group: "ground", label: "球场", emoji: "🏀", color: "#84cc16", hint: "篮球场、网球场、排球场、羽毛球场" },
  { value: "park", group: "ground", label: "绿地", emoji: "🌳", color: "#16a34a", hint: "公园、草坪、林荫道、生态湖" },
  { value: "plaza", group: "ground", label: "广场", emoji: "🌟", color: "#f59e0b", hint: "中心广场、户外集会空间、入口广场" },
  { value: "parking", group: "ground", label: "停车场", emoji: "🅿️", color: "#64748b", hint: "汽车停车场、电瓶车棚、临时停车" },

  // ===== 服务节点（小型独立空间）=====
  { value: "cafe", group: "service", label: "咖啡店", emoji: "☕", color: "#a16207", hint: "咖啡馆、奶茶店、轻食吧、面包房" },
  { value: "store", group: "service", label: "便利店", emoji: "🏪", color: "#0284c7", hint: "超市、便利店、文具店、生活服务点" },
  { value: "studyroom", group: "service", label: "自习室", emoji: "📖", color: "#6366f1", hint: "24h 自习舱、共享自习空间、研讨小屋" },
  { value: "logistics", group: "service", label: "快递医务", emoji: "📦", color: "#ef4444", hint: "快递柜、菜鸟驿站、医务室、心理咨询点" },

  // ===== 设施小品（家具级）=====
  { value: "bench", group: "facility", label: "座椅", emoji: "🪑", color: "#78716c", hint: "排椅、长凳、户外座椅、休憩点" },
  { value: "lamp", group: "facility", label: "路灯", emoji: "💡", color: "#facc15", hint: "路灯、景观灯、感应夜灯、装饰灯" },
  { value: "bike", group: "facility", label: "单车点", emoji: "🚲", color: "#06b6d4", hint: "自行车架、共享单车点、车棚" },
  { value: "vending", group: "facility", label: "售卖机", emoji: "🥤", color: "#dc2626", hint: "自动售货机、饮水机、自助打印机" },
  { value: "art", group: "facility", label: "艺术装置", emoji: "🗿", color: "#d946ef", hint: "雕塑、装置艺术、文化标识、地面彩绘" },

  // ===== 兜底 =====
  { value: "other", group: "other", label: "其他", emoji: "✨", color: "#a78bfa", hint: "未列入上述分类的特殊用途空间或设施" },
];

/**
 * 旧版（六类/十一类）数据兼容映射 — 让历史 buildingType 能正常显示而不退化为"其他"。
 * 数据库里如果还存着旧值（dining/leisure/study/sports/green/service/transit/innovation 等），
 * 这里把它们映射到新表里最接近的类型。
 */
const LEGACY_TYPE_MAP: Record<string, BuildingType> = {
  dining: "canteen",
  leisure: "bench",
  study: "studyroom",
  sports: "field",
  green: "park",
  service: "logistics",
  transit: "bike",
  innovation: "lab",
};

export const getBuildingTypeMeta = (value: string): BuildingTypeMeta => {
  const target = (LEGACY_TYPE_MAP[value] ?? value) as BuildingType;
  return (
    BUILDING_TYPES.find((t) => t.value === target) ??
    BUILDING_TYPES[BUILDING_TYPES.length - 1]
  );
};

export interface AIScore {
  comfortScore: number;
  convenienceScore: number;
  overallScore: number;
  rating: "A+" | "A" | "B" | "C" | "D";
  summary: string;
  strengths: string[];
  concerns: string[];
  suggestions: string[];
  vibeTags: string[];
}

/** 标注形状：点（默认）/ 圆形区域 / 矩形区域 */
export type AnnotationShape = "point" | "circle" | "rect";

export interface ShapeBounds {
  sw: [number, number]; // 西南角 [lng, lat]
  ne: [number, number]; // 东北角 [lng, lat]
}

export const SHAPE_META: Record<
  AnnotationShape,
  { label: string; icon: string }
> = {
  point: { label: "点位", icon: "📍" },
  circle: { label: "圆形区域", icon: "⭕" },
  rect: { label: "矩形区域", icon: "⬜" },
};

export interface Annotation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  content: string;
  buildingType: BuildingType;
  shape: AnnotationShape;
  radius?: number; // circle 的半径（米）
  bounds?: ShapeBounds; // rect 的对角坐标
  buildingName?: string; // 室内标注所属建筑
  floor?: string; // 室内标注楼层，如 "3F"
  aiScore: AIScore | null;
  createdAt: number;
}

/** 可交互建筑信息（从高德 POI 动态生成足迹） */
export interface CampusBuilding {
  id: string;
  name: string;
  buildingType: BuildingType;
  center: { lng: number; lat: number };
  footprint: {
    sw: [number, number];
    ne: [number, number];
  };
  floorCount: number;
}

export interface MapView {
  center: [number, number];
  zoom: number;
}
