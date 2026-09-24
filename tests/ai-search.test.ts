import { describe, expect, it } from "vitest";
import { searchFoods, searchResultToFoodItem } from "../lib/resolve";
import { searchAiFoods } from "../lib/ai-food-search";
import { itemMacros } from "../lib/client-utils";

describe("searchFoods with multi-tier & local language support", () => {
  it("finds traditional Kenyan local dishes by local name", async () => {
    const mursik = await searchFoods("mursik", { includeOnline: false, useAiFallback: false });
    expect(mursik.length).toBeGreaterThan(0);
    expect(mursik[0].name.toLowerCase()).toContain("mursik");
    expect(mursik[0].source).toBe("local");
  });

  it("finds traditional Luo dish aliadho", async () => {
    const aliadho = await searchFoods("aliadho", { includeOnline: false, useAiFallback: false });
    expect(aliadho.length).toBeGreaterThan(0);
    expect(aliadho[0].name.toLowerCase()).toContain("aliadho");
  });

  it("finds traditional Luhya dish ingokho", async () => {
    const ingokho = await searchFoods("ingokho", { includeOnline: false, useAiFallback: false });
    expect(ingokho.length).toBeGreaterThan(0);
    expect(ingokho[0].name.toLowerCase()).toContain("ingokho");
  });

  it("finds traditional greens terere and mrenda", async () => {
    const terere = await searchFoods("terere", { includeOnline: false, useAiFallback: false });
    expect(terere.length).toBeGreaterThan(0);
    expect(terere[0].name.toLowerCase()).toContain("terere");

    const mrenda = await searchFoods("mrenda", { includeOnline: false, useAiFallback: false });
    expect(mrenda.length).toBeGreaterThan(0);
    expect(mrenda[0].name.toLowerCase()).toContain("mrenda");
  });

  it("returns empty for 1-char or blank AI search queries without crashing", async () => {
    const empty = await searchAiFoods("");
    expect(empty).toEqual([]);
    const single = await searchAiFoods("a");
    expect(single).toEqual([]);
  });

  it("converts AI search result into FoodItem preserving provenance and local origin", () => {
    const item = searchResultToFoodItem({
      name: "Mursik (Fermented Kalenjin Milk)",
      brand: undefined,
      per100g: { kcal: 65, protein: 3.3, carbs: 4.5, fat: 3.6 },
      servingGrams: 250,
      source: "ai",
      localOrigin: "Rift Valley / Kalenjin",
      culturalNotes: "Traditional fermented milk aged in a gourd seasoned with soot",
    }, 250);

    expect(item.source).toBe("ai");
    expect(item.localOrigin).toBe("Rift Valley / Kalenjin");
    expect(item.culturalNotes).toContain("fermented milk");
    expect(item.grams).toBe(250);
    // 250g of 65 kcal/100g = 163 kcal
    expect(itemMacros(item).kcal).toBe(163);
  });
});
