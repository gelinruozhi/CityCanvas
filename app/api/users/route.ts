import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  id: z.string().nullable().optional(),
  nickname: z.string().min(1).max(40),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "无效请求参数" },
        { status: 400 }
      );
    }

    const { id, nickname } = parsed.data;

    if (id) {
      const exists = await prisma.user.findUnique({ where: { id } });
      if (exists) {
        return NextResponse.json({ data: exists });
      }
    }

    const user = await prisma.user.create({
      data: { nickname },
    });

    return NextResponse.json({ data: user });
  } catch (err) {
    console.error("POST /api/users 失败:", err);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const json = await req.json();
    const parsed = z
      .object({ id: z.string(), nickname: z.string().min(1).max(40) })
      .safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "无效请求" }, { status: 400 });
    }
    const user = await prisma.user.update({
      where: { id: parsed.data.id },
      data: { nickname: parsed.data.nickname },
    });
    return NextResponse.json({ data: user });
  } catch (err) {
    console.error("PATCH /api/users 失败:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
