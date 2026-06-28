import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const BUILDING_TYPE_VALUES = [
  "teaching",
  "library",
  "dorm",
  "canteen",
  "gym",
  "culture",
  "lab",
  "field",
  "court",
  "park",
  "plaza",
  "parking",
  "cafe",
  "store",
  "studyroom",
  "logistics",
  "bench",
  "lamp",
  "bike",
  "vending",
  "art",
  "other",
] as const;

const annotationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  title: z.string().min(1).max(40),
  content: z.string().min(1).max(500),
  buildingType: z.enum(BUILDING_TYPE_VALUES),
  aiScore: z.unknown().nullable(),
});

const bodySchema = z.object({
  userId: z.string(),
  title: z.string().min(1).max(60),
  mapView: z.object({
    center: z.tuple([z.number(), z.number()]),
    zoom: z.number(),
  }),
  annotations: z.array(annotationSchema).min(1).max(50),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", detail: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { userId, title, mapView, annotations } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const creation = await prisma.creation.create({
      data: {
        userId,
        title,
        mapView: JSON.stringify(mapView),
        annotations: {
          create: annotations.map((a) => ({
            lat: a.lat,
            lng: a.lng,
            title: a.title,
            content: a.content,
            buildingType: a.buildingType,
            aiScore: a.aiScore ? JSON.stringify(a.aiScore) : null,
          })),
        },
      },
      include: { annotations: true, user: true },
    });

    return NextResponse.json({ data: creation });
  } catch (err) {
    console.error("POST /api/creations 失败:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sort = url.searchParams.get("sort") ?? "latest";
    const take = Math.min(parseInt(url.searchParams.get("limit") ?? "30", 10), 60);

    const orderBy =
      sort === "hot"
        ? { likes: { _count: "desc" as const } }
        : { createdAt: "desc" as const };

    const creations = await prisma.creation.findMany({
      where: { isPublic: true },
      orderBy,
      take,
      include: {
        user: true,
        annotations: true,
        _count: { select: { likes: true, comments: true } },
      },
    });

    return NextResponse.json({ data: creations });
  } catch (err) {
    console.error("GET /api/creations 失败:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
