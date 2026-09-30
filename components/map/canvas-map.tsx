"use client";

import { useEffect, useRef, useState } from "react";
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

// 待创建位置的脉冲定位点：点击地图后、提交前，在原地持续呼吸闪烁
const PENDING_MARKER_CONTENT = `
  <style>
    @keyframes cc-pending-ring {
      0% { transform: scale(0.5); opacity: 0.9; }
      100% { transform: scale(2.8); opacity: 0; }
    }
  </style>
  <div style="position: relative; width: 0; height: 0;">
    <div style="position: absolute; left: -11px; top: -11px; width: 22px; height: 22px;
      border-radius: 50%; background: rgba(251,146,60,0.45);
      animation: cc-pending-ring 1.5s ease-out infinite;"></div>
    <div style="position: absolute; left: -8px; top: -8px; width: 16px; height: 16px;
      border-radius: 50%; background: #fb923c; border: 2.5px solid #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.55);"></div>
  </div>
`;

// 选区圆圈通用参数：视觉化"这个标点影响的区域"（AI 参考 250m 内 POI，圈取 150m 直观够用）
function circleOptions(center: [number, number]) {
  return {
    center,
    radius: 150,
    strokeColor: "#fb923c",
    strokeOpacity: 0.75,
    strokeWeight: 1.5,
    strokeStyle: "dashed",
    strokeDasharray: [6, 4],
    fillColor: "#fb923c",
    fillOpacity: 0.06,
    bubble: true,
    zIndex: 60,
  };
}

