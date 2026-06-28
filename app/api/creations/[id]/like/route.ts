import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  userId: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "无效请求" }, { status: 400 });
    }
    const { userId } = parsed.data;

    const existing = await prisma.like.findUnique({
      where: { creationId_userId: { creationId: id, userId } },
    });

    let liked: boolean;
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      await prisma.like.create({ data: { creationId: id, userId } });
      liked = true;
    }

    const count = await prisma.like.count({ where: { creationId: id } });
    return NextResponse.json({ data: { liked, count } });
  } catch (err) {
    console.error("POST /api/creations/[id]/like 失败:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    const count = await prisma.like.count({ where: { creationId: id } });
    let liked = false;
    if (userId) {
      const found = await prisma.like.findUnique({
        where: { creationId_userId: { creationId: id, userId } },
      });
      liked = Boolean(found);
    }
    return NextResponse.json({ data: { liked, count } });
  } catch (err) {
    console.error("GET /api/creations/[id]/like 失败:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
