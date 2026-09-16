/**
 * Gemini multimodal vision handler.
 *
 * Pipeline: client compresses photo (JPEG/WebP, ≤1024px) → this module sends
 * the base64 image to Gemini with a STRICT JSON schema forcing decomposition
 * into weighed components (no raw calorie guessing) → deterministic macros
 * are computed downstream against the food database.
 */
import type { VisionMealAnalysis } from "./types";

const VISION_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are a nutritional vision analyst. Analyze the meal photo and respond ONLY with JSON matching this exact schema:

{
  "meal_name": string,
  "suspected_hidden_fats": boolean,
  "items": [
    { "name": string, "estimated_grams": number, "confidence": number }
  ],
  "cooking_fats_or_extras": [
    { "name": string, "grams": number, "reason": string }
  ]
}

Rules:
- NEVER output calories or macros. Only component names, estimated gram weights, and confidence (0-1).
- Decompose the plate into distinct identifiable components (e.g. "grilled chicken breast", "white rice", "steamed broccoli").
- estimated_grams: realistic portion weight based on visual cues (plate size, reference objects).
- confidence: your visual identification confidence, 0 to 1.
- suspected_hidden_fats: true if you see gloss/oil sheen, fried surfaces, dressings, butter, cheese sauces, or oily residue.
- cooking_fats_or_extras: list likely INVISIBLE additions (cooking oil, butter, sugar in sauces, dressings) with estimated grams and a short reason. Empty array if none plausible.
- If the photo is not food or is unanalyzable, return items: [] and meal_name: "Unidentified".`;

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  error?: { message?: string };
}

export function hasVisionKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function extractJson(text: string): unknown {
  // Strip markdown code fences if the model adds them despite instructions.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model output");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, v));
}

function coerceAnalysis(data: unknown): VisionMealAnalysis {
  const d = (data ?? {}) as Record<string, unknown>;
  const items = Array.isArray(d.items) ? d.items : [];
  const extras = Array.isArray(d.cooking_fats_or_extras)
    ? d.cooking_fats_or_extras
    : [];

  return {
    meal_name:
      typeof d.meal_name === "string" && d.meal_name.trim()
        ? d.meal_name.trim().slice(0, 120)
        : "Unidentified meal",
    suspected_hidden_fats: d.suspected_hidden_fats === true,
    items: items
      .map((raw) => {
        const it = (raw ?? {}) as Record<string, unknown>;
        return {
          name:
            typeof it.name === "string" && it.name.trim()
              ? it.name.trim().slice(0, 120)
              : "Unknown item",
          estimated_grams: clamp(it.estimated_grams, 1, 3000, 100),
          confidence: clamp(it.confidence, 0, 1, 0.5),
        };
      })
      .slice(0, 20),
    cooking_fats_or_extras: extras
      .map((raw) => {
        const e = (raw ?? {}) as Record<string, unknown>;
        return {
          name:
            typeof e.name === "string" && e.name.trim()
              ? e.name.trim().slice(0, 120)
              : "Unknown extra",
          grams: clamp(e.grams, 1, 500, 14),
          reason:
            typeof e.reason === "string" ? e.reason.slice(0, 200) : "Likely added during cooking",
        };
      })
      .slice(0, 8),
  };
}

/**
 * Analyze a base64-encoded image (JPEG or WebP, ≤1024px as compressed client-side).
 * Throws on auth/config errors; returns a coerced, schema-valid analysis otherwise.
 */
export async function analyzeMealPhoto(
  base64Image: string,
  mimeType: "image/jpeg" | "image/webp" = "image/jpeg"
): Promise<VisionMealAnalysis> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${key}`;

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          {
            text: "Analyze this meal photo. Respond with JSON only, per the schema.",
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1200,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("Gemini API rejected the key (check GEMINI_API_KEY)");
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("") ?? "";

  if (!text.trim()) {
    throw new Error("Gemini returned an empty response");
  }

  return coerceAnalysis(extractJson(text));
}
