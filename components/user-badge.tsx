"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/lib/store/user-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserBadge() {
  const id = useUserStore((s) => s.id);
  const nickname = useUserStore((s) => s.nickname);
  const setNickname = useUserStore((s) => s.setNickname);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (!id || !nickname) return null;

  const handleSave = async () => {
    const trimmed = draft.trim().slice(0, 20);
    if (!trimmed) {
      toast.error("昵称不能为空");
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nickname: trimmed }),
      });
      if (!res.ok) throw new Error("更新失败");
      setNickname(trimmed);
      setEditing(false);
      toast.success("昵称已更新");
    } catch (e) {
      console.error(e);
      toast.error("更新失败");
    }
  };

  return (
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.4 }}
      className="pointer-events-auto absolute right-4 top-4 z-20 flex items-center gap-3 rounded-full border border-white/10 bg-zinc-950/70 py-1.5 pl-1.5 pr-3 backdrop-blur-xl"
    >
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-xs">
          {nickname.slice(-1)}
        </AvatarFallback>
      </Avatar>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
            maxLength={20}
            className="w-28 rounded bg-white/5 px-2 py-0.5 text-sm text-white outline-none focus:bg-white/10"
            placeholder="新昵称"
          />
          <button
            onClick={handleSave}
            className="grid h-6 w-6 place-items-center rounded-full text-emerald-400 hover:bg-emerald-500/20"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="grid h-6 w-6 place-items-center rounded-full text-zinc-400 hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <>
          <span className="text-sm font-medium text-white">{nickname}</span>
          <button
            onClick={() => {
              setDraft(nickname);
              setEditing(true);
            }}
            className="grid h-6 w-6 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </>
      )}
    </motion.div>
  );
}
