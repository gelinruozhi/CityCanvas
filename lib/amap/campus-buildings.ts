"use client";

import type { CampusBuilding, BuildingType } from "@/lib/types";
import { SUFE_CORE_BUILDINGS } from "./sufe-core-buildings";

/** 米 → 经纬度偏移（小范围近似） */
function metersToDeg(lngLatCenter: { lng: number; lat: number }, dx: number, dy: number) {
  const dLat = dy / 111320;
  const dLng = dx / (111320 * Math.cos((lngLatCenter.lat * Math.PI) / 180));
  return { dLng, dLat };
}

function metersBetween(a: { lng: number; lat: number }, b: { lng: number; lat: number }) {
  const dLat = (b.lat - a.lat) * 111320;
  const dLng = (b.lng - a.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

interface BuildingEstimate {
  buildingType: BuildingType;
  /** footprint 尺寸（米）：[东西宽, 南北深] */
  size: [number, number];
  floorCount: number;
}

/**
 * POI 类型/名称 → 建筑类型与估算 footprint。
 * 尺寸按校园单体建筑的常见规模收紧；未匹配的 POI 兜底为小型建筑，
 * 保证"高德有的标注都上地图"。
 */
function estimateBuilding(name: string, type: string): BuildingEstimate | null {
  const t = `${type}|${name}`;
  // 明确不是建筑的 POI：校门、车站、道路、校园周边商业
  if (/^[东南西北]?门$/.test(name)) return null;
  if (/公交|地铁站|停车场出入口|道路/.test(t)) return null;
  if (/美甲|美容|美发|理发|民宿|宾馆|酒店|公司|商贸|家居|工作室|汽修|驾校/.test(t))
    return null;
  if (/宿舍|公寓/.test(t)) return { buildingType: "dorm", size: [34, 13], floorCount: 6 };
  if (/食堂|餐厅/.test(t)) return { buildingType: "canteen", size: [36, 22], floorCount: 3 };
  if (/图书馆/.test(t)) return { buildingType: "library", size: [52, 26], floorCount: 5 };
  if (/体育馆|游泳|健身/.test(t)) return { buildingType: "gym", size: [46, 30], floorCount: 2 };
  if (/实验/.test(t)) return { buildingType: "lab", size: [48, 18], floorCount: 5 };
  if (/教学楼|教研|学院/.test(t) || /科教文化/.test(type))
    return { buildingType: "teaching", size: [46, 16], floorCount: 5 };
  if (/篮球|网球|球场/.test(t)) return { buildingType: "court", size: [30, 18], floorCount: 0 };
  if (/操场|运动场|足球/.test(t)) return { buildingType: "field", size: [95, 62], floorCount: 0 };
  if (/广场|景观|湖/.test(t)) return { buildingType: "plaza", size: [50, 38], floorCount: 0 };
  if (/超市|快递|医务|驿站|打印|银行/.test(t))
    return { buildingType: "store", size: [20, 12], floorCount: 2 };
  if (/咖啡|奶茶|轻食/.test(t)) return { buildingType: "cafe", size: [16, 10], floorCount: 1 };
  // 兜底：高德标注了但类型未知的 POI 也上地图（小型建筑）
  if (/公司|厂家|住宅小区|小区/.test(t)) return null;
  return { buildingType: "other", size: [18, 12], floorCount: 1 };
}

/**
 * 是否应该并入附近的大建筑：
 * 窗口/档口/连锁小店等"建筑内的经营点"不独立成楼，
 * 靠近教学楼/宿舍/餐厅/图书馆 25m 内时吸附进去。
 */
function shouldAbsorbIntoNearby(
  name: string,
  type: string,
  center: { lng: number; lat: number },
  majorBuildings: Array<{ lng: number; lat: number }>
): boolean {
  const isSmallPoint = /咖啡|奶茶|便利店|超市|快递|驿站|打印|窗口|档口|小吃|店/.test(
    `${type}|${name}`
  );
  if (!isSmallPoint) return false;
  return majorBuildings.some((b) =>
    metersBetween(center, { lng: b.lng, lat: b.lat }) <= 25
  );
}

/** 轴对齐矩形的交叠率：相交面积 / 较小面积 */
function rectOverlapRatio(
  a: CampusBuilding["footprint"],
  b: CampusBuilding["footprint"]
): number {
  const ix = Math.min(a.ne[0], b.ne[0]) - Math.max(a.sw[0], b.sw[0]);
  const iy = Math.min(a.ne[1], b.ne[1]) - Math.max(a.sw[1], b.sw[1]);
  if (ix <= 0 || iy <= 0) return 0;
  const areaA = (a.ne[0] - a.sw[0]) * (a.ne[1] - a.sw[1]);
  const areaB = (b.ne[0] - b.sw[0]) * (b.ne[1] - b.sw[1]);
  const inter = ix * iy;
  return inter / Math.min(areaA, areaB);
}

/** 合并排序权重：楼多的、类型更"主体"的、名字更短的优先作为合并后的主体 */
function mergeWeight(b: CampusBuilding): number {
  const typeRank: Record<string, number> = {
    teaching: 6, library: 6, canteen: 5, dorm: 5, gym: 4, lab: 4,
    court: 2, field: 2, plaza: 2, store: 1, cafe: 1, other: 0,
  };
  return (b.floorCount > 0 ? 10 : 0) + (typeRank[b.buildingType] ?? 0);
}

/**
 * 从高德 POI 拉取校园周边建筑并生成可交互足迹（按类型估算的矩形）。
 * 拉取两页（50 条）覆盖更多建筑；未匹配类型兜底为小型建筑；
 * 窗口/小店吸附进所属大建筑；重叠过大的足迹合并为一个。
 */
export async function fetchCampusBuildings(
  AMap: any,
  center: { lng: number; lat: number },
  radius = 450
): Promise<CampusBuilding[]> {
  const pois: Array<{ name: string; type: string; lng: number; lat: number }> = [];
  const seenPoi = new Set<string>();
  const collect = (list: any[]) => {
    for (const poi of list) {
      const lng = Number(poi.location?.lng);
      const lat = Number(poi.location?.lat);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
      const name = String(poi.name || "").trim();
      if (!name) continue;
      const key = `${name}|${lng.toFixed(5)}|${lat.toFixed(5)}`;
      if (seenPoi.has(key)) continue;
      seenPoi.add(key);
      pois.push({ name, type: String(poi.type || ""), lng, lat });
    }
  };

  const searchPage = (kw: string, pageIndex: number) =>
    new Promise<any[]>((resolve) => {
      try {
        const ps = new AMap.PlaceSearch({
          pageSize: 25,
          pageIndex,
          extensions: "base",
        });
        ps.searchNearBy(
          kw,
          new AMap.LngLat(center.lng, center.lat),
          radius,
          (status: string, result: any) => {
            if (status === "complete" && Array.isArray(result?.poiList?.pois)) {
              resolve(result.poiList.pois);
            } else {
              resolve([]);
            }
          }
        );
      } catch {
        resolve([]);
      }
    });

  try {
    for (const pageIndex of [1, 2, 3]) {
      const page = await searchPage("", pageIndex);
      collect(page);
      if (page.length < 25) break; // 没有更多了
    }

    // 专项补充：教学楼/公寓/餐厅等主体建筑在高德常挂在校名下而非独立 POI，
    // 空关键词搜不全 —— 按关键词定向搜
    for (const kw of [
      "教学楼",
      "学生公寓",
      "宿舍",
      "餐厅",
      "图书馆",
      "实验楼",
      "操场",
    ]) {
      collect(await searchPage(kw, 1));
    }
  } catch (err) {
    console.warn("[amap] fetchCampusBuildings 拉取 POI 失败:", err);
    return [];
  }

  // 第一遍：识别"大建筑"（可容纳经营点的主体建筑）
  const majors: Array<{ lng: number; lat: number }> = [];
  for (const p of pois) {
    const est = estimateBuilding(p.name, p.type);
    if (est && ["teaching", "dorm", "canteen", "library", "gym", "lab"].includes(est.buildingType)) {
      majors.push({ lng: p.lng, lat: p.lat });
    }
  }

  // 第二遍：生成建筑（聚焦校园范围内），小店/窗口吸附进 25m 内的大建筑。
  // 静态核心建筑（高德未收录的主体楼栋）优先，动态 POI 重名的跳过。
  const seen = new Set<string>();
  let buildings: CampusBuilding[] = SUFE_CORE_BUILDINGS.map((c, i) => {
    const { dLng, dLat } = metersToDeg({ lng: c.lng, lat: c.lat }, c.size[0] / 2, c.size[1] / 2);
    return {
      id: `core_${i}_${c.name}`,
      name: c.name,
      buildingType: c.buildingType,
      center: { lng: c.lng, lat: c.lat },
      footprint: {
        sw: [c.lng - dLng, c.lat - dLat],
        ne: [c.lng + dLng, c.lat + dLat],
      },
      floorCount: c.floorCount,
    };
  });
  const coreNames = new Set(SUFE_CORE_BUILDINGS.map((c) => c.name));
  const isCoreName = (name: string) => {
    // 动态 POI 名含核心建筑名（如"山东财经大学章丘校区第一教学楼"含"第一教学楼"）即视为同一建筑
    for (const cn of coreNames) if (name.includes(cn)) return true;
    return false;
  };
  for (const p of pois) {
    // 只保留校园范围内的建筑（半径 450m 搜索圈里再收紧到 420m）
    if (metersBetween(center, p) > 420) continue;
    if (isCoreName(p.name)) continue;
    const key = p.name.replace(/\(.*?\)/g, "");
    if (seen.has(key)) continue;
    const est = estimateBuilding(p.name, p.type);
    if (!est) continue;
    if (shouldAbsorbIntoNearby(p.name, p.type, p, majors)) continue;
    seen.add(key);

    const { dLng, dLat } = metersToDeg({ lng: p.lng, lat: p.lat }, est.size[0] / 2, est.size[1] / 2);
    buildings.push({
      id: `b_${buildings.length}_${key}`,
      name: p.name,
      buildingType: est.buildingType,
      center: { lng: p.lng, lat: p.lat },
      footprint: {
        sw: [p.lng - dLng, p.lat - dLat],
        ne: [p.lng + dLng, p.lat + dLat],
      },
      floorCount: est.floorCount,
    });
  }

  // 第三遍：合并重复 —— 只合并"同一个位置的同一场所述"：
  // 中心距 < 12m，或足迹交叠 > 60% 且名称同源（如"XX餐厅"与"XX餐厅(主楼)"）。
  // 相邻的独立建筑（密排教学楼等）即使足迹有估算重叠也保留，确保覆盖每一栋。
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < buildings.length; i++) {
      for (let j = i + 1; j < buildings.length; j++) {
        const a = buildings[i];
        const b = buildings[j];
        const core = (n: string) =>
          n.replace(/山东财经大学|章丘校区|圣井校区|\(|\)|（）/g, "").trim();
        const ca = core(a.name);
        const cb = core(b.name);
        const sameCore =
          ca === cb || (ca.length > 1 && cb.length > 1 && (ca.includes(cb) || cb.includes(ca)));
        const close = metersBetween(a.center, b.center) < 12;
        const overlap = sameCore && rectOverlapRatio(a.footprint, b.footprint) > 0.6;
        if (!close && !overlap) continue;
        const keep = mergeWeight(a) >= mergeWeight(b) ? a : b;
        const drop = keep === a ? b : a;
        buildings = buildings.filter((x) => x !== drop);
        merged = true;
        break outer;
      }
    }
  }

  return buildings;
}

/** 楼层列表："1F".."NF"；室外场地（floorCount=0）为空 */
export function buildingFloors(floorCount: number): string[] {
  return Array.from({ length: Math.max(0, floorCount) }, (_, i) => `${i + 1}F`);
}
