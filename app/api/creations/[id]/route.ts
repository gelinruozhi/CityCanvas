import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const creation = await prisma.creation.findUnique({
      where: { id },
      include: {
        user: true,
        annotations: { orderBy: { createdAt: "asc" } },
        comments: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });
    if (!creation) {
      return NextResponse.json({ error: "作品不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: creation });
  } catch (err) {
    console.error("GET /api/creations/[id] 失败:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
