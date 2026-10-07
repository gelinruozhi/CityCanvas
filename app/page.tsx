"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Bot,
  MousePointerClick,
  PenLine,
  Rocket,
  Heart,
  GitFork,
} from "lucide-react";
import { CursorGlow } from "@/components/cursor-glow";
import { StatsBar } from "@/components/stats-bar";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <CursorGlow />

      <BackgroundLayers />

      <Header />

      <Hero />

      <HowItWorks />

      <FeatureGrid />

      <Footer />
    </main>
  );
}

function BackgroundLayers() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-orange-500/20 blur-[120px]" />
      <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-sky-500/12 blur-[140px]" />
      <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-purple-500/12 blur-[120px]" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

function Header() {
  return (
    <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
          <MapPin className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">CityCanvas</span>
      </Link>
      <nav className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
        <Link href="/create" className="transition hover:text-white">
          开始创作
        </Link>
        <Link href="/gallery" className="transition hover:text-white">
          作品广场
        </Link>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 pt-20 pb-32 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-zinc-200"
      >
        <Sparkles className="h-3.5 w-3.5 text-orange-400" />
        <span>AI 实时评估 · 卡通校园画布</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="max-w-4xl text-balance text-5xl font-bold tracking-tight text-white md:text-7xl"
      >
        在山财画布上
        <br />
        <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
          绘制你的理想校园
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mt-6 max-w-2xl text-balance text-lg text-zinc-300"
      >
        在卡通校园画布上自由打点 — 添加一间咖啡馆、一座图书馆、一片绿地。
        AI 会基于周边环境实时评估你的创意是否舒适、便捷、合理。
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
      >
        <Link
          href="/create"
          className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-7 py-3 text-sm font-medium text-white shadow-lg shadow-orange-500/40 transition hover:shadow-xl hover:shadow-orange-500/50"
        >
          开始你的创作
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/gallery"
          className="glass inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
        >
          浏览灵感广场
        </Link>
      </motion.div>

      <ScrollPreview />

      <StatsBar />
    </section>
  );
}

function ScrollPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rotate = useTransform(scrollYProgress, [0, 1], [-1.5, 1.5]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 1], [0.94, 1, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ rotate, scale }}
      className="relative mt-20 w-full max-w-5xl"
    >
      {/* 外发光晕 */}
      <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-br from-orange-500/25 via-transparent to-sky-500/25 blur-3xl" />

      {/* 浏览器窗口外框 */}
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-zinc-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <BrowserChrome />
        <ProductMockup />
      </div>

      {/* 角标：明确告诉用户这是 demo */}
      <div className="pointer-events-none absolute -top-3 left-6 z-10 rounded-full border border-orange-500/40 bg-zinc-950 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-orange-300">
        ✦ 产品演示
      </div>
    </motion.div>
  );
}

function BrowserChrome() {
  return (
    <div className="flex items-center gap-3 border-b border-white/8 bg-zinc-900/95 px-4 py-3">
      <div className="flex gap-1.5">
        <span className="h-3 w-3 rounded-full bg-rose-500/80" />
        <span className="h-3 w-3 rounded-full bg-amber-500/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
      </div>
      <div className="ml-2 flex flex-1 items-center gap-2 rounded-md bg-zinc-800/70 px-3 py-1 text-xs">
        <span className="text-zinc-600">🔒</span>
        <span className="font-mono text-zinc-400">citycanvas.app</span>
        <span className="text-zinc-600">/create</span>
      </div>
      <div className="hidden items-center gap-2 text-xs text-zinc-400 sm:flex">
        <Avatar />
        <span>打盹的小鹿</span>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-[10px] font-semibold text-white">
      鹿
    </span>
  );
}

/**
 * 产品 mockup — 模拟 /create 页面布局：
 * 左下 FAB + 中央地图 + 右侧标点详情面板
 * 用浅色地图配色（与真实产品保持视觉一致）
 */
