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
    // 不返回假 0 数据掩盖故障，让前端 react-query 走重试/错误态
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
