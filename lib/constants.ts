import type { MapView } from "@/lib/types";

export const SDUFE_CAMPUSES = {
  shengjing: {
    name: "圣井校区（主校区）",
    center: [117.3725, 36.6595] as [number, number],
    zoom: 16.5,
  },
  yanshan: {
    name: "燕山校区",
    center: [117.069, 36.643] as [number, number],
    zoom: 16,
  },
} as const;

export const DEFAULT_MAP_VIEW: MapView = {
  center: SDUFE_CAMPUSES.shengjing.center,
  zoom: SDUFE_CAMPUSES.shengjing.zoom,
};

export const AMAP_DARK_STYLE = "amap://styles/dark";
export const AMAP_LIGHT_STYLE = "amap://styles/normal";
