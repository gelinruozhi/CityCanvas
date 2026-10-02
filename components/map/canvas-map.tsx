"use client";

import { useEffect, useRef, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import { DEFAULT_MAP_VIEW, AMAP_DARK_STYLE, AMAP_LIGHT_STYLE } from "@/lib/constants";
import { getBuildingTypeMeta } from "@/lib/types";
import type { Annotation, ShapeBounds } from "@/lib/types";
import { fetchCampusBuildings } from "@/lib/amap/campus-buildings";

type AMapInstance = any;
type AMapOverlay = any;

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
  // 室内标注：楼层徽标
  const floorBadge = annotation.floor
    ? `<div style="margin-top:-4px;display:flex;justify-content:center;">
         <span style="background:${color};color:#fff;font-size:10px;font-weight:700;
           padding:1px 6px;border-radius:999px;border:1px solid rgba(255,255,255,.7);white-space:nowrap;">
           ${annotation.buildingName ?? ""}·${annotation.floor}
         </span>
       </div>`
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
      ${floorBadge}
    </div>
  `;
}

// 待创建点位（point 工具）的脉冲定位点
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

// 选区/预览圆圈通用样式：60m 半径贴合"改造一处"的尺度，不再覆盖半个校园
function circleOptions(center: [number, number], radius = 60) {
  return {
    center,
    radius,
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

// 用户标点（circle/rect）的配色：按 AI 分或类型着色
function annotationShapeOptions(color: string, selected: boolean) {
  return {
    strokeColor: color,
    strokeWeight: selected ? 3.5 : 2,
    strokeOpacity: 0.95,
    fillColor: color,
    fillOpacity: selected ? 0.32 : 0.16,
    bubble: true,
    zIndex: selected ? 180 : 120,
  };
}

export function CanvasMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapInstance | null>(null);
  const aMapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, AMapOverlay>>(new Map());
  const satelliteLayersRef = useRef<{ sat: any; road: any } | null>(null);
  const pendingOverlaysRef = useRef<AMapOverlay[]>([]);
  const analysisCircleRef = useRef<any>(null);
  const drawStartRef = useRef<{ lng: number; lat: number } | null>(null);
  const drawPreviewRef = useRef<any>(null);
  const buildingPolysRef = useRef<Map<string, AMapOverlay>>(new Map());
  const buildingsRef = useRef<any[]>([]);
  // 记录每个标注覆盖物上次渲染的样式签名，避免输入时全量重建 DOM
  const overlayMetaRef = useRef<Map<string, string>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  const annotations = useAnnotationStore((s) => s.annotations);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const isDarkMap = useAnnotationStore((s) => s.isDarkMap);
  const isSatellite = useAnnotationStore((s) => s.isSatellite);
  const pendingPosition = useAnnotationStore((s) => s.pendingPosition);
  const drawTool = useAnnotationStore((s) => s.drawTool);
  const openCreateDialog = useAnnotationStore((s) => s.openCreateDialog);
  const selectAnnotation = useAnnotationStore((s) => s.selectAnnotation);
  const setCampusCenter = useAnnotationStore((s) => s.setCampusCenter);
  const selectedBuilding = useAnnotationStore((s) => s.selectedBuilding);
  const selectBuilding = useAnnotationStore((s) => s.selectBuilding);
  const indoorFloor = useAnnotationStore((s) => s.indoorFloor);

  // 供地图事件回调读取的最新值（回调只绑定一次）
  const drawToolRef = useRef(drawTool);
  drawToolRef.current = drawTool;
  const selectedBuildingRef = useRef(selectedBuilding);
  selectedBuildingRef.current = selectedBuilding;

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
            loadBuildings(AMap, map, { lng: center[0], lat: center[1] });
          } else {
            // 兜底再搜一次
            placeSearch.search("山东财经大学", (st: string, r: any) => {
              if (st === "complete" && r?.poiList?.pois?.length > 0) {
                const poi = r.poiList.pois[0];
                const lng = poi.location.lng;
                const lat = poi.location.lat;
                map.setZoomAndCenter(17, [lng, lat]);
                setCampusCenter({ lng, lat });
                loadBuildings(AMap, map, { lng, lat });
              }
            });
          }
        });

        // 两次点击间的米数（自实现绘制用）
        const metersBetween = (
          a: { lng: number; lat: number },
          b: { lng: number; lat: number }
        ) => {
          const dLat = (b.lat - a.lat) * 111320;
          const dLng =
            (b.lng - a.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
          return Math.hypot(dLat, dLng);
        };

        const clearDrawPreview = () => {
          if (drawPreviewRef.current) {
            map.remove(drawPreviewRef.current);
            drawPreviewRef.current = null;
          }
        };

        map.on("click", (e: any) => {
          const lng = e.lnglat.getLng();
          const lat = e.lnglat.getLat();
          const tool = drawToolRef.current;

          // 圆形/矩形：两次点击 —— 第一次定圆心/起点，第二次完成
          if (tool === "circle" || tool === "rect") {
            if (!drawStartRef.current) {
              drawStartRef.current = { lng, lat };
              return;
            }
            const start = drawStartRef.current;
            drawStartRef.current = null;
            clearDrawPreview();
            if (tool === "circle") {
              const radius = Math.max(
                10,
                Math.round(metersBetween(start, { lng, lat }))
              );
              openCreateDialog(
                (start.lng + lng) / 2,
                (start.lat + lat) / 2,
                { shape: "circle", radius }
              );
            } else {
              const shapeBounds: ShapeBounds = {
                sw: [Math.min(start.lng, lng), Math.min(start.lat, lat)],
                ne: [Math.max(start.lng, lng), Math.max(start.lat, lat)],
              };
              openCreateDialog(
                (start.lng + lng) / 2,
                (start.lat + lat) / 2,
                { shape: "rect", bounds: shapeBounds }
              );
            }
            return;
          }

          // 点位工具：优先命中附近建筑（点击点 18m 内最近的建筑足迹视为选中建筑）
          let nearest: {
            id: string;
            dist: number;
          } | null = null;
          for (const b of buildingsRef.current) {
            const d = metersBetween(clickPoint(lng, lat), b.center);
            if (d < 18 && (!nearest || d < nearest.dist)) {
              nearest = { id: b.id, dist: d };
            }
          }
          if (nearest) {
            const b = buildingsRef.current.find((x) => x.id === nearest!.id);
            if (b) {
              selectBuilding(b);
              return;
            }
          }

          openCreateDialog(lng, lat);
          // 点击创作时拉近到能看清脚下建筑细节，同时不丢失方位感
          if (map.getZoom() < 17.5) {
            map.setZoomAndCenter(17.5, [lng, lat], false, 600);
          }
          // 创作面板出现在右侧（宽屏），panBy 负值把视野中的点击位置
          // 移到屏幕左半区可见；窄屏面板全宽居中，不做偏移
          if (window.innerWidth >= 640) {
            window.setTimeout(() => map.panBy(-260, 0), 650);
          }
        });

        function clickPoint(lng: number, lat: number) {
          return { lng, lat };
        }

        // 圆/矩形绘制时：mousemove 实时预览
        map.on("mousemove", (e: any) => {
          const tool = drawToolRef.current;
          const start = drawStartRef.current;
          if ((tool !== "circle" && tool !== "rect") || !start) return;
          const lng = e.lnglat.getLng();
          const lat = e.lnglat.getLat();
          clearDrawPreview();
          if (tool === "circle") {
            const radius = Math.max(5, metersBetween(start, { lng, lat }));
            drawPreviewRef.current = new AMap.Circle({
              center: [start.lng, start.lat],
              radius,
              strokeColor: "#fb923c",
              strokeOpacity: 0.9,
              strokeWeight: 2,
              strokeStyle: "dashed",
              fillColor: "#fb923c",
              fillOpacity: 0.12,
              bubble: true,
              zIndex: 90,
            });
          } else {
            drawPreviewRef.current = new AMap.Rectangle({
              bounds: [
                [Math.min(start.lng, lng), Math.min(start.lat, lat)],
                [Math.max(start.lng, lng), Math.max(start.lat, lat)],
              ],
              strokeColor: "#fb923c",
              strokeOpacity: 0.9,
              strokeWeight: 2,
              strokeStyle: "dashed",
              fillColor: "#fb923c",
              fillOpacity: 0.12,
              bubble: true,
              zIndex: 90,
            });
          }
          map.add(drawPreviewRef.current);
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
      buildingPolysRef.current.clear();
      buildingsRef.current = [];
      overlayMetaRef.current.clear();
      pendingOverlaysRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCreateDialog, setCampusCenter]);

  /** 拉取校园建筑并渲染可点击足迹 */
  function loadBuildings(AMap: any, map: any, center: { lng: number; lat: number }) {
    fetchCampusBuildings(AMap, center).then((buildings) => {
      const liveMap = mapRef.current;
      if (!liveMap || !buildings.length) return;
      buildingsRef.current = buildings;
      for (const b of buildings) {
        const meta = getBuildingTypeMeta(b.buildingType);
        const polygon = new AMap.Polygon({
          path: [
            [b.footprint.sw[0], b.footprint.sw[1]],
            [b.footprint.ne[0], b.footprint.sw[1]],
            [b.footprint.ne[0], b.footprint.ne[1]],
            [b.footprint.sw[0], b.footprint.ne[1]],
          ],
          strokeColor: "#ffffff",
          strokeOpacity: 0.18,
          strokeWeight: 1,
          fillColor: meta.color,
          fillOpacity: 0.08,
          cursor: "pointer",
          zIndex: 40,
        });
        polygon.on("click", () => selectBuilding(b));
        polygon.on("mouseover", () =>
          polygon.setOptions({ fillOpacity: 0.2, strokeOpacity: 0.5 })
        );
        polygon.on("mouseout", () => {
          const active = selectedBuildingRef.current?.id === b.id;
          if (!active) polygon.setOptions({ fillOpacity: 0.08, strokeOpacity: 0.18 });
        });
        liveMap.add(polygon);
        buildingPolysRef.current.set(b.id, polygon);
      }
    });
  }

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

  // 绘图工具切换：进入 circle/rect 时十字光标；离开时清掉起点与预览
  useEffect(() => {
    if (!mapReady) return;
    if (drawTool === "circle" || drawTool === "rect") {
      mapRef.current?.setDefaultCursor?.("crosshair");
    } else {
      drawStartRef.current = null;
      if (drawPreviewRef.current) {
        mapRef.current?.remove?.(drawPreviewRef.current);
        drawPreviewRef.current = null;
      }
      mapRef.current?.setDefaultCursor?.("default");
    }
  }, [drawTool, mapReady]);

  // Esc 取消进行中的绘制（清起点与预览）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      drawStartRef.current = null;
      if (drawPreviewRef.current) {
        mapRef.current?.remove?.(drawPreviewRef.current);
        drawPreviewRef.current = null;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 标注渲染：point → Marker；circle → Circle；rect → Rectangle
  useEffect(() => {
    const AMap = aMapRef.current;
    const map = mapRef.current;
    if (!AMap || !map || !mapReady) return;

    const existing = markersRef.current;
    const seen = new Set<string>();

    annotations.forEach((annotation) => {
      seen.add(annotation.id);
      const isSelected = annotation.id === selectedId;
      const meta = getBuildingTypeMeta(annotation.buildingType);
      const color = annotation.aiScore
        ? scoreToColor(annotation.aiScore.overallScore)
        : meta.color;

      let overlay = existing.get(annotation.id);
      if (!overlay) {
        if (annotation.shape === "circle") {
          overlay = new AMap.Circle({
            center: [annotation.lng, annotation.lat],
            radius: annotation.radius ?? 100,
            ...annotationShapeOptions(color, isSelected),
          });
        } else if (annotation.shape === "rect" && annotation.bounds) {
          overlay = new AMap.Rectangle({
            bounds: [annotation.bounds.sw, annotation.bounds.ne],
            ...annotationShapeOptions(color, isSelected),
          });
        } else {
          const content = buildMarkerContent(annotation, isSelected);
          overlay = new AMap.Marker({
            position: [annotation.lng, annotation.lat],
            content,
            anchor: "bottom-center",
            offset: new AMap.Pixel(0, 0),
            zIndex: isSelected ? 200 : 100,
            extData: { id: annotation.id },
          });
        }
        overlay.on("click", () => selectAnnotation(annotation.id));
        map.add(overlay);
        existing.set(annotation.id, overlay);
        overlayMetaRef.current.set(
          annotation.id,
          `${color}|${isSelected}|${annotation.shape}`
        );
      } else {
        const sig = `${color}|${isSelected}|${annotation.shape}`;
        if (overlayMetaRef.current.get(annotation.id) !== sig) {
          if (annotation.shape === "point") {
            overlay.setContent(buildMarkerContent(annotation, isSelected));
            overlay.setzIndex?.(isSelected ? 200 : 100);
          } else {
            overlay.setOptions(annotationShapeOptions(color, isSelected));
          }
          overlayMetaRef.current.set(annotation.id, sig);
        }
      }
    });

    existing.forEach((overlay, id) => {
      if (!seen.has(id)) {
        map.remove(overlay);
        existing.delete(id);
        overlayMetaRef.current.delete(id);
      }
    });
  }, [annotations, selectedId, selectAnnotation, mapReady]);

  // 待创建标注预览：point 脉冲点 + 150m 圈；circle/rect 虚线预览
  useEffect(() => {
    const AMap = aMapRef.current;
    const map = mapRef.current;
    if (!AMap || !map || !mapReady) return;

    pendingOverlaysRef.current.forEach((o) => map.remove(o));
    pendingOverlaysRef.current = [];

    if (!pendingPosition) return;

    const pos: [number, number] = [pendingPosition.lng, pendingPosition.lat];
    const previews: AMapOverlay[] = [];

    if (pendingPosition.shape === "circle" && pendingPosition.radius) {
      previews.push(new AMap.Circle(circleOptions(pos, pendingPosition.radius)));
    } else if (pendingPosition.shape === "rect" && pendingPosition.bounds) {
      previews.push(
        new AMap.Rectangle({
          bounds: [pendingPosition.bounds.sw, pendingPosition.bounds.ne],
          strokeColor: "#fb923c",
          strokeOpacity: 0.75,
          strokeWeight: 1.5,
          strokeStyle: "dashed",
          fillColor: "#fb923c",
          fillOpacity: 0.06,
          bubble: true,
          zIndex: 60,
        })
      );
    } else {
      previews.push(
        new AMap.Marker({
          position: pos,
          content: PENDING_MARKER_CONTENT,
          anchor: "center",
          zIndex: 320,
        })
      );
      previews.push(new AMap.Circle(circleOptions(pos)));
    }

    previews.forEach((o) => map.add(o));
    pendingOverlaysRef.current = previews;
  }, [pendingPosition, mapReady]);

  // 选中 point 标注的分析范围圈（circle/rect 自身即区域，无需叠加）
  useEffect(() => {
    const AMap = aMapRef.current;
    const map = mapRef.current;
    if (!AMap || !map || !mapReady) return;

    const target = selectedId
      ? annotations.find((a) => a.id === selectedId)
      : null;

    if (target && target.shape === "point") {
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

  // 选中标点/建筑时的视野：point 拉近；建筑选中聚焦；室内模式贴地细看
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const target = selectedId
      ? annotations.find((a) => a.id === selectedId)
      : null;

    if (indoorFloor && selectedBuilding) {
      map.setZoomAndCenter(
        19.5,
        [selectedBuilding.center.lng, selectedBuilding.center.lat],
        false,
        700
      );
    } else if (selectedBuilding) {
      map.setZoomAndCenter(
        18,
        [selectedBuilding.center.lng, selectedBuilding.center.lat],
        false,
        600
      );
    } else if (target) {
      const zoom = Math.max(map.getZoom?.() ?? 0, 17.5);
      map.setZoomAndCenter(zoom, [target.lng, target.lat], false, 500);
    }
  }, [selectedId, annotations, selectedBuilding, indoorFloor, mapReady]);

  // 建筑选中高亮/恢复
  useEffect(() => {
    for (const [id, poly] of buildingPolysRef.current.entries()) {
      const active = selectedBuilding?.id === id;
      poly.setOptions(
        active
          ? { fillOpacity: 0.28, strokeOpacity: 0.9, strokeColor: "#fb923c", strokeWeight: 2 }
          : { fillOpacity: 0.08, strokeOpacity: 0.18, strokeColor: "#ffffff", strokeWeight: 1 }
      );
    }
  }, [selectedBuilding]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
