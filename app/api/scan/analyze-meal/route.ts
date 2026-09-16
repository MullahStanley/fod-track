import { NextResponse } from "next/server";
import { analyzeMealPhoto, hasVisionKey } from "@/lib/vision";
import {
  hasOllama,
  analyzeMealPhotoOllama,
  checkOllamaStatus,
} from "@/lib/vision-ollama";
import { resolveVisionAnalysis } from "@/lib/resolve";
import { VisionRequestSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/scan/analyze-meal
 * Body: { imageBase64, mimeType }
 *
 * Provider selection: Ollama (local, free, no key) when OLLAMA_BASE_URL is
 * set; otherwise Gemini (cloud free tier) when GEMINI_API_KEY is set. If
 * Ollama is primary but fails and a Gemini key exists, we transparently
 * fall back. Hosts/keys stay server-side.
 */
export async function POST(req: Request) {
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
  const { imageBase64, mimeType } = parsed.data;

  if (!hasOllama() && !hasVisionKey()) {
    return NextResponse.json(
      {
        error:
          "Vision analysis unavailable — configure OLLAMA_BASE_URL (local, free) or GEMINI_API_KEY (cloud).",
        reason: "no_provider",
      },
      { status: 503 }
    );
  }

  try {
    let analysis;
    let provider: "ollama" | "gemini";

    if (hasOllama()) {
      try {
        analysis = await analyzeMealPhotoOllama(imageBase64, mimeType);
        provider = "ollama";
      } catch (ollamaErr) {
        console.error("[analyze-meal] Ollama failed:", ollamaErr);
        if (hasVisionKey()) {
          analysis = await analyzeMealPhoto(imageBase64, mimeType);
          provider = "gemini";
        } else {
          const status = await checkOllamaStatus();
          return NextResponse.json(
            {
              error: `Local vision model unavailable: ${status.detail}`,
              reason: "ollama_unavailable",
            },
            { status: 502 }
          );
        }
      }
    } else {
      analysis = await analyzeMealPhoto(imageBase64, mimeType);
      provider = "gemini";
    }

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
    return NextResponse.json({ resolved, provider });
  } catch (err) {
    console.error("[api/scan/analyze-meal] failed:", err);
    return NextResponse.json(
      { error: "Meal analysis failed", reason: "vision_error" },
      { status: 502 }
    );
  }
}
