import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  userId: z.string().min(1),
  content: z.string().min(1).max(500),
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

    const creation = await prisma.creation.findUnique({ where: { id } });
    if (!creation) {
      return NextResponse.json({ error: "作品不存在" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
    });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        creationId: id,
        userId: parsed.data.userId,
        content: parsed.data.content,
      },
      include: { user: true },
    });

    return NextResponse.json({ data: comment });
  } catch (err) {
    console.error("POST /api/creations/[id]/comments 失败:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await prisma.comment.findMany({
      where: { creationId: id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ data: comments });
  } catch (err) {
    console.error("GET /api/creations/[id]/comments 失败:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