function ProductMockup() {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f0eee8]">
      {/* 浅色地图底图（模拟真实地图风格） */}
      <LightMapBackground />

      {/* 4 个示例标点带文字标签 */}
      <PinWithLabel
        x={22}
        y={32}
        color="#10b981"
        emoji="🌳"
        score={88}
        label="屋顶花园"
        delay={0.6}
      />
      <PinWithLabel
        x={42}
        y={62}
        color="#f97316"
        emoji="🍱"
        score={73}
        label="夜宵食堂"
        delay={0.75}
      />
      <PinWithLabel
        x={56}
        y={28}
        color="#0ea5e9"
        emoji="📚"
        score={92}
        label="24h 自习舱"
        delay={0.9}
        highlighted
      />
      <PinWithLabel
        x={75}
        y={55}
        color="#8b5cf6"
        emoji="☕"
        score={65}
        label="星空咖啡角"
        delay={1.05}
      />

      {/* 右侧详情面板 */}
      <DetailPanelMock />

      {/* 左下 FAB 模拟 */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="absolute bottom-4 left-4 flex flex-col gap-2"
      >
        <div className="grid h-10 w-10 place-items-center rounded-full border border-zinc-300/50 bg-white shadow-md">
          <span className="text-lg">🏠</span>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-full border border-zinc-300/50 bg-white shadow-md">
          <span className="text-lg">🌙</span>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/40">
          <span className="text-base">🚀</span>
        </div>
      </motion.div>

      {/* 顶部状态栏：模拟 "已创建 X 个标点" */}
      <motion.div
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-300/50 bg-white/95 px-4 py-1.5 text-xs shadow-md backdrop-blur"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
        <span className="text-zinc-700">
          已创建 <strong className="text-zinc-900">4</strong> 个标点 · AI 均分{" "}
          <strong className="text-orange-600">79.5</strong>
        </span>
      </motion.div>
    </div>
  );
}

