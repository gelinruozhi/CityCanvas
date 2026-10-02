"use client";

import type { CampusBuilding, BuildingType } from "@/lib/types";

/** 米 → 经纬度偏移（小范围近似） */
function metersToDeg(lngLatCenter: { lng: number; lat: number }, dx: number, dy: number) {
  const dLat = dy / 111320;
  const dLng = dx / (111320 * Math.cos((lngLatCenter.lat * Math.PI) / 180));
  return { dLng, dLat };
}

interface BuildingEstimate {
  buildingType: BuildingType;
  /** footprint 尺寸（米）：[东西宽, 南北深] */
  size: [number, number];
  floorCount: number;
}

/** POI 类型/名称 → 建筑类型与估算 footprint */
function estimateBuilding(name: string, type: string): BuildingEstimate | null {
  const t = `${type}|${name}`;
  if (/宿舍|公寓/.test(t)) return { buildingType: "dorm", size: [42, 16], floorCount: 6 };
  if (/食堂|餐厅/.test(t)) return { buildingType: "canteen", size: [45, 28], floorCount: 3 };
  if (/图书馆/.test(t)) return { buildingType: "library", size: [62, 30], floorCount: 5 };
  if (/体育馆|游泳|健身/.test(t)) return { buildingType: "gym", size: [55, 35], floorCount: 2 };
  if (/实验/.test(t)) return { buildingType: "lab", size: [55, 22], floorCount: 5 };
  if (/教学楼|教研/.test(t) || /科教文化/.test(type))
    return { buildingType: "teaching", size: [58, 20], floorCount: 5 };
  if (/超市|快递|医务|驿站|打印/.test(t))
    return { buildingType: "store", size: [28, 16], floorCount: 2 };
  if (/咖啡|奶茶|轻食/.test(t)) return { buildingType: "cafe", size: [22, 14], floorCount: 1 };
  if (/篮球|网球|球场/.test(t)) return { buildingType: "court", size: [32, 20], floorCount: 0 };
  if (/操场|运动场|足球/.test(t)) return { buildingType: "field", size: [105, 68], floorCount: 0 };
  if (/广场|景观|湖/.test(t)) return { buildingType: "plaza", size: [60, 45], floorCount: 0 };
  return null;
}

/**
 * 从高德 POI 拉取校园周边建筑并生成可交互足迹（按类型估算的矩形）。
 * 室外场地（操场/球场/广场）floorCount 为 0 —— 无室内编辑。
 */
export async function fetchCampusBuildings(
  AMap: any,
  center: { lng: number; lat: number },
  radius = 650
): Promise<CampusBuilding[]> {
  try {
    return await new Promise<CampusBuilding[]>((resolve) => {
      const ps = new AMap.PlaceSearch({
        pageSize: 25,
        pageIndex: 1,
        extensions: "base",
      });
      ps.searchNearBy(
        "",
        new AMap.LngLat(center.lng, center.lat),
        radius,
        (status: string, result: any) => {
          if (status !== "complete" || !Array.isArray(result?.poiList?.pois)) {
            resolve([]);
            return;
          }
          const seen = new Set<string>();
          const buildings: CampusBuilding[] = [];
          for (const poi of result.poiList.pois) {
            const name = String(poi.name || "").trim();
            const type = String(poi.type || "");
            const est = estimateBuilding(name, type);
            const lng = Number(poi.location?.lng);
            const lat = Number(poi.location?.lat);
            if (!est || !name || !Number.isFinite(lng) || !Number.isFinite(lat)) continue;
            // 同名/同位置去重（ POI 常有主副卡）
            const key = name.replace(/\(.*?\)/g, "");
            if (seen.has(key)) continue;
            seen.add(key);

            const { dLng, dLat } = metersToDeg({ lng, lat }, est.size[0] / 2, est.size[1] / 2);
            buildings.push({
              id: `b_${buildings.length}_${key}`,
              name,
              buildingType: est.buildingType,
              center: { lng, lat },
              footprint: {
                sw: [lng - dLng, lat - dLat],
                ne: [lng + dLng, lat + dLat],
              },
              floorCount: est.floorCount,
            });
          }
          resolve(buildings);
        }
      );
    });
  } catch (err) {
    console.warn("[amap] fetchCampusBuildings 失败:", err);
    return [];
  }
}

/** 楼层列表："1F".."NF"；室外场地（floorCount=0）为空 */
export function buildingFloors(floorCount: number): string[] {
  return Array.from({ length: Math.max(0, floorCount) }, (_, i) => `${i + 1}F`);
}
