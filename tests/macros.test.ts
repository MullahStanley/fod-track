import { describe, it, expect } from "vitest";
import {
  barcodeToFoodItem,
  searchResultToFoodItem,
  resolveVisionAnalysis,
} from "../lib/resolve";
import {
  searchSeedFoods,
  findSeedFoodByName,
  getSeedFoodCount,
} from "../lib/seed-foods";
import {
  searchKenyaFoods,
  findKenyaFoodByName,
  getKenyaFoodCount,
} from "../lib/foods-kenya";
import { itemMacros, itemsTotals } from "../lib/client-utils";
import type {
  BarcodeProduct,
  FoodSearchResult,
  VisionMealAnalysis,
} from "../lib/types";

const CHICKEN_RESULT: FoodSearchResult = {
  name: "Chicken Breast, grilled, skinless",
  per100g: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  servingGrams: 150,
  source: "seed",
};

const MILK_PRODUCT: BarcodeProduct = {
  barcode: "0041663100056",
  name: "Whole Milk",
  brand: "Generic Dairy",
  serving: { grams: 244, kcal: 149, protein: 7.7, carbs: 11.7, fat: 8.0 },
};

describe("barcodeToFoodItem", () => {
  it("normalizes per-serving values to per-100g and scales grams by multiplier", () => {
    const item = barcodeToFoodItem(MILK_PRODUCT, 2);
    expect(item.source).toBe("barcode");
    expect(item.barcode).toBe("0041663100056");
    expect(item.servingGrams).toBe(244);
    expect(item.grams).toBe(488); // 244 × 2
    expect(item.per100g.kcal).toBe(Math.round((149 / 244) * 100)); // 61
    expect(item.per100g.protein).toBeCloseTo(7.7 / 2.44, 1);
  });

  it("0.5× multiplier halves grams", () => {
    const item = barcodeToFoodItem(MILK_PRODUCT, 0.5);
    expect(item.grams).toBe(122);
  });

  it("computed macros from the item match the product serving at 1×", () => {
    const item = barcodeToFoodItem(MILK_PRODUCT, 1);
    const m = itemMacros(item);
    expect(m.kcal).toBe(149);
    expect(m.protein).toBe(8); // 7.7 → rounded
  });
});

describe("searchResultToFoodItem", () => {
  it("defaults grams to the serving size when known", () => {
    const item = searchResultToFoodItem(CHICKEN_RESULT);
    expect(item.grams).toBe(150);
    expect(item.source).toBe("search");
    expect(item.per100g).toEqual(CHICKEN_RESULT.per100g);
  });

  it("falls back to 100g when no serving size exists", () => {
    const item = searchResultToFoodItem({ ...CHICKEN_RESULT, servingGrams: null });
    expect(item.grams).toBe(100);
  });

  it("honors an explicit gram override", () => {
    const item = searchResultToFoodItem(CHICKEN_RESULT, 220);
    expect(item.grams).toBe(220);
  });
});

describe("kenyan local food database", () => {
  it("contains a meaningful local foods table", () => {
    expect(getKenyaFoodCount()).toBeGreaterThanOrEqual(50);
  });

  it("finds staples by Swahili and sheng names", () => {
    const results = searchKenyaFoods("sima");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name.toLowerCase()).toContain("ugali");
    expect(results[0].brand).toBe("Local (Kenya)");
  });

  it("resolves sukuma wiki preparations", () => {
    const results = searchKenyaFoods("sukuma");
    expect(results.length).toBeGreaterThanOrEqual(3); // sauteed, steamed, fried
  });

  it("scores exact word matches above prefixes", () => {
    const results = searchKenyaFoods("ugali");
    expect(results[0].name.toLowerCase()).toContain("ugali");
  });

  it("finds nyama choma by alternate name", () => {
    const results = searchKenyaFoods("choma");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toMatch(/Nyama Choma/i);
  });

  it("resolves vision-style names to local foods", () => {
    const match = findKenyaFoodByName("ugali with sukuma");
    expect(match).not.toBeNull();
    expect(match!.per100g.kcal).toBeGreaterThan(0);
  });

  it("returns empty for gibberish", () => {
    expect(searchKenyaFoods("zzzqqqxyzzy")).toEqual([]);
  });
});