function LightMapBackground() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 62.5"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="hp-grid" width="6" height="6" patternUnits="userSpaceOnUse">
          <path
            d="M 6 0 L 0 0 0 6"
            fill="none"
            stroke="rgba(60, 80, 110, 0.06)"
            strokeWidth="0.2"
          />
        </pattern>
        <pattern id="hp-grid-fine" width="2" height="2" patternUnits="userSpaceOnUse">
          <path
            d="M 2 0 L 0 0 0 2"
            fill="none"
            stroke="rgba(60, 80, 110, 0.03)"
            strokeWidth="0.1"
          />
        </pattern>
      </defs>
      <rect width="100" height="62.5" fill="url(#hp-grid-fine)" />
      <rect width="100" height="62.5" fill="url(#hp-grid)" />

      {/* ===== 水系（蜿蜒的小河） ===== */}
      <path
        d="M -2 8 Q 12 11 22 7 T 50 14 Q 65 18 78 12 T 102 16"
        stroke="rgba(147, 197, 253, 0.55)"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M -2 8 Q 12 11 22 7 T 50 14 Q 65 18 78 12 T 102 16"
        stroke="rgba(186, 219, 255, 0.7)"
        strokeWidth="0.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* ===== 绿地（公园 / 草坪 / 树丛） ===== */}
      {[
        { cx: 14, cy: 46, rx: 13, ry: 7 },
        { cx: 86, cy: 22, rx: 10, ry: 5.5 },
        { cx: 64, cy: 50, rx: 8, ry: 4.5 },
        { cx: 5, cy: 28, rx: 6, ry: 4 },
        { cx: 95, cy: 45, rx: 5, ry: 4.5 },
      ].map((g, i) => (
        <ellipse
          key={`green-${i}`}
          cx={g.cx}
          cy={g.cy}
          rx={g.rx}
          ry={g.ry}
          fill="rgba(187, 222, 162, 0.45)"
        />
      ))}

      {/* 公园内的小树（深绿色小圆点） */}
      {[
        [10, 44], [14, 47], [18, 45], [12, 49], [16, 50], [8, 48],
        [85, 20], [88, 23], [82, 22], [86, 25],
        [62, 49], [66, 51], [64, 52], [68, 49],
        [3, 27], [6, 30],
        [94, 44], [96, 47], [93, 47],
      ].map(([x, y], i) => (
        <g key={`tree-${i}`}>
          <circle cx={x} cy={y} r="0.5" fill="rgba(51, 130, 60, 0.55)" />
          <circle cx={x - 0.15} cy={y - 0.15} r="0.2" fill="rgba(120, 180, 100, 0.7)" />
        </g>
      ))}

      {/* ===== 道路系统 ===== */}
      {/* 主干道（带白色描边） */}
      <path
        d="M -2 30 Q 25 24 50 32 T 102 36"
        stroke="rgba(255, 255, 255, 0.95)"
        strokeWidth="1.8"
        fill="none"
      />
      {/* 主干道中线（虚线） */}
      <path
        d="M -2 30 Q 25 24 50 32 T 102 36"
        stroke="rgba(255, 200, 80, 0.55)"
        strokeWidth="0.18"
        strokeDasharray="0.6 0.4"
        fill="none"
      />

      {/* 次干道（横向） */}
      <path d="M -2 50 L 102 52" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.0" fill="none" />

      {/* 纵向次干道 */}
      <path d="M 30 -2 Q 30 25 35 35 T 32 64" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.1" fill="none" />
      <path d="M 70 -2 L 72 64" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.0" fill="none" />

      {/* 巷子 / 支路（更细的灰线） */}
      <path d="M 50 -2 L 52 30" stroke="rgba(180, 180, 180, 0.6)" strokeWidth="0.5" fill="none" />
      <path d="M 18 30 L 20 50" stroke="rgba(180, 180, 180, 0.6)" strokeWidth="0.5" fill="none" />
      <path d="M 45 30 L 47 50" stroke="rgba(180, 180, 180, 0.5)" strokeWidth="0.45" fill="none" />
      <path d="M 60 32 L 60 50" stroke="rgba(180, 180, 180, 0.55)" strokeWidth="0.5" fill="none" />
      <path d="M 82 36 L 82 52" stroke="rgba(180, 180, 180, 0.55)" strokeWidth="0.5" fill="none" />
      <path d="M 8 18 L 30 18" stroke="rgba(180, 180, 180, 0.5)" strokeWidth="0.45" fill="none" />
      <path d="M 35 8 L 70 8" stroke="rgba(180, 180, 180, 0.55)" strokeWidth="0.5" fill="none" />
      <path d="M 35 22 L 70 22" stroke="rgba(180, 180, 180, 0.55)" strokeWidth="0.5" fill="none" />
      <path d="M 50 56 L 80 56" stroke="rgba(180, 180, 180, 0.55)" strokeWidth="0.5" fill="none" />
      <path d="M 8 56 L 30 56" stroke="rgba(180, 180, 180, 0.5)" strokeWidth="0.45" fill="none" />

      {/* ===== 建筑物（小密度铺满） ===== */}
      {/* 第一组：左上区 */}
      {[
        [3, 4, 4, 3], [8, 4, 5, 3.5], [14, 4, 4, 4], [19, 4, 4, 3], [24, 5, 5, 3],
        [3, 11, 3, 4], [7, 11, 4, 3], [12, 12, 3, 3], [16, 11, 6, 4], [23, 12, 5, 3.5],
        [3, 18, 4, 3.5], [8, 19, 3, 3], [12, 19, 5, 3], [18, 20, 4, 2.5], [23, 19, 5, 4],
      ].map(([x, y, w, h], i) => (
        <rect
          key={`b1-${i}`}
          x={x}
          y={y}
          width={w}
          height={h}
          fill="rgba(220, 220, 220, 0.75)"
          stroke="rgba(170, 170, 170, 0.5)"
          strokeWidth="0.1"
          rx="0.3"
        />
      ))}

      {/* 第二组：中央区（教学/图书馆区） */}
      {[
        [37, 4, 8, 5], [46, 4, 6, 5], [53, 4, 5, 5], [59, 4, 4, 4], [64, 4, 4, 4],
        [37, 12, 5, 4], [43, 11, 5, 5], [49, 11, 4, 5], [54, 12, 4, 4], [59, 12, 5, 4],
        [64, 11, 5, 5],
        [37, 18, 4, 3], [42, 19, 5, 3], [48, 18, 4, 3.5], [53, 19, 6, 3], [60, 18, 5, 4],
        [66, 19, 4, 3],
      ].map(([x, y, w, h], i) => (
        <rect
          key={`b2-${i}`}
          x={x}
          y={y}
          width={w}
          height={h}
          fill="rgba(218, 218, 224, 0.75)"
          stroke="rgba(170, 170, 175, 0.5)"
          strokeWidth="0.1"
          rx="0.3"
        />
      ))}

      {/* 第三组：右上区 */}
      {[
        [74, 4, 5, 3.5], [80, 5, 4, 3], [78, 9, 4, 3], [82, 13, 5, 4],
        [74, 14, 4, 3], [76, 25, 4, 3], [82, 27, 4, 3], [88, 28, 5, 4],
      ].map(([x, y, w, h], i) => (
        <rect
          key={`b3-${i}`}
          x={x}
          y={y}
          width={w}
          height={h}
          fill="rgba(220, 220, 220, 0.75)"
          stroke="rgba(170, 170, 170, 0.5)"
          strokeWidth="0.1"
          rx="0.3"
        />
      ))}

      {/* 第四组：左下区 */}
      {[
        [3, 36, 4, 3], [8, 37, 5, 3], [14, 36, 4, 3.5], [3, 42, 5, 3],
        [22, 36, 4, 3], [22, 41, 5, 3.5],
        [3, 56, 4, 3], [8, 56, 4, 3], [14, 56, 5, 3], [21, 57, 4, 2.5],
      ].map(([x, y, w, h], i) => (
        <rect
          key={`b4-${i}`}
          x={x}
          y={y}
          width={w}
          height={h}
          fill="rgba(225, 220, 215, 0.7)"
          stroke="rgba(180, 170, 165, 0.4)"
          strokeWidth="0.1"
          rx="0.3"
        />
      ))}

      {/* 第五组：右下区 */}
      {[
        [73, 38, 5, 3], [78, 38, 4, 3], [83, 38, 5, 3], [73, 42, 4, 3], [78, 43, 5, 3.5],
        [83, 43, 4, 3], [88, 38, 4, 3], [88, 42, 5, 3.5],
        [50, 38, 5, 3], [56, 38, 4, 3], [50, 43, 4, 2.5], [56, 43, 5, 3],
        [50, 56, 4, 3], [55, 56, 5, 3], [62, 57, 5, 2.5],
        [73, 56, 4, 3], [78, 56, 5, 3], [85, 56, 4, 3],
      ].map(([x, y, w, h], i) => (
        <rect
          key={`b5-${i}`}
          x={x}
          y={y}
          width={w}
          height={h}
          fill="rgba(220, 220, 220, 0.7)"
          stroke="rgba(170, 170, 170, 0.45)"
          strokeWidth="0.1"
          rx="0.3"
        />
      ))}

      {/* 几栋特殊染色建筑（公共建筑：图书馆/教学楼用淡蓝、餐饮用淡橙） */}
      <rect x="46" y="11" width="7" height="6" fill="rgba(186, 219, 255, 0.6)" stroke="rgba(120, 180, 240, 0.5)" strokeWidth="0.15" rx="0.4" />
      <rect x="55" y="11" width="5" height="6" fill="rgba(186, 219, 255, 0.55)" stroke="rgba(120, 180, 240, 0.5)" strokeWidth="0.15" rx="0.4" />
      <rect x="40" y="38" width="5" height="3.5" fill="rgba(255, 220, 180, 0.6)" stroke="rgba(240, 180, 120, 0.5)" strokeWidth="0.15" rx="0.4" />
      <rect x="73" y="13" width="5" height="4" fill="rgba(255, 220, 180, 0.55)" stroke="rgba(240, 180, 120, 0.5)" strokeWidth="0.15" rx="0.4" />

      {/* ===== 微小细节装饰 ===== */}
      {/* 停车场标记 P */}
      {[
        [43, 26], [22, 53], [80, 33], [95, 53],
      ].map(([x, y], i) => (
        <g key={`park-${i}`}>
          <rect x={x - 0.6} y={y - 0.6} width="1.2" height="1.2" fill="rgba(96, 165, 250, 0.4)" rx="0.2" />
          <text x={x} y={y + 0.4} fontSize="0.9" fontWeight="700" fill="rgba(255,255,255,0.9)" textAnchor="middle">
            P
          </text>
        </g>
      ))}

      {/* 长椅 / 设施小标记（小棕色矩形） */}
      {[
        [12, 44], [16, 48], [85, 24], [62, 51], [4, 30],
      ].map(([x, y], i) => (
        <rect
          key={`bench-${i}`}
          x={x - 0.4}
          y={y - 0.15}
          width="0.8"
          height="0.3"
          fill="rgba(160, 100, 50, 0.6)"
          rx="0.05"
        />
      ))}

      {/* 桥（穿过小河的位置） */}
      <rect x="29" y="10" width="2" height="2" fill="rgba(200, 180, 160, 0.7)" stroke="rgba(140, 120, 100, 0.5)" strokeWidth="0.1" rx="0.2" />
      <rect x="69" y="14" width="2" height="2" fill="rgba(200, 180, 160, 0.7)" stroke="rgba(140, 120, 100, 0.5)" strokeWidth="0.1" rx="0.2" />

      {/* 斑马线（主干道与次干道交叉口） */}
      {[
        [29.5, 27.5], [29.5, 30.5], [70.5, 33], [70.5, 36],
      ].map(([x, y], i) => (
        <g key={`zebra-${i}`}>
          {[0, 0.4, 0.8, 1.2].map((dx) => (
            <rect key={dx} x={x + dx} y={y} width="0.25" height="1" fill="rgba(255,255,255,0.85)" />
          ))}
        </g>
      ))}

      {/* 一些散落的微小点（POI / 灯光）—— 增加密度 */}
      {[
        [9, 7], [25, 9], [38, 9], [55, 7], [80, 9],
        [42, 27], [62, 27], [88, 19],
        [12, 39], [27, 39], [54, 41], [82, 41], [92, 41],
        [38, 53], [58, 54], [78, 53],
      ].map(([x, y], i) => (
        <circle
          key={`dot-${i}`}
          cx={x}
          cy={y}
          r="0.18"
          fill="rgba(251, 146, 60, 0.5)"
        />
      ))}

      {/* 路名（虚拟）——稍微一点点细节 */}
      <text x="50" y="29.5" fontSize="0.9" fill="rgba(80, 90, 110, 0.55)" textAnchor="middle" fontFamily="system-ui">
        经十东路
      </text>
      <text
        x="35"
        y="40"
        fontSize="0.8"
        fill="rgba(80, 90, 110, 0.45)"
        textAnchor="middle"
        fontFamily="system-ui"
        transform="rotate(-90, 35, 40)"
      >
        圣井路
      </text>
      <text
        x="71.5"
        y="40"
        fontSize="0.8"
        fill="rgba(80, 90, 110, 0.45)"
        textAnchor="middle"
        fontFamily="system-ui"
        transform="rotate(-90, 71.5, 40)"
      >
        黄旗山路
      </text>
    </svg>
  );
}