export function CanvasMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapInstance | null>(null);
  const aMapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, AMapMarker>>(new Map());
  const satelliteLayersRef = useRef<{ sat: any; road: any } | null>(null);
  const pendingMarkerRef = useRef<AMapMarker | null>(null);
  const pendingCircleRef = useRef<any>(null);
  const analysisCircleRef = useRef<any>(null);
  // 记录每个 marker 上次渲染的 content/位置，避免输入时全量重建 marker DOM
  const markerMetaRef = useRef<Map<string, { content: string; pos: string }>>(
    new Map()
  );
  const [mapReady, setMapReady] = useState(false);

  const annotations = useAnnotationStore((s) => s.annotations);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const isDarkMap = useAnnotationStore((s) => s.isDarkMap);
  const isSatellite = useAnnotationStore((s) => s.isSatellite);
  const pendingPosition = useAnnotationStore((s) => s.pendingPosition);
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
            // zoom 17 能看清单体建筑与道路，16 的全校缩略图太远没有代入感
            map.setZoomAndCenter(17, center);
            setCampusCenter({ lng: center[0], lat: center[1] });
          } else {
            // 兜底再搜一次
            placeSearch.search("山东财经大学", (st: string, r: any) => {
              if (st === "complete" && r?.poiList?.pois?.length > 0) {
                const poi = r.poiList.pois[0];
                const lng = poi.location.lng;
                const lat = poi.location.lat;
                map.setZoomAndCenter(17, [lng, lat]);
                setCampusCenter({ lng, lat });
              }
            });
          }
        });

        map.on("click", (e: any) => {
          const lng = e.lnglat.getLng();
          const lat = e.lnglat.getLat();
          openCreateDialog(lng, lat);
          // 点击创作时拉近到能看清脚下建筑细节，同时不丢失方位感
          if (map.getZoom() < 17.5) {
            map.setZoomAndCenter(17.5, [lng, lat], false, 600);
          }
          // 创作面板出现在右侧（宽屏），panBy 负值把视野中的点击位置
          // 移到屏幕左半区可见（实测 panBy 正值内容右移）；窄屏面板全宽居中，不偏移
          if (window.innerWidth >= 640) {
            window.setTimeout(() => map.panBy(-260, 0), 650);
          }
        });

        mapRef.current = map;

        // 卫星影像 + 路网叠加图层（按 isSatellite 状态挂载/卸载）
        satelliteLayersRef.current = {
          sat: new AMap.TileLayer.Satellite({ zIndex: 5 }),
          road: new AMap.TileLayer.RoadNet({ zIndex: 6 }),
        };

        setMapReady(true);
      })
      .catch((err) => {
        console.error("高德地图加载失败：", err);
      });

    return () => {
      mounted = false;
      mapRef.current?.destroy?.();
      mapRef.current = null;
      markersRef.current.clear();
      markerMetaRef.current.clear();
    };
  }, [openCreateDialog, setCampusCenter]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setMapStyle(isDarkMap ? AMAP_DARK_STYLE : AMAP_LIGHT_STYLE);
  }, [isDarkMap]);

  // 卫星图层挂载/卸载（依赖 mapReady：图层实例在地图初始化后创建）
  useEffect(() => {
    const map = mapRef.current;
    const layers = satelliteLayersRef.current;
    if (!map || !layers || !mapReady) return;
    if (isSatellite) {
      map.add([layers.sat, layers.road]);
    } else {
      map.remove([layers.sat, layers.road]);
    }
  }, [isSatellite, mapReady]);

  // 待创建位置的可视化：脉冲定位点 + 150m 选区圆圈（对话框打开期间持续显示）
  useEffect(() => {
    const AMap = aMapRef.current;
    const map = mapRef.current;
    if (!AMap || !map || !mapReady) return;

    if (!pendingPosition) {
      if (pendingMarkerRef.current) {
        map.remove(pendingMarkerRef.current);
        pendingMarkerRef.current = null;
      }
      if (pendingCircleRef.current) {
        map.remove(pendingCircleRef.current);
        pendingCircleRef.current = null;
      }
      return;
    }

    const pos: [number, number] = [pendingPosition.lng, pendingPosition.lat];
    if (!pendingMarkerRef.current) {
      pendingMarkerRef.current = new AMap.Marker({
        position: pos,
        content: PENDING_MARKER_CONTENT,
        anchor: "center",
        zIndex: 320,
      });
      map.add(pendingMarkerRef.current);
    } else {
      pendingMarkerRef.current.setPosition(pos);
    }

    if (!pendingCircleRef.current) {
      pendingCircleRef.current = new AMap.Circle(circleOptions(pos));
      map.add(pendingCircleRef.current);
    } else {
      pendingCircleRef.current.setCenter(pos);
    }
  }, [pendingPosition, mapReady]);

  // 已选标点的分析范围圈：让"选中"变成选中一片区域而非一个点
  useEffect(() => {
    const AMap = aMapRef.current;
    const map = mapRef.current;
    if (!AMap || !map || !mapReady) return;

    const target = selectedId
      ? annotations.find((a) => a.id === selectedId)
      : null;

    if (target) {
      if (!analysisCircleRef.current) {
        analysisCircleRef.current = new AMap.Circle(
          circleOptions([target.lng, target.lat])
        );
        map.add(analysisCircleRef.current);
      } else {
        analysisCircleRef.current.setCenter([target.lng, target.lat]);
      }
      analysisCircleRef.current.show?.();
    } else if (analysisCircleRef.current) {
      analysisCircleRef.current.hide?.();
    }
  }, [selectedId, annotations, mapReady]);

  useEffect(() => {
    const AMap = aMapRef.current;
    const map = mapRef.current;
    if (!AMap || !map || !mapReady) return;

    const existing = markersRef.current;
    const seen = new Set<string>();

    annotations.forEach((annotation) => {
      seen.add(annotation.id);
      const isSelected = annotation.id === selectedId;
      const content = buildMarkerContent(annotation, isSelected);
      const pos = `${annotation.lng},${annotation.lat}`;

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
        markerMetaRef.current.set(annotation.id, { content, pos });
      } else {
        const meta = markerMetaRef.current.get(annotation.id);
        if (!meta || meta.content !== content || meta.pos !== pos) {
          marker.setContent(content);
          marker.setPosition([annotation.lng, annotation.lat]);
          marker.setzIndex?.(isSelected ? 200 : 100);
          markerMetaRef.current.set(annotation.id, { content, pos });
        }
      }
    });

    existing.forEach((marker, id) => {
      if (!seen.has(id)) {
        map.remove(marker);
        existing.delete(id);
        markerMetaRef.current.delete(id);
      }
    });
  }, [annotations, selectedId, selectAnnotation, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const target = annotations.find((a) => a.id === selectedId);
    if (target) {
      // 选中标点时拉近，让用户清楚看到标点与周边建筑的关系
      const zoom = Math.max(mapRef.current.getZoom?.() ?? 0, 17.5);
      mapRef.current.setZoomAndCenter(zoom, [target.lng, target.lat], false, 500);
    }
  }, [selectedId, annotations]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
