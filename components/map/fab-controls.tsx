"use client";

import { motion } from "framer-motion";
import { Trash2, Rocket, Sun, Moon, Home, Undo2, Redo2 } from "lucide-react";
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
  const past = useAnnotationStore((s) => s.past);
  const future = useAnnotationStore((s) => s.future);
  const undo = useAnnotationStore((s) => s.undo);
  const redo = useAnnotationStore((s) => s.redo);
  const clearAll = useAnnotationStore((s) => s.clearAll);
  const toggleMapTheme = useAnnotationStore((s) => s.toggleMapTheme);
  const openPublishDialog = useAnnotationStore((s) => s.openPublishDialog);

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
        className="pointer-events-auto absolute bottom-6 left-24 z-20 flex h-12 items-center gap-3 rounded-full border border-white/10 bg-zinc-950/70 px-5 backdrop-blur-xl"
      >
        <div className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
        <span className="text-sm text-zinc-300">
          已创建{" "}
          <span className="font-semibold text-white">{annotations.length}</span>{" "}
          个标点
        </span>
        <span className="hidden text-xs text-zinc-500 sm:inline">
          · 点击地图任意位置 · 按 ? 看快捷键
        </span>
      </motion.div>
    </TooltipProvider>
  );
}

function FabButton({
  children,
  tooltip,
  onClick,
  primary,
  asChild,
  disabled,
}: {
  children: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  primary?: boolean;
  asChild?: boolean;
  disabled?: boolean;
}) {
  const className = `grid h-12 w-12 place-items-center rounded-full border border-white/10 transition-all ${
    disabled
      ? "cursor-not-allowed bg-zinc-950/40 text-zinc-600 opacity-50"
      : primary
      ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40 hover:scale-110 hover:shadow-xl hover:shadow-orange-500/50 active:scale-95"
      : "bg-zinc-950/70 text-zinc-200 backdrop-blur-xl hover:scale-110 hover:bg-zinc-900 active:scale-95"
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
