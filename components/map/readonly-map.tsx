"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { AMAP_LIGHT_STYLE } from "@/lib/constants";
import { getBuildingTypeMeta } from "@/lib/types";
import type { BuildingType } from "@/lib/types";

interface ReadonlyAnnotation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  buildingType: string;
  aiScore: string | null;
}

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string };
  }
}

function scoreToColor(score: number | null): string {
  if (score == null) return "#ff6b35";
  const hue = Math.round((Math.max(0, Math.min(100, score)) / 100) * 120);
  return `hsl(${hue}, 85%, 55%)`;
}

function buildMarkerHtml(a: ReadonlyAnnotation): string {
  const meta = getBuildingTypeMeta(a.buildingType as BuildingType);
  let score: number | null = null;
  try {
    if (a.aiScore) score = JSON.parse(a.aiScore).overallScore;
  } catch {}
  const color = score != null ? scoreToColor(score) : meta.color;
  return `
    <div style="transform-origin: bottom center; cursor: pointer;">
      <svg width="36" height="46" viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <path d="M22 4 C12 4 6 12 6 22 C6 33 22 52 22 52 C22 52 38 33 38 22 C38 12 32 4 22 4 Z"
          fill="${color}" stroke="white" stroke-width="2" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))"/>
        <circle cx="22" cy="22" r="8" fill="white"/>
        <text x="22" y="27" text-anchor="middle" font-size="12" fill="${color}" font-weight="700">${meta.emoji}</text>
      </svg>
    </div>
  `;
}

export function ReadonlyMap({
  annotations,
  onSelect,
  selectedId,
}: {
  annotations: ReadonlyAnnotation[];
  onSelect?: (a: ReadonlyAnnotation) => void;
  selectedId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 把最新的 onSelect 同步到 ref，让 useEffect 的依赖只包括"真正影响地图重建的内容"
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // 把 annotations 的稳定签名（id+coords）抽出来作为 effect deps —— 避免父组件 re-render 时
  // 因为数组引用变了就重建地图。只有当真正的标点 id/坐标变化时才重新初始化。
  const stableKey = useMemo(
    () =>
      annotations
        .map((a) => `${a.id}:${a.lat.toFixed(5)},${a.lng.toFixed(5)}`)
        .join("|"),
    [annotations]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (annotations.length === 0) {
      setLoading(false);
      return;
    }

    const key = process.env.NEXT_PUBLIC_AMAP_KEY;
    const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE;
    if (!key) {
      setError("缺少高德地图 Key 配置");
      setLoading(false);
      return;
    }
    if (securityCode && typeof window !== "undefined") {
      window._AMapSecurityConfig = { securityJsCode: securityCode };
    }

    let mounted = true;
    let mapInstance: any = null;
    setLoading(true);
    setError(null);

    AMapLoader.load({
      key,
      version: "2.0",
      plugins: ["AMap.Scale"],
    })
      .then((AMap) => {
        if (!mounted || !container) return;

        // 计算几何中心作为初始中心点
        const lngs = annotations.map((a) => a.lng);
        const lats = annotations.map((a) => a.lat);
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;

        mapInstance = new AMap.Map(container, {
          viewMode: "2D",
          zoom: 17,
          center: [centerLng, centerLat],
          mapStyle: AMAP_LIGHT_STYLE,
          dragEnable: true,
          zoomEnable: true,
          doubleClickZoom: true,
        });

        // 地图加载完成后再添加 markers + fitView，否则 marker 可能定位错乱
        mapInstance.on("complete", () => {
          if (!mounted) return;
          setLoading(false);

          const addedMarkers: any[] = [];
          annotations.forEach((a) => {
            const marker = new AMap.Marker({
              position: [a.lng, a.lat],
              content: buildMarkerHtml(a),
              anchor: "bottom-center",
              extData: { id: a.id },
            });
            marker.on("click", () => onSelectRef.current?.(a));
            mapInstance.add(marker);
            addedMarkers.push(marker);
          });

          if (addedMarkers.length > 1) {
            try {
              mapInstance.setFitView(addedMarkers, false, [60, 60, 60, 60]);
            } catch (e) {
              console.warn("[ReadonlyMap] setFitView 失败:", e);
            }
          }
        });

        mapRef.current = mapInstance;
      })
      .catch((err) => {
        console.error("[ReadonlyMap] AMap 加载失败:", err);
        if (mounted) {
          setError("地图加载失败，请刷新重试");
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      try {
        mapInstance?.destroy?.();
      } catch {
        // 忽略 destroy 期间可能的错误
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey]);

  // 选中标点变化 → 平滑移到该位置
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const target = annotations.find((a) => a.id === selectedId);
    if (target) {
      try {
        mapRef.current.setCenter([target.lng, target.lat], false, 400);
      } catch {}
    }
  }, [selectedId, annotations]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {loading && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-zinc-950/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-zinc-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <div className="text-xs">正在加载地图…</div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 grid place-items-center bg-zinc-950 text-zinc-400">
          <div className="text-sm">{error}</div>
        </div>
      )}
    </div>
  );
}
