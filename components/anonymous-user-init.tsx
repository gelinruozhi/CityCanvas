"use client";

import { useEffect } from "react";
import { useUserStore } from "@/lib/store/user-store";
import { generateRandomNickname } from "@/lib/nickname";

// 模块级单例：多个页面实例（layout + 页面级）或 React 严格模式双重挂载时，
// 只发一次 POST /api/users，避免创建重复的匿名用户
let initPromise: Promise<void> | null = null;

export function AnonymousUserInit() {
  const id = useUserStore((s) => s.id);
  const nickname = useUserStore((s) => s.nickname);
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    if (id && nickname) return;
    if (!initPromise) {
      initPromise = fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          nickname: nickname ?? generateRandomNickname(),
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res?.data?.id) {
            setUser(res.data.id, res.data.nickname);
          }
        })
        .catch((e) => {
          console.error("初始化匿名用户失败：", e);
          initPromise = null;
        });
    }
  }, [id, nickname, setUser]);

  return null;
}
