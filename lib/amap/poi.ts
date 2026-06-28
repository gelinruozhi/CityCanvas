export interface NearbyPoi {
  name: string;
  type: string;
  distance: number;
}

/**
 * 高德周边搜索 - REST API
 * 文档：https://lbs.amap.com/api/webservice/guide/api/search#around
 * 注意：需要 Web 服务类型的 Key。Web 端 Key 调用会返回 USERKEY_PLAT_NOMATCH。
 */
export async function searchNearbyPois(
  lng: number,
  lat: number,
  radius = 200
): Promise<NearbyPoi[]> {
  const key = process.env.AMAP_REST_KEY;
  if (!key) {
    console.warn("[amap] AMAP_REST_KEY 缺失，跳过 POI 搜索");
    return [];
  }

  const url = new URL("https://restapi.amap.com/v3/place/around");
  url.searchParams.set("key", key);
  url.searchParams.set("location", `${lng},${lat}`);
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("offset", "20");
  url.searchParams.set("extensions", "base");
  url.searchParams.set("sortrule", "distance");

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.warn("[amap] HTTP", res.status);
      return [];
    }
    const json: any = await res.json();
    if (json.status !== "1" || !Array.isArray(json.pois)) {
      console.warn("[amap] API error:", json.info, json.infocode);
      return [];
    }
    return json.pois.slice(0, 15).map((p: any) => ({
      name: p.name,
      type: (p.type || "").split(";")[0] || "其他",
      distance: Number(p.distance) || 0,
    }));
  } catch (err) {
    console.warn("[amap] fetch failed:", err);
    return [];
  }
}