describe("seed food database", () => {
  it("contains a meaningful offline fallback table", () => {
    expect(getSeedFoodCount()).toBeGreaterThanOrEqual(40);
  });

  it("finds foods by substring across terms", () => {
    const results = searchSeedFoods("chicken breast");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toMatch(/Chicken Breast/i);
  });

  it("ranks prefix matches first", () => {
    const results = searchSeedFoods("chick");
    expect(results[0].name.toLowerCase()).toContain("chick");
  });

  it("returns empty for empty/whitespace queries", () => {
    expect(searchSeedFoods("")).toEqual([]);
    expect(searchSeedFoods("   ")).toEqual([]);
  });

  it("resolves vision-style ingredient names to a nearest match", () => {
    const match = findSeedFoodByName("grilled chicken");
    expect(match).not.toBeNull();
    expect(match!.per100g.kcal).toBeGreaterThan(0);
  });

  it("returns null for gibberish with no plausible match", () => {
    expect(findSeedFoodByName("zzzqqqxyzzy")).toBeNull();
  });
});

describe("resolveVisionAnalysis", () => {
  const analysis: VisionMealAnalysis = {
    meal_name: "Chicken and rice plate",
    suspected_hidden_fats: true,
    items: [
      { name: "grilled chicken breast", estimated_grams: 180, confidence: 0.9 },
      { name: "zzzqqqxyzzy", estimated_grams: 50, confidence: 0.3 },
    ],
    cooking_fats_or_extras: [{ name: "olive oil", grams: 14, reason: "gloss sheen" }],
  };

  it("resolves known items against the database with deterministic macros", async () => {
    const resolved = await resolveVisionAnalysis(analysis);
    const chicken = resolved.items[0];
    expect(chicken.source).toBe("vision");
    expect(chicken.grams).toBe(180);
    expect(chicken.per100g.kcal).toBe(165);
    // 180g × 165 kcal/100g = 297
    expect(itemMacros(chicken).kcal).toBe(297);
  });

  it("keeps unresolved items as 0-macro placeholders and reports them", async () => {
    const resolved = await resolveVisionAnalysis(analysis);
    expect(resolved.unresolvedNames).toContain("zzzqqqxyzzy");
    const ghost = resolved.items.find((i) => i.name === "zzzqqqxyzzy");
    expect(ghost).toBeDefined();
    expect(ghost!.per100g.kcal).toBe(0);
  });

  it("applies pure-fat values to unresolvable hidden extras", async () => {
    const resolved = await resolveVisionAnalysis({
      ...analysis,
      cooking_fats_or_extras: [{ name: "zzzqqqxyzzy fat", grams: 10, reason: "residue" }],
    });
    const extra = resolved.items.find((i) => i.source === "hidden_extra");
    expect(extra).toBeDefined();
    expect(extra!.per100g).toEqual({ kcal: 884, protein: 0, carbs: 0, fat: 100 });
  });

  it("propagates the hidden-fats flag and meal name", async () => {
    const resolved = await resolveVisionAnalysis(analysis);
    expect(resolved.suspectedHiddenFats).toBe(true);
    expect(resolved.mealName).toBe("Chicken and rice plate");
  });

  it("round-trips: resolved items sum to expected meal calories", async () => {
    const resolved = await resolveVisionAnalysis(analysis);
    const totals = itemsTotals(resolved.items);
    const chicken = resolved.items[0];
    const oil = resolved.items.find((i) => i.source === "hidden_extra")!;
    // 297 (chicken) + 124 (14g oil) ± rounding of ghost item (0)
    expect(totals.kcal).toBe(itemMacros(chicken).kcal + itemMacros(oil).kcal);
  });
});

describe("client macro math (itemMacros/itemsTotals)", () => {
  it("computes per-item macros from grams", () => {
    const m = itemMacros({
      id: "x",
      name: "Rice",
      per100g: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      servingMultiplier: 1,
      servingGrams: 158,
      grams: 200,
      source: "search",
    });
    expect(m.kcal).toBe(260);
    expect(m.protein).toBe(5); // 5.4 → 5
    expect(m.carbs).toBe(56);
    expect(m.fat).toBe(1); // 0.6 → 1
  });

  it("sums multi-item meals and matches server-side math", () => {
    const items = [
      { grams: 150, per100g: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 } },
      { grams: 14, per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 } },
    ];
    const client = itemsTotals(
      items.map((i, idx) => ({
        id: `i${idx}`,
        name: `item${idx}`,
        per100g: i.per100g,
        servingMultiplier: 1,
        servingGrams: null,
        grams: i.grams,
        source: "vision" as const,
      }))
    );
    const server = sumServerSide(items);
    expect(client).toEqual(server);
  });
});

/** Mirror of lib/repo-logs computeTotals (per-item rounding) to prove client/server parity. */
function sumServerSide(
  items: Array<{ grams: number; per100g: { kcal: number; protein: number; carbs: number; fat: number } }>
) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0;
  for (const it of items) {
    const f = it.grams / 100;
    kcal += Math.round(it.per100g.kcal * f);
    protein += Math.round(it.per100g.protein * f);
    carbs += Math.round(it.per100g.carbs * f);
    fat += Math.round(it.per100g.fat * f);
  }
  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}
