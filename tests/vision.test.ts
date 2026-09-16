import { describe, it, expect, vi, afterEach } from "vitest";
import { extractJson, coerceAnalysis } from "../lib/vision";
import { ollamaBaseUrl, ollamaVisionModel } from "../lib/vision-ollama";

describe("extractJson", () => {
  it("parses plain JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips markdown fences", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("extracts the outermost object from surrounding chatter", () => {
    const text = 'Sure! {"meal_name":"x","items":[]} hope that helps';
    expect(extractJson(text)).toEqual({ meal_name: "x", images: undefined, items: [] });
  });
});

describe("coerceAnalysis", () => {
  it("coerces a valid analysis", () => {
    const a = coerceAnalysis({
      meal_name: "Plate",
      suspected_hidden_fats: true,
      items: [{ name: "Ugali", estimated_grams: 300, confidence: 0.9 }],
      cooking_fats_or_extras: [{ name: "oil", grams: 14, reason: "sheen" }],
    });
    expect(a.meal_name).toBe("Plate");
    expect(a.items[0].estimated_grams).toBe(300);
    expect(a.items[0].confidence).toBe(0.9);
    expect(a.suspected_hidden_fats).toBe(true);
    expect(a.cooking_fats_or_extras[0].grams).toBe(14);
  });

  it("clamps extreme gram and confidence values", () => {
    const a = coerceAnalysis({
      meal_name: "x",
      items: [{ name: "thing", estimated_grams: 99999, confidence: 7 }],
      cooking_fats_or_extras: [],
    });
    expect(a.items[0].estimated_grams).toBe(3000); // clamp max
    expect(a.items[0].confidence).toBe(1); // clamp max
  });

  it("falls back to safe defaults for missing/garbage fields", () => {
    const a = coerceAnalysis({ items: "not-an-array", meal_name: "" });
    expect(a.items).toEqual([]);
    expect(a.meal_name).toBe("Unidentified meal");
    expect(a.suspected_hidden_fats).toBe(false);
  });

  it("caps items at 20 and extras at 8", () => {
    const manyItems = Array.from({ length: 30 }, (_, i) => ({
      name: `i${i}`,
      estimated_grams: 100,
      confidence: 0.5,
    }));
    const manyExtras = Array.from({ length: 12 }, (_, i) => ({
      name: `e${i}`,
      grams: 5,
      reason: "r",
    }));
    const a = coerceAnalysis({ meal_name: "m", items: manyItems, cooking_fats_or_extras: manyExtras });
    expect(a.items.length).toBe(20);
    expect(a.cooking_fats_or_extras.length).toBe(8);
  });
});

describe("ollama config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses default base URL and model", () => {
    vi.stubEnv("OLLAMA_BASE_URL", "");
    vi.stubEnv("OLLAMA_VISION_MODEL", "");
    expect(ollamaBaseUrl()).toBe("http://127.0.0.1:11434");
    expect(ollamaVisionModel()).toBe("qwen2.5vl:7b");
  });

  it("reads env overrides", () => {
    vi.stubEnv("OLLAMA_BASE_URL", "http://gpu-box.lan:11434");
    vi.stubEnv("OLLAMA_VISION_MODEL", "llama3.2-vision:11b");
    expect(ollamaBaseUrl()).toBe("http://gpu-box.lan:11434");
    expect(ollamaVisionModel()).toBe("llama3.2-vision:11b");
  });
});
