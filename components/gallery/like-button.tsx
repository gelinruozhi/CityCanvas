"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUserStore } from "@/lib/store/user-store";

interface LikeData {
  liked: boolean;
  count: number;
}

export function LikeButton({
  creationId,
  initialCount,
}: {
  creationId: string;
  initialCount: number;
}) {
  const userId = useUserStore((s) => s.id);
  const qc = useQueryClient();
  const [burst, setBurst] = useState(0);

  const { data } = useQuery<LikeData>({
    queryKey: ["like", creationId, userId],
    queryFn: async () => {
      const res = await fetch(
        `/api/creations/${creationId}/like?userId=${userId}`
      );
      const json = await res.json();
      return json.data;
    },
    enabled: Boolean(userId),
    initialData: { liked: false, count: initialCount },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("匿名用户未就绪");
      const res = await fetch(`/api/creations/${creationId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "点赞失败");
      return json.data as LikeData;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["like", creationId, userId] });
      const prev = qc.getQueryData<LikeData>(["like", creationId, userId]);
      const next: LikeData = prev
        ? { liked: !prev.liked, count: prev.count + (prev.liked ? -1 : 1) }
        : { liked: true, count: initialCount + 1 };
      qc.setQueryData(["like", creationId, userId], next);
      if (next.liked) setBurst((n) => n + 1);
      return { prev };
    },
    onError: (err, _, ctx) => {
      if (ctx?.prev) qc.setQueryData(["like", creationId, userId], ctx.prev);
      toast.error(err instanceof Error ? err.message : "点赞失败");
    },
    onSuccess: (data) => {
      qc.setQueryData(["like", creationId, userId], data);
    },
  });

  const liked = data?.liked ?? false;
  const count = data?.count ?? initialCount;

  return (
    <button
      onClick={() => toggle.mutate()}
      disabled={!userId || toggle.isPending}
      className={`group relative flex items-center gap-2 overflow-visible rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        liked
          ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
          : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <motion.div
        animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-rose-400 text-rose-400" : ""}`} />

        <AnimatePresence>
          {burst > 0 && (
            <motion.div
              key={burst}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="pointer-events-none absolute inset-0"
              onAnimationComplete={() => setBurst(0)}
            >
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                return (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{
                      x: Math.cos(angle) * 22,
                      y: Math.sin(angle) * 22,
                      scale: 0,
                      opacity: 0,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute left-1/2 top-1/2 -ml-1 -mt-1 h-2 w-2 rounded-full bg-rose-400"
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <span>{count}</span>
    </button>
  );
}