function PinWithLabel({
  x,
  y,
  color,
  emoji,
  score,
  label,
  delay,
  highlighted = false,
}: {
  x: number;
  y: number;
  color: string;
  emoji: string;
  score: number;
  label: string;
  delay: number;
  highlighted?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: -16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 20 }}
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="relative -translate-x-1/2 -translate-y-full">
        {highlighted && (
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: color, filter: "blur(8px)" }}
          />
        )}

        {/* 标签 */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-medium text-zinc-800 shadow-md ring-1 ring-zinc-200/80">
          {label}
          <span
            className="ml-1.5 rounded px-1 py-0.5 text-[9px] font-bold tabular-nums text-white"
            style={{ background: color }}
          >
            {score}
          </span>
        </div>

        {/* 水滴标点 */}
        <svg
          width="36"
          height="46"
          viewBox="0 0 44 56"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22 4 C12 4 6 12 6 22 C6 33 22 52 22 52 C22 52 38 33 38 22 C38 12 32 4 22 4 Z"
            fill={color}
            stroke="white"
            strokeWidth="2"
            filter="drop-shadow(0 4px 8px rgba(0,0,0,0.25))"
          />
          <circle cx="22" cy="22" r="8" fill="white" />
          <text
            x="22"
            y="27"
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
          >
            {emoji}
          </text>
        </svg>

        {/* 阴影 */}
        <div
          className="absolute -bottom-1 left-1/2 h-2 w-3 -translate-x-1/2 rounded-full opacity-50"
          style={{
            background: `radial-gradient(ellipse, ${color}50, transparent 70%)`,
            filter: "blur(3px)",
          }}
        />
      </div>
    </motion.div>
  );
}

