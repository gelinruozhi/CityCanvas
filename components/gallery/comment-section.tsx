"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/lib/store/user-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CommentData {
  id: string;
  content: string;
  createdAt: string | Date;
  user: { id: string; nickname: string };
}

export function CommentSection({
  creationId,
  initialComments,
}: {
  creationId: string;
  initialComments: CommentData[];
}) {
  const userId = useUserStore((s) => s.id);
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data: comments = initialComments } = useQuery<CommentData[]>({
    queryKey: ["comments", creationId],
    queryFn: async () => {
      const res = await fetch(`/api/creations/${creationId}/comments`);
      const json = await res.json();
      return json.data;
    },
    initialData: initialComments,
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("匿名用户未就绪");
      const trimmed = draft.trim();
      if (!trimmed) throw new Error("评论不能为空");
      const res = await fetch(`/api/creations/${creationId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "评论失败");
      return json.data as CommentData;
    },
    onSuccess: (newComment) => {
      qc.setQueryData<CommentData[]>(
        ["comments", creationId],
        (old = []) => [newComment, ...old]
      );
      setDraft("");
      toast.success("评论已发布");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "评论失败");
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <MessageCircle className="h-4 w-4 text-orange-400" />
        <span className="font-medium text-white">评论</span>
        <span className="text-zinc-500">({comments.length})</span>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="写下你的想法…"
          className="resize-none bg-transparent border-white/10"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">{draft.length}/500</span>
          <Button
            size="sm"
            onClick={() => submit.mutate()}
            disabled={!draft.trim() || submit.isPending || !userId}
          >
            {submit.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            发布
          </Button>
        </div>
      </div>

      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {comments.map((c) => (
            <motion.li
              key={c.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {c.user.nickname.slice(-1)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-zinc-200">
                    {c.user.nickname}
                  </span>
                  <span className="text-zinc-600">
                    {new Date(c.createdAt).toLocaleString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                  {c.content}
                </p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
        {comments.length === 0 && (
          <li className="rounded-2xl border border-dashed border-white/10 py-8 text-center text-sm text-zinc-500">
            还没有评论，第一个说点什么吧
          </li>
        )}
      </ul>
    </div>
  );
}
