import Link from "next/link";
import { ArrowLeft, Sparkles, MapPin, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { GalleryClient } from "./gallery-client";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const creations = await prisma.creation.findMany({
    where: { isPublic: true },
    include: {
      user: true,
      annotations: {
        select: {
          x: true,
          y: true,
          title: true,
          buildingType: true,
          aiScore: true,
        },
      },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const totalAnnotations = creations.reduce(
    (s, c) => s + c.annotations.length,
    0
  );
  const totalLikes = creations.reduce((s, c) => s + c._count.likes, 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-orange-500/8 blur-[140px]" />
        <div className="absolute -bottom-40 right-1/4 h-[600px] w-[600px] rounded-full bg-sky-500/6 blur-[160px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              首页
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <h1 className="flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5 text-orange-400" />
              灵感广场
            </h1>
          </div>
          <Link
            href="/create"
            className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl"
          >
            <Sparkles className="mr-1 inline h-4 w-4" />
            开始创作
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pt-10 pb-4">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wider text-zinc-400 backdrop-blur">
              <TrendingUp className="h-3 w-3 text-orange-400" />
              社区共创
            </div>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">
              山财学子<span className="bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent">想象中的校园</span>
            </h2>
            <p className="mt-3 text-balance text-sm leading-relaxed text-zinc-400">
              每一个标点都是一个学生的真实想法 —— 一座没建的咖啡馆、一片没种的绿地、一处没装的休息区。
              点击任意作品进入详情，看作者把校园改成了什么样子。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatCard label="作品" value={creations.length} accent="text-orange-400" />
            <StatCard
              label="标点"
              value={totalAnnotations}
              accent="text-rose-400"
            />
            <StatCard label="点赞" value={totalLikes} accent="text-pink-400" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <GalleryClient creations={creations} />
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 backdrop-blur-xl">
      <span className={`text-2xl font-bold tabular-nums ${accent}`}>
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
    </div>
  );
}
