/**
 * AI-powered food & nutrition search engine.
 * Translates Kenyan local languages (Swahili, Sheng, Kikuyu, Luo, Luhya, Kalenjin, Kamba, etc.)
 * and calculates realistic, scientifically grounded per-100g nutrition when dishes are
 * not present in static database tables or when online databases lack values.
 */
import type { FoodSearchResult } from "./types";

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const startArr = raw.indexOf("[");
  const startObj = raw.indexOf("{");

  if (startArr !== -1 && (startObj === -1 || startArr < startObj)) {
    const endArr = raw.lastIndexOf("]");
    if (endArr > startArr) {
      return JSON.parse(raw.slice(startArr, endArr + 1));
    }
  }

  if (startObj !== -1) {
    const endObj = raw.lastIndexOf("}");
    if (endObj > startObj) {
      return JSON.parse(raw.slice(startObj, endObj + 1));
    }
  }

  throw new Error("No valid JSON array or object found in model output");
}

const AI_SEARCH_CACHE = new Map<string, FoodSearchResult[]>();
const MAX_CACHE_ENTRIES = 250;

export function hasAiFoodSearch(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.OLLAMA_BASE_URL);
}

function getAiModel(): string {
  const m = process.env.GEMINI_VISION_MODEL;
  if (!m || m === "gemini-3-flash" || m === "gemini-2.5-flash") {
    return "gemini-3.6-flash";
  }
  return m;
}

const AI_SEARCH_SYSTEM_PROMPT = `You are an expert East African and Kenyan nutritionist and culinary linguist.
Your role is to interpret food queries that may be written in Kenyan local languages (Swahili, Sheng, Kikuyu, Luo, Luhya, Kalenjin, Kamba, Mijikenda, Meru, etc.) or informal vernacular descriptions.

When given a food or dish name:
1. Translate & identify the dish or its primary components (e.g. "mursik", "aliadho", "kuon anang'a", "ingokho", "mukimo", "matoke", "kamande", "mayai boiro", "kaimati", "terere", "choma").
2. Specify the local origin or cultural community in Kenya/East Africa.
3. Provide a concise description of what the dish is and customary cooking style.
4. Calculate realistic, scientifically grounded nutrition per 100g edible portion based on East African Food Composition Tables and culinary science:
   - kcal (integer, typically 20 to 900)
   - protein (grams, 1 decimal, 0 to 100)
   - carbs (grams, 1 decimal, 0 to 100)
   - fat (grams, 1 decimal, 0 to 100)
5. Provide typical single-serving portion in grams (servingGrams).

Respond ONLY with a JSON array matching this schema:
[
  {
    "name": string,
    "localOrigin": string,
    "description": string,
    "servingGrams": number,
    "per100g": {
      "kcal": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  }
]

If the query is not food or completely uninterpretable, return [].`;

interface RawAiFood {
  name?: string;
  localOrigin?: string;
  description?: string;
  servingGrams?: number;
  per100g?: {
    kcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, v));
}

function parseAiResponse(rawJson: unknown, limit = 5): FoodSearchResult[] {
  const list = Array.isArray(rawJson)
    ? (rawJson as RawAiFood[])
    : rawJson && typeof rawJson === "object" && "items" in rawJson && Array.isArray((rawJson as { items: unknown[] }).items)
      ? ((rawJson as { items: RawAiFood[] }).items)
      : [];

  const out: FoodSearchResult[] = [];
  for (const item of list.slice(0, limit)) {
    if (!item || typeof item.name !== "string" || !item.name.trim()) continue;

    const p = item.per100g ?? {};
    const kcal = Math.round(clamp(p.kcal, 0, 900, 100));
    const protein = round1(clamp(p.protein, 0, 100, 5));
    const carbs = round1(clamp(p.carbs, 0, 100, 15));
    const fat = round1(clamp(p.fat, 0, 100, 2));
    const servingGrams = Math.round(clamp(item.servingGrams, 10, 2000, 150));

    out.push({
      name: item.name.trim(),
      localOrigin: item.localOrigin?.trim() || undefined,
      culturalNotes: item.description?.trim() || undefined,
      per100g: { kcal, protein, carbs, fat },
      servingGrams,
      source: "ai",
    });
  }

  return out;
}

/**
 * Query Gemini model for local language / missing food nutrition.
 */
async function searchWithGemini(query: string, limit = 5): Promise<FoodSearchResult[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return [];

  const model = getAiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const body = {
    system_instruction: { parts: [{ text: AI_SEARCH_SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analyze and calculate nutrition for this Kenyan / East African food query (may be in local language, Sheng, or regional dialect): "${query}". Respond with JSON array only.`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1000,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(18000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.warn(`[searchWithGemini] HTTP ${res.status}: ${errText.slice(0, 150)}`);
    return [];
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) return [];

  try {
    const parsed = extractJson(text);
    return parseAiResponse(parsed, limit);
  } catch (err) {
    console.warn("[searchWithGemini] Failed to parse JSON:", err);
    return [];
  }
}

/**
 * Query local Ollama model for local language food translation & nutrition.
 */
async function searchWithOllama(query: string, limit = 5): Promise<FoodSearchResult[]> {
  const base = process.env.OLLAMA_BASE_URL?.replace(/\/$/, "");
  if (!base) return [];

  const model = process.env.OLLAMA_VISION_MODEL || "qwen2.5vl:7b";
  const url = `${base}/api/chat`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: AI_SEARCH_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze and calculate nutrition for this Kenyan / East African food query (may be in local language, Sheng, or regional dialect): "${query}". Respond with JSON array only.`,
        },
      ],
      stream: false,
      format: "json",
      options: {
        temperature: 0.2,
        num_predict: 1000,
      },
    }),
    signal: AbortSignal.timeout(35000),
  });

  if (!res.ok) return [];
  const data = (await res.json()) as { message?: { content?: string } };
  const text = data.message?.content ?? "";
  if (!text.trim()) return [];

  try {
    const parsed = extractJson(text);
    return parseAiResponse(parsed, limit);
  } catch {
    return [];
  }
}

/**
 * Search foods using AI models when static databases lack values or the dish is
 * written in a local language (Swahili, Sheng, Kikuyu, Luo, Luhya, Kalenjin, etc.).
 */
export async function searchAiFoods(query: string, limit = 5): Promise<FoodSearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  // Check in-memory cache first for instant response
  const cached = AI_SEARCH_CACHE.get(q);
  if (cached) {
    return cached.slice(0, limit);
  }

  let results: FoodSearchResult[] = [];

  // Prefer Gemini if key is configured, fallback to Ollama
  if (process.env.GEMINI_API_KEY) {
    try {
      results = await searchWithGemini(query, limit);
    } catch (err) {
      console.warn("[searchAiFoods] Gemini search failed, checking Ollama:", err);
    }
  }

  if (results.length === 0 && process.env.OLLAMA_BASE_URL) {
    try {
      results = await searchWithOllama(query, limit);
    } catch (err) {
      console.warn("[searchAiFoods] Ollama search failed:", err);
    }
  }

  if (results.length > 0) {
    if (AI_SEARCH_CACHE.size >= MAX_CACHE_ENTRIES) {
      const firstKey = AI_SEARCH_CACHE.keys().next().value;
      if (firstKey) AI_SEARCH_CACHE.delete(firstKey);
    }
    AI_SEARCH_CACHE.set(q, results);
  }

  return results.slice(0, limit);
}
