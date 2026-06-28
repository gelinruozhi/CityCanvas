"use client";

import { useEffect, useRef } from "react";

/**
 * 桌面端鼠标跟随光晕（Pointer-aware）
 * 移动端自动隐藏
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse) return;

    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const handle = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${e.clientX - 200}px, ${e.clientY - 200}px, 0)`;
      });
    };

    window.addEventListener("pointermove", handle);
    return () => {
      window.removeEventListener("pointermove", handle);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[1] h-[400px] w-[400px] rounded-full opacity-50 mix-blend-screen transition-opacity"
      style={{
        background:
          "radial-gradient(circle, rgba(255,107,53,0.15) 0%, rgba(255,107,53,0) 60%)",
        willChange: "transform",
      }}
    />
  );
}
