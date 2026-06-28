import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function GET() {
  try {
    const [creations, annotations, comments, likes, evaluatedAgg] = await Promise.all([
      prisma.creation.count({ where: { isPublic: true } }),
      prisma.annotation.count(),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.annotation.count({ where: { aiScore: { not: null } } }),
    ]);

    return NextResponse.json(
      {
        data: {
          creations,
          annotations,
          comments,
          likes,
          evaluated: evaluatedAgg,
        },
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (err) {
    console.error("GET /api/stats 失败:", err);
    return NextResponse.json(
      {
        data: { creations: 0, annotations: 0, comments: 0, likes: 0, evaluated: 0 },
      },
      { status: 200 }
    );
  }
}
