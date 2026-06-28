"use client";

export interface NearbyPlace {
  name: string;
  type: string;
  distance: number;
  address?: string;
}

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string };
  }
}

let amapPromise: Promise<any> | null = null;

/**
 * 延迟加载 AMap。注意 @amap/amap-jsapi-loader 在模块顶层访问 window，
 * 不能在文件顶部 import（会导致 SSR `window is not defined`）。
 * 这里用 dynamic import 把它推迟到首次调用时才执行 —— 那时一定在浏览器里。
 */
async function loadAMap(): Promise<any> {
  if (amapPromise) return amapPromise;

  const key = process.env.NEXT_PUBLIC_AMAP_KEY;
  const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE;
  if (!key) {
    return Promise.reject(new Error("缺少 NEXT_PUBLIC_AMAP_KEY"));
  }
  if (securityCode && typeof window !== "undefined") {
    window._AMapSecurityConfig = { securityJsCode: securityCode };
  }

  const { default: AMapLoader } = await import("@amap/amap-jsapi-loader");

  amapPromise = AMapLoader.load({
    key,
    version: "2.0",
    plugins: ["AMap.PlaceSearch"],
  });
  return amapPromise;
}

/**
 * 浏览器端调用高德 PlaceSearch，按距离排序返回周边 POI。
 * 与服务端的 lib/amap/poi.ts (REST API) 互为补充 — Web 端 Key 无法调 REST，
 * 但 JS API 可以。前端搜索结果传给后端供 AI 参考。
 */
export async function searchNearbyPlaces(
  lng: number,
  lat: number,
  radius = 200
): Promise<NearbyPlace[]> {
  // SSR 兜底：window 不存在直接返回空数组（不会被调用，但保险）
  if (typeof window === "undefined") return [];

  try {
    const AMap = await loadAMap();
    return await new Promise<NearbyPlace[]>((resolve) => {
      const ps = new AMap.PlaceSearch({
        pageSize: 20,
        pageIndex: 1,
        extensions: "base",
      });
      ps.searchNearBy(
        "",
        new AMap.LngLat(lng, lat),
        radius,
        (status: string, result: any) => {
          if (status === "complete" && Array.isArray(result?.poiList?.pois)) {
            const places: NearbyPlace[] = result.poiList.pois.map((p: any) => ({
              name: p.name,
              type: (p.type || "").split(";").pop()?.trim() || "其他",
              distance: Math.round(Number(p.distance) || 0),
              address: p.address || undefined,
            }));
            places.sort((a, b) => a.distance - b.distance);
            resolve(places.slice(0, 15));
          } else {
            resolve([]);
          }
        }
      );
    });
  } catch (err) {
    console.warn("[amap] searchNearbyPlaces 失败:", err);
    return [];
  }
}

