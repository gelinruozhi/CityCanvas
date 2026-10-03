"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Building2, X, DoorOpen, Layers } from "lucide-react";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import { getBuildingTypeMeta } from "@/lib/types";
import { buildingFloors } from "@/lib/campus/map-data";
import { Button } from "@/components/ui/button";

/**
 * 建筑面板：点击地图上的建筑足迹后出现。
 * 列出楼层体系，选层进入室内编辑模式；室外场地（无楼层）仅提示。
 */
export function BuildingPanel() {
  const selectedBuilding = useAnnotationStore((s) => s.selectedBuilding);
  const selectBuilding = useAnnotationStore((s) => s.selectBuilding);
  const indoorFloor = useAnnotationStore((s) => s.indoorFloor);
  const setIndoorFloor = useAnnotationStore((s) => s.setIndoorFloor);
  const pendingPosition = useAnnotationStore((s) => s.pendingPosition);
  const openCreateDialog = useAnnotationStore((s) => s.openCreateDialog);

  const building = selectedBuilding;

  return (
    <AnimatePresence>
      {building && !pendingPosition && (
        <motion.aside
          key={building.id}
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="pointer-events-auto absolute right-4 top-20 z-20 w-[360px] overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/85 shadow-2xl shadow-black/40 backdrop-blur-2xl"
        >
          {/* 顶部品牌渐变条 */}
          <div className="h-0.5 w-full bg-gradient-to-r from-orange-500/80 via-rose-500/50 to-transparent" />
          <header className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/15 text-orange-300">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-zinc-500">
                  {indoorFloor ? "室内编辑模式" : "建筑详情"}
                </div>
                <div className="text-sm font-semibold text-white">
                  {building.name}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                selectBuilding(null);
                setIndoorFloor(null);
              }}
              className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="space-y-4 px-5 py-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="rounded-md bg-white/5 px-2 py-1">
                {getBuildingTypeMeta(building.buildingType).emoji}{" "}
                {getBuildingTypeMeta(building.buildingType).label}
              </span>
              {indoorFloor && (
                <span className="rounded-md bg-orange-500/15 px-2 py-1 text-orange-300">
                  当前楼层 {indoorFloor}
                </span>
              )}
            </div>

            {building.floorCount > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Layers className="h-3.5 w-3.5" />
                  楼层体系（共 {building.floorCount} 层）
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {buildingFloors(building.floorCount).map((f) => (
                    <button
                      key={f}
                      onClick={() => setIndoorFloor(indoorFloor === f ? null : f)}
                      className={`rounded-lg border py-1.5 text-xs font-medium transition ${
                        indoorFloor === f
                          ? "border-orange-500/60 bg-orange-500/15 text-orange-200"
                          : "border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08]"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  选层后在该楼层添加的创意会带上建筑与楼层标签，AI 将结合室内场景评估。
                </p>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-white/10 px-3 py-3 text-xs leading-relaxed text-zinc-500">
                这是室外场地，没有楼层体系 —— 直接在地图上圈选它的一部分进行改造。
              </p>
            )}

            <div className="flex gap-2">
              {indoorFloor ? (
                <Button
                  className="flex-1"
                  onClick={() =>
                    openCreateDialog(building.x, building.y, { shape: "point" })
                  }
                >
                  在 {indoorFloor} 添加创意
                </Button>
              ) : building.floorCount > 0 ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    openCreateDialog(building.x, building.y, { shape: "point" })
                  }
                >
                  在楼内添加创意（先选层）
                </Button>
              ) : null}
              {indoorFloor && (
                <Button
                  variant="outline"
                  onClick={() => setIndoorFloor(null)}
                >
                  <DoorOpen className="h-4 w-4" />
                  返回室外
                </Button>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
