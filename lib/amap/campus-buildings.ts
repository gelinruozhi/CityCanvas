"use client";

import type { CampusBuilding, BuildingType } from "@/lib/types";

/** 米 → 经纬度偏移（小范围近似） */
function metersToDeg(lngLatCenter: { lng: number; lat: number }, dx: number, dy: number) {
  const dLat = dy / 111320;
  const dLng = dx / (111320 * Math.cos((lngLatCenter.lat * Math.PI) / 180));
  return { dLng, dLat };
}

function metersBetween(a: { lng: number; lat: number }, b: { lng: number; lat: number }) {
  const dLat = ((b.lat - a.lat) * 111320);
  const dLng = ((b.lng - a.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180));
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
 * 尺寸按校园单体建筑的常见规模收紧，避免一块足迹盖住半条路。
 */
function estimateBuilding(name: string, type: string): BuildingEstimate | null {
  const t = `${type}|${name}`;
  if (/宿舍|公寓/.test(t)) return { buildingType: "dorm", size: [34, 13], floorCount: 6 };
  if (/食堂|餐厅/.test(t)) return { buildingType: "canteen", size: [36, 22], floorCount: 3 };
  if (/图书馆/.test(t)) return { buildingType: "library", size: [52, 26], floorCount: 5 };
  if (/体育馆|游泳|健身/.test(t)) return { buildingType: "gym", size: [46, 30], floorCount: 2 };
  if (/实验/.test(t)) return { buildingType: "lab", size: [48, 18], floorCount: 5 };
  if (/教学楼|教研/.test(t) || /科教文化/.test(type))
    return { buildingType: "teaching", size: [46, 16], floorCount: 5 };
  if (/超市|快递|医务|驿站|打印|银行/.test(t))
    return { buildingType: "store", size: [20, 12], floorCount: 2 };
  if (/咖啡|奶茶|轻食/.test(t)) return { buildingType: "cafe", size: [16, 10], floorCount: 1 };
  if (/篮球|网球|球场/.test(t)) return { buildingType: "court", size: [30, 18], floorCount: 0 };
  if (/操场|运动场|足球/.test(t)) return { buildingType: "field", size: [95, 62], floorCount: 0 };
  if (/广场|景观|湖/.test(t)) return { buildingType: "plaza", size: [50, 38], floorCount: 0 };
  return null;
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

/**
 * 从高德 POI 拉取校园周边建筑并生成可交互足迹（按类型估算的矩形）。
 * 拉取两页（50 条）覆盖更多建筑；窗口/小店吸附进所属大建筑。
 * 室外场地（操场/球场/广场）floorCount 为 0 —— 无室内编辑。
 */
export async function fetchCampusBuildings(
  AMap: any,
  center: { lng: number; lat: number },
  radius = 650
): Promise<CampusBuilding[]> {
  const pois: Array<{ name: string; type: string; lng: number; lat: number }> = [];
  try {
    for (const pageIndex of [1, 2]) {
      const page = await new Promise<any[]>((resolve) => {
        try {
          const ps = new AMap.PlaceSearch({
            pageSize: 25,
            pageIndex,
            extensions: "base",
          });
          ps.searchNearBy(
            "",
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
      for (const poi of page) {
        const lng = Number(poi.location?.lng);
        const lat = Number(poi.location?.lat);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
        pois.push({ name: String(poi.name || "").trim(), type: String(poi.type || ""), lng, lat });
      }
      if (page.length < 25) break; // 没有更多了
    }
  } catch (err) {
    console.warn("[amap] fetchCampusBuildings 拉取 POI 失败:", err);
    return [];
  }

  // 第一遍：识别"大建筑"（可容纳经营点的主体建筑）
  const majors: Array<{ name: string; type: string; lng: number; lat: number }> = [];
  for (const p of pois) {
    const est = estimateBuilding(p.name, p.type);
    if (est && ["teaching", "dorm", "canteen", "library", "gym", "lab"].includes(est.buildingType)) {
      majors.push(p);
    }
  }

  // 第二遍：生成建筑，小店/窗口吸附进 25m 内的大建筑
  const seen = new Set<string>();
  const buildings: CampusBuilding[] = [];
  for (const p of pois) {
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
  return buildings;
}

/** 楼层列表："1F".."NF"；室外场地（floorCount=0）为空 */
export function buildingFloors(floorCount: number): string[] {
  return Array.from({ length: Math.max(0, floorCount) }, (_, i) => `${i + 1}F`);
}
