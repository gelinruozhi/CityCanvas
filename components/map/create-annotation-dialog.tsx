"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Sparkles,
  Loader2,
  Hammer,
  Wand2,
  Navigation,
  Circle,
  Square,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import { nearbyBuildings } from "@/lib/campus/map-data";
import {
  SHAPE_META,
  BUILDING_TYPES,
  BUILDING_GROUPS,
  type BuildingType,
} from "@/lib/types";
import { isIndoorTypeAllowed, indoorTypeHint } from "@/lib/campus/type-rules";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MAX_LEN = 500;

type Intent = "build" | "renovate";

const INTENTS: Array<{ value: Intent; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: "build", label: "新建", desc: "这里目前没有，希望新增", icon: Wand2 },
  { value: "renovate", label: "改造", desc: "这里已有建筑/设施，希望改造", icon: Hammer },
];

export function CreateAnnotationDialog() {
  const pendingPosition = useAnnotationStore((s) => s.pendingPosition);
  const closeCreateDialog = useAnnotationStore((s) => s.closeCreateDialog);
  const addAnnotation = useAnnotationStore((s) => s.addAnnotation);
  const selectedBuilding = useAnnotationStore((s) => s.selectedBuilding);
  const indoorFloor = useAnnotationStore((s) => s.indoorFloor);

  const [title, setTitle] = useState("");
  const [intent, setIntent] = useState<Intent>("build");
  const [buildingType, setBuildingType] = useState<BuildingType>("other");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 周边楼栋（画布坐标直接计算）
  const nearby = pendingPosition
    ? nearbyBuildings(pendingPosition.x, pendingPosition.y, 3)
    : [];

  useEffect(() => {
    if (!pendingPosition) return;
    setTitle("");
    setIntent("build");
    setBuildingType("other");
    setContent("");
  }, [pendingPosition]);

  const open = Boolean(pendingPosition);

  const handleSubmit = () => {
    if (!pendingPosition) return;
    if (!title.trim()) {
      toast.error("先取个标题吧");
      return;
    }
    if (!content.trim()) {
      toast.error("写两句创意描述？");
      return;
    }
    setSubmitting(true);
    // 把意图作为前缀写进 content，让 AI 知道是"新建"还是"改造"
    const prefixed = `[${intent === "build" ? "新建" : "改造"}] ${content.trim()}`;
    addAnnotation({
      x: pendingPosition.x,
      y: pendingPosition.y,
      title: title.trim(),
      content: prefixed,
      buildingType,
      shape: pendingPosition.shape ?? "point",
      radius: pendingPosition.radius,
      bounds: pendingPosition.bounds,
      // 室内标注：带上建筑与楼层
      buildingName: indoorFloor && selectedBuilding ? selectedBuilding.name : undefined,
      floor: indoorFloor ?? undefined,
    });
    setSubmitting(false);
    toast.success("标点已添加 ✨", {
      description: "可以从右侧面板继续编辑或触发 AI 评估",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeCreateDialog()}>
      <DialogContent
        className="left-auto right-4 top-1/2 max-h-[92vh] max-w-md translate-x-0 -translate-y-1/2 overflow-y-auto sm:right-6"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-orange-400" />
            创作一个新标点
          </DialogTitle>
          <DialogDescription>
            想象这里可以变成什么样子？告诉 AI 你的灵感。
          </DialogDescription>
        </DialogHeader>

        {pendingPosition && (
          <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.08] to-transparent px-3.5 py-2.5">
            {/* 室内模式上下文 */}
            {indoorFloor && selectedBuilding ? (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-orange-400" />
                <span className="text-xs font-medium text-orange-200">
                  {selectedBuilding.name} · {indoorFloor} 室内
                </span>
                <span className="text-[10px] text-zinc-500">
                  创意将挂到该楼层，AI 按室内场景评估
                </span>
              </div>
            ) : (
              <>
                {/* 形状上下文 */}
                {(pendingPosition.shape === "circle" ||
                  pendingPosition.shape === "rect") && (
                  <div className="mb-1.5 flex items-center gap-2 text-xs">
                    {pendingPosition.shape === "circle" ? (
                      <Circle className="h-3.5 w-3.5 text-orange-400" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-orange-400" />
                    )}
                    <span className="font-medium text-orange-200">
                      {SHAPE_META[pendingPosition.shape].label}
                      {pendingPosition.radius
                        ? ` · 半径 ${pendingPosition.radius}m`
                        : ""}
                    </span>
                    <span className="text-zinc-500">
                      覆盖约{" "}
                      {pendingPosition.shape === "circle"
                        ? Math.round(
                            Math.PI * (pendingPosition.radius ?? 0) ** 2
                          ).toLocaleString()
                        : pendingPosition.bounds
                        ? Math.round(
                            Math.abs(
                              (pendingPosition.bounds.ne[0] -
                                pendingPosition.bounds.sw[0]) *
                                (pendingPosition.bounds.ne[1] -
                                  pendingPosition.bounds.sw[1])
                            )
                          ).toLocaleString()
                        : 0}{" "}
                      ㎡
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                  <div className="min-w-0 flex-1">
                    {nearby === null ? (
                      <span className="flex items-center gap-2 text-xs text-zinc-400">
                        正在识别周边建筑
                        <Loader2 className="h-3 w-3 animate-spin text-orange-400" />
                      </span>
                    ) : nearby.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="flex items-center gap-1 font-medium text-orange-200">
                          <Navigation className="h-3 w-3" />
                          {nearby[0].name}
                          <span className="font-normal text-zinc-500">
                            · 约{nearby[0].dist}m
                          </span>
                        </span>
                        {nearby.slice(1, 3).map((p) => (
                          <span key={p.name} className="text-zinc-400">
                            {p.name}
                            <span className="ml-0.5 text-zinc-600">
                              · {p.dist}m
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">
                        校园开阔区域 · AI 会按中性环境评分
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== 意图：新建 / 改造 ===== */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400">这是…</label>
          <div className="grid grid-cols-2 gap-2">
            {INTENTS.map((it) => (
              <motion.button
                key={it.value}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setIntent(it.value)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  intent === it.value
                    ? "border-orange-500/50 bg-orange-500/10 shadow-lg shadow-orange-500/10"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    intent === it.value
                      ? "bg-orange-500/20 text-orange-300"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  <it.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-sm font-medium ${
                      intent === it.value ? "text-orange-200" : "text-zinc-200"
                    }`}
                  >
                    {it.label}
                  </div>
                  <div className="text-[11px] text-zinc-500">{it.desc}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ===== 标题 ===== */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400">
            标题 <span className="text-zinc-600">{title.length}/20</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 20))}
            placeholder="如：星空咖啡馆、24h 自习舱、屋顶花园…"
            autoFocus
          />
        </div>

        {/* ===== 类型选择（按组分隔） ===== */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-zinc-400">
            类型
            <span className="ml-2 text-zinc-600">
              已选：{BUILDING_TYPES.find((t) => t.value === buildingType)?.label}
            </span>
            {indoorFloor && selectedBuilding && (
              <span className="ml-2 text-orange-300/80">
                · 室内仅可选 {selectedBuilding.name} 内合理的类型
              </span>
            )}
          </label>
          {indoorFloor && selectedBuilding && indoorTypeHint(selectedBuilding.buildingType) && (
            <p className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-[11px] leading-relaxed text-orange-200/90">
              {indoorTypeHint(selectedBuilding.buildingType)}
            </p>
          )}

          <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.015] p-3">
            {BUILDING_GROUPS.map((group) => {
              const groupTypes = BUILDING_TYPES.filter((t) => t.group === group.value);
              if (groupTypes.length === 0) return null;
              return (
                <div key={group.value}>
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
                    <span>{group.icon}</span>
                    <span className="font-medium">{group.label}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-zinc-600 normal-case tracking-normal">
                      {group.desc}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                    {groupTypes.map((t) => {
                      const disabled =
                        indoorFloor && selectedBuilding
                          ? !isIndoorTypeAllowed(selectedBuilding.buildingType, t.value)
                          : false;
                      return (
                      <motion.button
                        key={t.value}
                        type="button"
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setBuildingType(t.value)}
                        disabled={disabled}
                        className={`group flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 transition ${
                          disabled
                            ? "cursor-not-allowed border-white/5 bg-white/[0.01] opacity-30"
                            : buildingType === t.value
                            ? "border-orange-500/60 bg-orange-500/15 shadow-md shadow-orange-500/10"
                            : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.06]"
                        }`}
                        title={disabled ? `${selectedBuilding?.name}内不适合${t.label}` : t.hint}
                      >
                        <span className="text-base leading-none">{t.emoji}</span>
                        <span
                          className={`text-[10px] leading-tight ${
                            buildingType === t.value
                              ? "text-orange-200"
                              : "text-zinc-400 group-hover:text-zinc-200"
                          }`}
                        >
                          {t.label}
                        </span>
                      </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== 描述 ===== */}
        <div className="space-y-2">
          <label className="flex items-center justify-between text-xs font-medium text-zinc-400">
            <span>创意描述</span>
            <Badge
              variant={content.length > MAX_LEN * 0.9 ? "warning" : "secondary"}
            >
              {content.length}/{MAX_LEN}
            </Badge>
          </label>
          <Textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
            placeholder={
              intent === "build"
                ? "为什么要建在这里？它能为校园带来什么？描述得越具体，AI 评估越精准。"
                : "目前这里有什么？你希望怎么改？描述越具体，AI 越能给出有价值的建议。"
            }
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={closeCreateDialog}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            创建标点
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
