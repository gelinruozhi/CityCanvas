"use client";

import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Sparkles, Heart, MessageCircle, Pencil } from "lucide-react";

interface Stats {
  creations: number;
  annotations: number;
  comments: number;
  likes: number;
  evaluated: number;
}

const FALLBACK: Stats = {
  creations: 0,
  annotations: 0,
  comments: 0,
  likes: 0,
  evaluated: 0,
};

export function StatsBar() {
  // 不能用 initialData=FALLBACK：会让 query 在 staleTime 内视为新鲜数据，
  // 导致统计永远显示 0；未加载时在渲染层兜底
  const { data } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      const json = await res.json();
      return json.data as Stats;
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const stats = data ?? FALLBACK;

  const items = [
    { icon: Pencil, label: "作品", value: stats.creations, color: "text-orange-400" },
    { icon: MapPin, label: "标点", value: stats.annotations, color: "text-rose-400" },
    { icon: Sparkles, label: "AI 评估", value: stats.evaluated, color: "text-amber-400" },
    { icon: Heart, label: "点赞", value: stats.likes, color: "text-pink-400" },
    { icon: MessageCircle, label: "评论", value: stats.comments, color: "text-sky-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="glass mt-12 grid grid-cols-3 divide-x divide-white/5 overflow-hidden rounded-3xl px-2 py-5 sm:grid-cols-5"
    >
      {items.map((it, i) => (
        <div
          key={it.label}
          className="flex flex-col items-center justify-center px-2"
        >
          <div className={`flex items-center gap-1.5 ${it.color}`}>
            <it.icon className="h-4 w-4" />
            <span className="text-2xl font-bold tabular-nums text-white md:text-3xl">
              <Counter to={it.value} delay={0.5 + i * 0.08} />
            </span>
          </div>
          <span className="mt-1 text-xs tracking-wider text-zinc-500">
            {it.label}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

function Counter({ to, delay }: { to: number; delay: number }) {
  const [display, setDisplay] = useState(to);

  useEffect(() => {
    // 用值驱动的 animate + onUpdate：MotionValue 派生值订阅在生产构建下不可靠
    const ctrl = animate(0, to, {
      duration: 1.2,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => ctrl.stop();
  }, [to, delay]);

  return <>{display}</>;
}
