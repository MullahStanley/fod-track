/**
 * Ollama vision handler — free, local, no API key.
 *
 * Uses Ollama's /api/chat with a base64 image and a strict JSON instruction.
 * Same output contract as the Gemini provider: the model decomposes the plate
 * into weighed components (names + grams + confidence) and NEVER outputs
 * calories. Deterministic macros are computed downstream (lib/resolve.ts).
 *
 * Recommended models:
 *   ollama pull qwen2.5vl:7b        (best instruction/JSON adherence)
 *   ollama pull llama3.2-vision:11b (alternative)
 *
 * Configure with OLLAMA_BASE_URL (default http://127.0.0.1:11434).
 */
import { VISION_SYSTEM_PROMPT, coerceAnalysis, extractJson } from "./vision";
import type { VisionMealAnalysis } from "./types";

export function ollamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
}

export function ollamaVisionModel(): string {
  return process.env.OLLAMA_VISION_MODEL || "qwen2.5vl:7b";
}

/** Ollama is available when OLLAMA_BASE_URL is set (explicit opt-in). */
export function hasOllama(): boolean {
  return Boolean(process.env.OLLAMA_BASE_URL);
}

interface OllamaChatResponse {
  message?: { content?: string };
  error?: string;
}

/**
 * Analyze a base64-encoded image (JPEG, ≤1024px as compressed client-side).
 * Throws on connection/config errors; returns a coerced analysis otherwise.
 */
export async function analyzeMealPhotoOllama(
  base64Image: string,
  _mimeType: "image/jpeg" | "image/webp" = "image/jpeg"
): Promise<VisionMealAnalysis> {
  const base = ollamaBaseUrl().replace(/\/$/, "");
  const model = ollamaVisionModel();

  // Ollama wants RAW base64 — strip any data-URL prefix defensively.
  const rawBase64 = base64Image.replace(/^data:[^;]+;base64,/, "");

  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: "Analyze this meal photo. Respond with JSON only, per the schema.",
          images: [rawBase64],
        },
      ],
      stream: false,
      format: "json", // constrain output to a JSON object
      options: {
        temperature: 0.2,
        num_predict: 1200,
        // Leave headroom above the image tokens + prompt.
        num_ctx: 8192,
      },
    }),
    signal: AbortSignal.timeout(120000), // local models are slower; 2 min cap
  });

  if (res.status === 404) {
    throw new Error(
      `Ollama model "${model}" not found. Pull it first: ollama pull ${model}`
    );
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Ollama error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as OllamaChatResponse;
  if (data.error) throw new Error(`Ollama error: ${data.error}`);

  const text = data.message?.content ?? "";
  if (!text.trim()) throw new Error("Ollama returned an empty response");

  return coerceAnalysis(extractJson(text));
}

/**
 * Lightweight availability probe — checks the daemon and whether the
 * configured model is pulled. Used for a clear setup error message.
 */
export async function checkOllamaStatus(): Promise<{
  ok: boolean;
  detail: string;
}> {
  try {
    const res = await fetch(`${ollamaBaseUrl().replace(/\/$/, "")}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ok: false, detail: `Ollama responded ${res.status}` };
    const tags = (await res.json()) as { models?: Array<{ name: string }> };
    const model = ollamaVisionModel();
    const names = (tags.models ?? []).map((m) => m.name);
    const pulled = names.some(
      (n) => n === model || n.split(":")[0] === model.split(":")[0]
    );
    return pulled
      ? { ok: true, detail: `${model} ready` }
      : { ok: false, detail: `Model "${model}" not pulled. Run: ollama pull ${model}` };
  } catch {
    return {
      ok: false,
      detail: `Ollama not reachable at ${ollamaBaseUrl()}. Install from https://ollama.com and run: ollama pull ${ollamaVisionModel()}`,
    };
  }
}
