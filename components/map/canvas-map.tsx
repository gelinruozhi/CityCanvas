"use client";

import { useEffect, useRef } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import { DEFAULT_MAP_VIEW, AMAP_DARK_STYLE, AMAP_LIGHT_STYLE } from "@/lib/constants";
import { getBuildingTypeMeta } from "@/lib/types";
import type { Annotation } from "@/lib/types";

type AMapInstance = any;
type AMapMarker = any;

function scoreToColor(score: number | null | undefined): string {
  if (score == null) return "#ff6b35";
  const clamped = Math.max(0, Math.min(100, score));
  const hue = Math.round((clamped / 100) * 120);
  return `hsl(${hue}, 85%, 55%)`;
}

function buildMarkerContent(annotation: Annotation, isSelected: boolean): string {
  const meta = getBuildingTypeMeta(annotation.buildingType);
  const color = annotation.aiScore
    ? scoreToColor(annotation.aiScore.overallScore)
    : meta.color;
  const scale = isSelected ? 1.15 : 1;
  const ring = isSelected
    ? `<circle cx="22" cy="22" r="20" fill="none" stroke="${color}" stroke-opacity="0.35" stroke-width="3"/>`
    : "";

  return `
    <div style="transform: scale(${scale}); transform-origin: bottom center; transition: transform 0.2s;">
      <svg width="44" height="56" viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        ${ring}
        <path d="M22 4 C12 4 6 12 6 22 C6 33 22 52 22 52 C22 52 38 33 38 22 C38 12 32 4 22 4 Z"
          fill="${color}" stroke="white" stroke-width="2" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))"/>
        <circle cx="22" cy="22" r="8" fill="white"/>
        <text x="22" y="27" text-anchor="middle" font-size="12" fill="${color}" font-weight="700">${meta.emoji}</text>
      </svg>
    </div>
  `;
}

export function CanvasMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapInstance | null>(null);
  const aMapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, AMapMarker>>(new Map());

  const annotations = useAnnotationStore((s) => s.annotations);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const isDarkMap = useAnnotationStore((s) => s.isDarkMap);
  const openCreateDialog = useAnnotationStore((s) => s.openCreateDialog);
  const selectAnnotation = useAnnotationStore((s) => s.selectAnnotation);
  const setCampusCenter = useAnnotationStore((s) => s.setCampusCenter);

  useEffect(() => {
    if (!containerRef.current) return;

    const key = process.env.NEXT_PUBLIC_AMAP_KEY;
    const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE;
    if (!key) {
      console.error("缺少 NEXT_PUBLIC_AMAP_KEY 环境变量");
      return;
    }

    if (securityCode && typeof window !== "undefined") {
      window._AMapSecurityConfig = { securityJsCode: securityCode };
    }

    let mounted = true;

    AMapLoader.load({
      key,
      version: "2.0",
      plugins: ["AMap.Scale", "AMap.ControlBar", "AMap.PlaceSearch"],
    })
      .then((AMap) => {
        if (!mounted || !containerRef.current) return;
        aMapRef.current = AMap;

        const map = new AMap.Map(containerRef.current, {
          viewMode: "3D",
          pitch: 35,
          rotation: -15,
          zoom: DEFAULT_MAP_VIEW.zoom,
          center: DEFAULT_MAP_VIEW.center,
          mapStyle: isDarkMap ? AMAP_DARK_STYLE : AMAP_LIGHT_STYLE,
          showLabel: true,
        });

        map.addControl(new AMap.Scale({ position: "RB" }));

        // 自动搜索并定位到山东财经大学圣井校区
        // ⚠️ 这里同时把搜索结果存为校园中心，供 AI 评估做空间推理（不要依赖硬编码常量）
        const placeSearch = new AMap.PlaceSearch({
          city: "济南",
          citylimit: true,
          pageSize: 1,
        });
        placeSearch.search("山东财经大学(圣井校区)", (status: string, result: any) => {
          if (status === "complete" && result?.poiList?.pois?.length > 0) {
            const poi = result.poiList.pois[0];
            const center: [number, number] = [poi.location.lng, poi.location.lat];
            map.setZoomAndCenter(16, center);
            setCampusCenter({ lng: center[0], lat: center[1] });
          } else {
            // 兜底再搜一次
            placeSearch.search("山东财经大学", (st: string, r: any) => {
              if (st === "complete" && r?.poiList?.pois?.length > 0) {
                const poi = r.poiList.pois[0];
                const lng = poi.location.lng;
                const lat = poi.location.lat;
                map.setZoomAndCenter(16, [lng, lat]);
                setCampusCenter({ lng, lat });
              }
            });
          }
        });

        map.on("click", (e: any) => {
          const lng = e.lnglat.getLng();
          const lat = e.lnglat.getLat();
          openCreateDialog(lng, lat);
        });

        mapRef.current = map;
      })
      .catch((err) => {
        console.error("高德地图加载失败：", err);
      });

    return () => {
      mounted = false;
      mapRef.current?.destroy?.();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [openCreateDialog, setCampusCenter]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setMapStyle(isDarkMap ? AMAP_DARK_STYLE : AMAP_LIGHT_STYLE);
  }, [isDarkMap]);

  useEffect(() => {
    const AMap = aMapRef.current;
    const map = mapRef.current;
    if (!AMap || !map) return;

    const existing = markersRef.current;
    const seen = new Set<string>();

    annotations.forEach((annotation) => {
      seen.add(annotation.id);
      const isSelected = annotation.id === selectedId;
      const content = buildMarkerContent(annotation, isSelected);

      let marker = existing.get(annotation.id);
      if (!marker) {
        marker = new AMap.Marker({
          position: [annotation.lng, annotation.lat],
          content,
          anchor: "bottom-center",
          offset: new AMap.Pixel(0, 0),
          zIndex: isSelected ? 200 : 100,
          extData: { id: annotation.id },
        });
        marker.on("click", () => selectAnnotation(annotation.id));
        map.add(marker);
        existing.set(annotation.id, marker);
      } else {
        marker.setContent(content);
        marker.setPosition([annotation.lng, annotation.lat]);
        marker.setzIndex?.(isSelected ? 200 : 100);
      }
    });

    existing.forEach((marker, id) => {
      if (!seen.has(id)) {
        map.remove(marker);
        existing.delete(id);
      }
    });
  }, [annotations, selectedId, selectAnnotation]);

  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const target = annotations.find((a) => a.id === selectedId);
    if (target) {
      mapRef.current.setCenter([target.lng, target.lat], false, 500);
    }
  }, [selectedId, annotations]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
