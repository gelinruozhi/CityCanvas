"use client";

import { useEffect } from "react";
import { useUserStore } from "@/lib/store/user-store";
import { generateRandomNickname } from "@/lib/nickname";

export function AnonymousUserInit() {
  const id = useUserStore((s) => s.id);
  const nickname = useUserStore((s) => s.nickname);
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    if (id && nickname) return;
    const newNickname = nickname ?? generateRandomNickname();

    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nickname: newNickname }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res?.data?.id) {
          setUser(res.data.id, res.data.nickname);
        }
      })
      .catch((e) => console.error("初始化匿名用户失败：", e));
  }, [id, nickname, setUser]);

  return null;
}