function DetailPanelMock() {
  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.6 }}
      className="absolute right-4 top-16 w-[260px] overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/97 shadow-2xl backdrop-blur-sm"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📚</span>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-zinc-400">
              标点详情
            </div>
            <div className="text-sm font-semibold text-zinc-900">
              24h 自习舱
            </div>
          </div>
        </div>
        <span className="text-zinc-400">×</span>
      </div>

      {/* AI 评估卡片 */}
      <div className="space-y-2.5 bg-gradient-to-br from-orange-50 to-rose-50/60 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
            <Sparkles className="h-3 w-3 text-orange-500" />
            AI 评估
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-bold leading-none text-orange-600">
              92
            </span>
            <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              A+
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <ScoreBarLight label="舒适度" value={88} from="#fbbf24" to="#f97316" />
          <ScoreBarLight label="便捷度" value={94} from="#38bdf8" to="#6366f1" />
        </div>

        <p className="text-[11px] leading-relaxed text-zinc-700">
          毗邻图书馆，自习+咖啡的协同动线极佳。建议入口避开二号教学楼下课人流。
        </p>

        <div className="flex flex-wrap gap-1 pt-0.5">
          {["#文艺", "#静谧", "#协同"].map((t) => (
            <span
              key={t}
              className="rounded-full bg-white px-1.5 py-0.5 text-[9px] text-zinc-600 ring-1 ring-zinc-200/70"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ScoreBarLight({
  label,
  value,
  from,
  to,
}: {
  label: string;
  value: number;
  from: string;
  to: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[9px]">
        <span className="text-zinc-500">{label}</span>
        <span className="font-mono tabular-nums text-zinc-700">{value}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-zinc-200/70">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: 1.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
        />
      </div>
    </div>
  );
}

const STEPS = [
  {
    icon: MousePointerClick,
    title: "点击画布任意位置",
    desc: "在山财圣井校区的卡通画布上，点击你想改造的角落。",
    color: "from-orange-500 to-rose-500",
  },
  {
    icon: PenLine,
    title: "用文字描述创意",
    desc: "选建筑类型、写下你的想法。一座咖啡馆？一片屋顶花园？由你来定。",
    color: "from-sky-500 to-indigo-500",
  },
  {
    icon: Bot,
    title: "AI 即时评估并给建议",
    desc: "AI 综合周边楼栋布局、人流和功能协同，给出舒适度+便捷度评分。",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Rocket,
    title: "发布到广场，社区共创",
    desc: "他人可点赞、评论、Fork 你的作品作为新创作的起点。",
    color: "from-purple-500 to-fuchsia-500",
  },
];

function HowItWorks() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h2 className="text-balance text-4xl font-bold tracking-tight text-white md:text-5xl">
          四步，让你的创意被
          <span className="bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent">
            {" "}AI 看见
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-zinc-400">
          从一个点击开始，到社区共创结束。整个过程不到 30 秒。
        </p>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="group relative"
          >
            <div className="glass relative h-full rounded-3xl p-6">
              <div className="absolute -top-3 right-5 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 font-mono text-xs text-zinc-300 ring-1 ring-white/10">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div
                className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${step.color} shadow-lg`}
              >
                <step.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {step.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: MapPin,
    title: "自绘卡通校园画布",
    desc: "31 栋楼 + 路网 + 湖泊 + 运动场全部手绘还原，楼栋可点击进入楼层室内编辑。",
  },
  {
    icon: Sparkles,
    title: "场景感知的 AI 评估",
    desc: "AI 看到的是你标点周边的楼栋与区域（图书馆/教学楼/餐厅），按室内外场景分别评估，建议具体可落地。",
  },
  {
    icon: Heart,
    title: "社区点赞 · 评论 · 互动",
    desc: "瀑布流广场 + 心形粒子点赞 + 实时评论。让创意被看见。",
  },
  {
    icon: GitFork,
    title: "Fork 二次创作",
    desc: "一键 Fork 别人的作品到自己的画布，叠加你的想法继续创作。",
  },
];

function FeatureGrid() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h2 className="text-balance text-4xl font-bold tracking-tight text-white md:text-5xl">
          技术亮点
        </h2>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="glass group rounded-3xl p-6 transition hover:bg-white/[0.06]"
          >
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400 transition group-hover:bg-orange-500/25">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  {f.desc}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 mt-12 border-t border-white/5 bg-zinc-950/50 py-12 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-zinc-500 md:flex-row">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-orange-400" />
          <span className="font-semibold text-white">CityCanvas</span>
          <span>·</span>
          <span>校园改造画布</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/create" className="transition hover:text-white">创作</Link>
          <Link href="/gallery" className="transition hover:text-white">广场</Link>
          <span>·</span>
          <span>山东财经大学</span>
        </div>
      </div>
    </footer>
  );
}
