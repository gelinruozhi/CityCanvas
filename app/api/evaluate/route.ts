import { NextResponse } from "next/server";
import { z } from "zod";
import { hasApiKey } from "@/lib/ai/anthropic";
import { evaluateAnnotation } from "@/lib/ai/evaluator";

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
  x: z.number(),
  y: z.number(),
  title: z.string().min(1).max(60),
  content: z.string().min(1).max(800),
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
});

const buildingRefSchema = z.object({
  name: z.string(),
  dist: z.number(),
});

const bodySchema = z.object({
  annotation: annotationSchema,
  siblings: z.array(annotationSchema.omit({ content: true })).default([]),
  nearbyBuildings: z.array(buildingRefSchema).default([]),
  zone: z.string().default(""),
});

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!hasApiKey) {
    return NextResponse.json(
      { error: "服务端未配置 AI_GATEWAY_API_KEY" },
      { status: 503 }
    );
  }
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", detail: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const score = await evaluateAnnotation(parsed.data);
    return NextResponse.json({ data: score });
  } catch (err) {
    console.error("POST /api/evaluate 失败:", err);
    const msg = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "AI 评估失败", detail: msg },
      { status: 500 }
    );
  }
}
