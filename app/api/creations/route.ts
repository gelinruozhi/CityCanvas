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
  shape: z.enum(["point", "circle", "rect"]).default("point"),
  radius: z.number().positive().max(2000).optional(),
  bounds: z
    .object({
      sw: z.tuple([z.number(), z.number()]),
      ne: z.tuple([z.number(), z.number()]),
    })
    .optional(),
  buildingName: z.string().max(60).optional(),
  floor: z.string().max(10).optional(),
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
            shape: a.shape,
            radius: a.radius,
            bounds: a.bounds ? JSON.stringify(a.bounds) : null,
            buildingName: a.buildingName,
            floor: a.floor,
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
    const take = Math.min(
      parseInt(url.searchParams.get("limit") ?? "30", 10) || 30,
      60
    );
    const cursor = url.searchParams.get("cursor");

    // 加 id 兜底排序，保证 cursor 分页顺序稳定
    const orderBy =
      sort === "hot"
        ? [{ likes: { _count: "desc" as const } }, { id: "desc" as const }]
        : [{ createdAt: "desc" as const }, { id: "desc" as const }];

    const creations = await prisma.creation.findMany({
      where: { isPublic: true },
      orderBy,
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: true,
        annotations: true,
        _count: { select: { likes: true, comments: true } },
      },
    });

    return NextResponse.json(
      {
        data: creations,
        nextCursor:
          creations.length === take
            ? creations[creations.length - 1].id
            : null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("GET /api/creations 失败:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
