"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAnnotationStore } from "@/lib/store/annotation-store";

/**
 * 创作页全局键盘快捷键。
 * - Ctrl/Cmd + Z   撤销
 * - Ctrl/Cmd + Shift + Z   重做
 * - Esc            关闭面板/弹窗
 * - Delete         删除当前选中标点
 * - ?              显示帮助 toast
 *
 * 在输入框/文本域里按键时不触发，避免干扰打字。
 */
export function KeyboardShortcuts() {
  const undo = useAnnotationStore((s) => s.undo);
  const redo = useAnnotationStore((s) => s.redo);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const selectedBuilding = useAnnotationStore((s) => s.selectedBuilding);
  const indoorFloor = useAnnotationStore((s) => s.indoorFloor);
  const removeAnnotation = useAnnotationStore((s) => s.removeAnnotation);
  const selectAnnotation = useAnnotationStore((s) => s.selectAnnotation);
  const selectBuilding = useAnnotationStore((s) => s.selectBuilding);
  const setIndoorFloor = useAnnotationStore((s) => s.setIndoorFloor);
  const closeCreateDialog = useAnnotationStore((s) => s.closeCreateDialog);
  const closePublishDialog = useAnnotationStore((s) => s.closePublishDialog);

  useEffect(() => {
    const isTyping = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return tag === "input" || tag === "textarea" || el.isContentEditable;
    };

    const handler = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const meta = e.ctrlKey || e.metaKey;

      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        if (undo()) toast.info("已撤销");
        return;
      }
      if ((meta && e.key.toLowerCase() === "y") || (meta && e.shiftKey && e.key.toLowerCase() === "z")) {
        e.preventDefault();
        if (redo()) toast.info("已重做");
        return;
      }
      if (e.key === "Escape") {
        // 退出链：弹窗 → 绘图中的形状 → 室内模式 → 标注/建筑选中
        closeCreateDialog();
        closePublishDialog();
        window.dispatchEvent(new CustomEvent("cc-cancel-draw"));
        if (indoorFloor) {
          setIndoorFloor(null);
          return;
        }
        if (selectedBuilding) {
          selectBuilding(null);
          return;
        }
        if (selectedId) selectAnnotation(null);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        removeAnnotation(selectedId);
        toast.info("已删除标点");
        return;
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        toast.info("快捷键", {
          description: "Ctrl+Z 撤销 · Shift+Ctrl+Z 重做 · Esc 逐级退出（弹窗/绘图/室内/选中）· Del 删除选中",
          duration: 6000,
        });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    undo,
    redo,
    selectedId,
    selectedBuilding,
    indoorFloor,
    removeAnnotation,
    selectAnnotation,
    selectBuilding,
    setIndoorFloor,
    closeCreateDialog,
    closePublishDialog,
  ]);

  return null;
}
