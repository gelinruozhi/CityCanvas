import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Sparkles, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreationDetailMap } from "@/components/gallery/creation-detail-map";
import { LikeButton } from "@/components/gallery/like-button";
import { CommentSection } from "@/components/gallery/comment-section";
import { ForkButton } from "@/components/gallery/fork-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function CreationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const creation = await prisma.creation.findUnique({
    where: { id },
    include: {
      user: true,
      annotations: { orderBy: { createdAt: "asc" } },
      comments: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!creation) notFound();

  const avgScore = (() => {
    const scores = creation.annotations
      .map((a) => {
        if (!a.aiScore) return null;
        try {
          return JSON.parse(a.aiScore as string).overallScore as number;
        } catch {
          return null;
        }
      })
      .filter((v): v is number => typeof v === "number");
    if (!scores.length) return null;
    return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  })();

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-orange-500/8 blur-[140px]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/gallery"
            className="flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            返回广场
          </Link>
          <div className="flex items-center gap-2">
            <ForkButton
              creationTitle={creation.title}
              annotations={creation.annotations.map((a) => ({
                lat: a.lat,
                lng: a.lng,
                title: a.title,
                content: a.content,
                buildingType: a.buildingType,
                aiScore: a.aiScore,
              }))}
            />
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {creation.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">
                {creation.user.nickname.slice(-1)}
              </AvatarFallback>
            </Avatar>
            <span>{creation.user.nickname}</span>
          </div>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(creation.createdAt).toLocaleString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {creation.annotations.length} 个标点
          </span>
          {avgScore != null && (
            <span className="flex items-center gap-1.5 text-orange-400">
              <Sparkles className="h-3.5 w-3.5" />
              AI 平均 {avgScore} 分
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="h-[60vh] min-h-[480px] lg:sticky lg:top-24 lg:self-start">
            <CreationDetailMap
              annotations={creation.annotations.map((a) => ({
                id: a.id,
                lat: a.lat,
                lng: a.lng,
                title: a.title,
                content: a.content,
                buildingType: a.buildingType,
                aiScore: a.aiScore,
              }))}
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <LikeButton
                creationId={creation.id}
                initialCount={creation._count.likes}
              />
            </div>

            <CommentSection
              creationId={creation.id}
              initialComments={creation.comments.map((c) => ({
                id: c.id,
                content: c.content,
                createdAt: c.createdAt,
                user: { id: c.user.id, nickname: c.user.nickname },
              }))}
            />
          </div>
        </div>
      </article>
    </main>
  );
}
