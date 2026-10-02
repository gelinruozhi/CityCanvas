import type { BuildingType } from "@/lib/types";

/**
 * 圣井校区核心建筑的静态坐标（高德未收录为独立 POI 的主体建筑）。
 * 坐标由卫星影像人工校准，误差约 ±40m；动态 POI 与此清单按名称合并。
 */
export interface CoreBuilding {
  name: string;
  buildingType: BuildingType;
  lng: number;
  lat: number;
  /** footprint 尺寸（米）：[东西宽, 南北深] */
  size: [number, number];
  floorCount: number;
}

export const SUFE_CORE_BUILDINGS: CoreBuilding[] = [
  { name: "图书馆", buildingType: "library", lng: 117.3737, lat: 36.6799, size: [52, 26], floorCount: 5 },
  { name: "第一教学楼", buildingType: "teaching", lng: 117.3715, lat: 36.6805, size: [46, 15], floorCount: 5 },
  { name: "第二教学楼", buildingType: "teaching", lng: 117.3743, lat: 36.6805, size: [46, 15], floorCount: 5 },
  { name: "第三教学楼", buildingType: "teaching", lng: 117.3718, lat: 36.6798, size: [46, 15], floorCount: 5 },
  { name: "第四教学楼", buildingType: "teaching", lng: 117.3732, lat: 36.6782, size: [46, 15], floorCount: 5 },
  { name: "第五教学楼", buildingType: "teaching", lng: 117.3748, lat: 36.6774, size: [46, 15], floorCount: 5 },
  { name: "第九教学楼", buildingType: "teaching", lng: 117.3744, lat: 36.6787, size: [46, 15], floorCount: 5 },
  { name: "第三学生公寓", buildingType: "dorm", lng: 117.3754, lat: 36.68, size: [34, 13], floorCount: 6 },
  { name: "第四学生公寓", buildingType: "dorm", lng: 117.3734, lat: 36.6779, size: [34, 13], floorCount: 6 },
  { name: "篮球场", buildingType: "court", lng: 117.3768, lat: 36.6777, size: [30, 18], floorCount: 0 },
  { name: "一卡通中心", buildingType: "store", lng: 117.375, lat: 36.6775, size: [20, 12], floorCount: 2 },
  { name: "校史馆", buildingType: "culture", lng: 117.377, lat: 36.6771, size: [28, 18], floorCount: 2 },
];
