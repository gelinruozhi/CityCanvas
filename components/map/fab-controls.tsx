"use client";

import { motion } from "framer-motion";
import {
  Trash2,
  Rocket,
  Sun,
  Moon,
  Home,
  Undo2,
  Redo2,
  Satellite,
  MapPin,
  Circle,
  Square,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FabControls() {
  const annotations = useAnnotationStore((s) => s.annotations);
  const isDarkMap = useAnnotationStore((s) => s.isDarkMap);
  const isSatellite = useAnnotationStore((s) => s.isSatellite);
  const drawTool = useAnnotationStore((s) => s.drawTool);
  const setDrawTool = useAnnotationStore((s) => s.setDrawTool);
  const selectedBuilding = useAnnotationStore((s) => s.selectedBuilding);
  const indoorFloor = useAnnotationStore((s) => s.indoorFloor);
  const past = useAnnotationStore((s) => s.past);
  const future = useAnnotationStore((s) => s.future);
  const undo = useAnnotationStore((s) => s.undo);
  const redo = useAnnotationStore((s) => s.redo);
  const clearAll = useAnnotationStore((s) => s.clearAll);
  const toggleMapTheme = useAnnotationStore((s) => s.toggleMapTheme);
  const toggleSatellite = useAnnotationStore((s) => s.toggleSatellite);
  const openPublishDialog = useAnnotationStore((s) => s.openPublishDialog);

  const drawing = drawTool !== "point";

  const handleClear = () => {
    if (annotations.length === 0) {
      toast.info("没有可清空的标点");
      return;
    }
    clearAll();
    toast.success("已清空全部标点", { description: "可以按 Ctrl+Z 撤销" });
  };

  const handlePublish = () => {
    if (annotations.length === 0) {
      toast.warning("先在地图上添加几个标点再发布");
      return;
    }
    openPublishDialog();
  };

  return (
    <TooltipProvider delayDuration={150}>
      {/* 绘图工具条：点 / 圆形区域 / 矩形区域（绘制模式激活时高亮并显示退出按钮） */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.15 }}
        className="pointer-events-auto absolute bottom-6 left-24 z-20 flex flex-col gap-2"
      >
        <div className="flex flex-col gap-2 rounded-full border border-white/10 bg-zinc-950/70 p-1.5 backdrop-blur-xl">
          <ToolButton
            label="点位标注"
            active={drawTool === "point" && !drawing}
            onClick={() => setDrawTool("point")}
          >
            <MapPin className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            label="圆形区域"
            active={drawTool === "circle"}
            onClick={() => setDrawTool("circle")}
          >
            <Circle className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            label="矩形区域"
            active={drawTool === "rect"}
            onClick={() => setDrawTool("rect")}
          >
            <Square className="h-4 w-4" />
          </ToolButton>
        </div>
        {drawing && (
          <button
            onClick={() => setDrawTool("point")}
            className="flex h-9 items-center gap-1.5 self-start rounded-full border border-orange-500/40 bg-orange-500/15 px-3 text-xs text-orange-300 backdrop-blur-xl transition hover:bg-orange-500/25"
          >
            <X className="h-3.5 w-3.5" />
            退出绘制
          </button>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.2 }}
        className="pointer-events-auto absolute bottom-6 left-6 z-20 flex flex-col gap-3"
      >
        <FabButton tooltip="返回首页" asChild>
          <Link href="/">
            <Home className="h-5 w-5" />
          </Link>
        </FabButton>

        <FabButton
          tooltip={isDarkMap ? "切换日间地图" : "切换夜间地图"}
          onClick={toggleMapTheme}
        >
          {isDarkMap ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </FabButton>

        <FabButton
          tooltip={isSatellite ? "切换矢量地图" : "切换卫星实景地图"}
          onClick={toggleSatellite}
          active={isSatellite}
        >
          <Satellite className="h-5 w-5" />
        </FabButton>

        <FabButton
          tooltip="撤销 (Ctrl+Z)"
          onClick={() => {
            if (undo()) toast.info("已撤销");
          }}
          disabled={past.length === 0}
        >
          <Undo2 className="h-5 w-5" />
        </FabButton>

        <FabButton
          tooltip="重做 (Shift+Ctrl+Z)"
          onClick={() => {
            if (redo()) toast.info("已重做");
          }}
          disabled={future.length === 0}
        >
          <Redo2 className="h-5 w-5" />
        </FabButton>

        <FabButton tooltip="清空全部标点" onClick={handleClear}>
          <Trash2 className="h-5 w-5" />
        </FabButton>

        <FabButton tooltip="发布到灵感广场" onClick={handlePublish} primary>
          <Rocket className="h-5 w-5" />
        </FabButton>
      </motion.div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pointer-events-auto absolute bottom-6 left-[168px] z-20 flex h-12 max-w-[46vw] items-center gap-3 rounded-full border border-white/10 bg-zinc-950/70 px-5 backdrop-blur-xl"
      >
        <div className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
        <span className="text-sm text-zinc-300">
          已创建{" "}
          <span className="font-semibold text-white">{annotations.length}</span>{" "}
          个标点
        </span>
        <span className="hidden truncate text-xs text-zinc-500 sm:inline">
          ·{" "}
          {drawing
            ? drawTool === "circle"
              ? "点击定圆心，再次点击完成圆 · Esc 取消"
              : "点击矩形一角，再次点击对角完成 · Esc 取消"
            : selectedBuilding
            ? `已选中 ${selectedBuilding.name}${indoorFloor ? ` · ${indoorFloor}` : ""}`
            : "点击地图任意位置 · 按 ? 看快捷键"}
        </span>
      </motion.div>
    </TooltipProvider>
  );
}

function ToolButton({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`relative grid h-9 w-9 place-items-center rounded-full transition-all ${
            active
              ? "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/50"
              : "text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
          }`}
        >
          {children}
          {active && (
            <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-orange-400" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function FabButton({
  children,
  tooltip,
  onClick,
  primary,
  active,
  asChild,
  disabled,
}: {
  children: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  primary?: boolean;
  active?: boolean;
  asChild?: boolean;
  disabled?: boolean;
}) {
  const className = `grid h-12 w-12 place-items-center rounded-full border transition-all ${
    disabled
      ? "cursor-not-allowed border-white/10 bg-zinc-950/40 text-zinc-600 opacity-50"
      : primary
      ? "border-transparent bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40 hover:scale-110 hover:shadow-xl hover:shadow-orange-500/50 active:scale-95"
      : active
      ? "border-orange-500/50 bg-orange-500/15 text-orange-300 backdrop-blur-xl hover:scale-110 active:scale-95"
      : "border-white/10 bg-zinc-950/70 text-zinc-200 backdrop-blur-xl hover:scale-110 hover:bg-zinc-900 active:scale-95"
  }`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {asChild ? (
          <div className={className}>{children}</div>
        ) : (
          <button onClick={onClick} className={className} disabled={disabled}>
            {children}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
