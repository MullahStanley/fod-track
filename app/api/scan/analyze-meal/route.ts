import { NextResponse } from "next/server";
import { analyzeMealPhoto, hasVisionKey } from "@/lib/vision";
import { resolveVisionAnalysis } from "@/lib/resolve";
import { VisionRequestSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/scan/analyze-meal
 * Body: { imageBase64, mimeType }
 * Server-side only: the Gemini key never reaches the client.
 */
export async function POST(req: Request) {
  if (!hasVisionKey()) {
    return NextResponse.json(
      { error: "Vision analysis unavailable", reason: "no_api_key" },
      { status: 503 }
    );
  }

  let parsed;
  try {
    parsed = VisionRequestSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeMealPhoto(parsed.data.imageBase64, parsed.data.mimeType);
    if (analysis.items.length === 0) {
      return NextResponse.json(
        {
          error: "Could not identify any food items in this photo",
          reason: "unidentifiable",
        },
        { status: 422 }
      );
    }
    const resolved = await resolveVisionAnalysis(analysis);
    return NextResponse.json({
      resolved,
      preview: analysis, // raw schema output for debugging/transparency
    });
  } catch (err) {
    console.error("[api/scan/analyze-meal] failed:", err);
    return NextResponse.json(
      { error: "Meal analysis failed", reason: "vision_error" },
      { status: 502 }
    );
  }
}
