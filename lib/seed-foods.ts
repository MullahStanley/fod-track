/**
 * Local food seed database — offline fallback when USDA key is missing
 * or the network is down. Values are representative per-100g figures.
 */
import type { FoodSearchResult } from "./types";

interface SeedFood {
  name: string;
  brand?: string;
  per100g: { kcal: number; protein: number; carbs: number; fat: number };
  servingGrams?: number;
}

const SEED: SeedFood[] = [
  { name: "Chicken Breast, grilled, skinless", per100g: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 }, servingGrams: 150 },
  { name: "Beef, ground, 90% lean, cooked", per100g: { kcal: 250, protein: 26, carbs: 0, fat: 15 }, servingGrams: 150 },
  { name: "Salmon, Atlantic, cooked", per100g: { kcal: 208, protein: 20, carbs: 0, fat: 13 }, servingGrams: 150 },
  { name: "Egg, whole, large", per100g: { kcal: 143, protein: 13, carbs: 0.7, fat: 9.5 }, servingGrams: 50 },
  { name: "Egg White", per100g: { kcal: 52, protein: 11, carbs: 0.7, fat: 0.2 }, servingGrams: 33 },
  { name: "White Rice, cooked", per100g: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 }, servingGrams: 158 },
  { name: "Brown Rice, cooked", per100g: { kcal: 123, protein: 2.7, carbs: 26, fat: 1 }, servingGrams: 195 },
  { name: "Pasta, cooked", per100g: { kcal: 158, protein: 6, carbs: 31, fat: 0.9 }, servingGrams: 140 },
  { name: "Bread, white", per100g: { kcal: 265, protein: 9, carbs: 49, fat: 3.2 }, servingGrams: 28 },
  { name: "Bread, whole wheat", per100g: { kcal: 254, protein: 12, carbs: 43, fat: 3.5 }, servingGrams: 28 },
  { name: "Oats, dry", per100g: { kcal: 389, protein: 17, carbs: 66, fat: 7 }, servingGrams: 40 },
  { name: "Milk, whole 3.25%", per100g: { kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3 }, servingGrams: 244 },
  { name: "Milk, skim", per100g: { kcal: 34, protein: 3.4, carbs: 5, fat: 0.1 }, servingGrams: 244 },
  { name: "Greek Yogurt, plain, nonfat", per100g: { kcal: 59, protein: 10, carbs: 3.6, fat: 0.4 }, servingGrams: 170 },
  { name: "Cheddar Cheese", per100g: { kcal: 403, protein: 25, carbs: 1.3, fat: 33 }, servingGrams: 28 },
  { name: "Mozzarella, part skim", per100g: { kcal: 254, protein: 24, carbs: 2.8, fat: 16 }, servingGrams: 28 },
  { name: "Lentils, cooked", per100g: { kcal: 116, protein: 9, carbs: 20, fat: 0.4 }, servingGrams: 198 },
  { name: "Black Beans, cooked", per100g: { kcal: 132, protein: 9, carbs: 24, fat: 0.5 }, servingGrams: 172 },
  { name: "Chickpeas, cooked", per100g: { kcal: 164, protein: 8.9, carbs: 27, fat: 2.6 }, servingGrams: 164 },
  { name: "Tofu, firm", per100g: { kcal: 144, protein: 17, carbs: 3, fat: 9 }, servingGrams: 126 },
  { name: "Tempeh", per100g: { kcal: 192, protein: 20, carbs: 8, fat: 11 }, servingGrams: 84 },
  { name: "Potato, baked, flesh & skin", per100g: { kcal: 93, protein: 2.5, carbs: 21, fat: 0.1 }, servingGrams: 173 },
  { name: "Sweet Potato, baked", per100g: { kcal: 90, protein: 2, carbs: 21, fat: 0.2 }, servingGrams: 150 },
  { name: "Broccoli, steamed", per100g: { kcal: 35, protein: 2.4, carbs: 7, fat: 0.4 }, servingGrams: 156 },
  { name: "Spinach, raw", per100g: { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 }, servingGrams: 30 },
  { name: "Mixed Greens Salad", per100g: { kcal: 20, protein: 1.5, carbs: 3, fat: 0.3 }, servingGrams: 85 },
  { name: "Tomato", per100g: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 }, servingGrams: 123 },
  { name: "Avocado", per100g: { kcal: 160, protein: 2, carbs: 8.5, fat: 15 }, servingGrams: 150 },
  { name: "Banana", per100g: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 }, servingGrams: 118 },
  { name: "Apple", per100g: { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 }, servingGrams: 182 },
  { name: "Orange", per100g: { kcal: 47, protein: 0.9, carbs: 12, fat: 0.1 }, servingGrams: 131 },
  { name: "Strawberries", per100g: { kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3 }, servingGrams: 152 },
  { name: "Blueberries", per100g: { kcal: 57, protein: 0.7, carbs: 14, fat: 0.3 }, servingGrams: 148 },
  { name: "Olive Oil", per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 }, servingGrams: 14 },
  { name: "Butter", per100g: { kcal: 717, protein: 0.9, carbs: 0.1, fat: 81 }, servingGrams: 14 },
  { name: "Mayonnaise", per100g: { kcal: 680, protein: 1, carbs: 0.6, fat: 75 }, servingGrams: 14 },
  { name: "Ranch Dressing", per100g: { kcal: 430, protein: 1, carbs: 6, fat: 45 }, servingGrams: 30 },
  { name: "Peanut Butter", per100g: { kcal: 588, protein: 25, carbs: 20, fat: 50 }, servingGrams: 32 },
  { name: "Almonds", per100g: { kcal: 579, protein: 21, carbs: 22, fat: 50 }, servingGrams: 28 },
  { name: "Walnuts", per100g: { kcal: 654, protein: 15, carbs: 14, fat: 65 }, servingGrams: 28 },
  { name: "Whey Protein Powder", per100g: { kcal: 400, protein: 80, carbs: 8, fat: 5 }, servingGrams: 30 },
  { name: "Cheddar Crackers", brand: "Generic", per100g: { kcal: 500, protein: 8, carbs: 60, fat: 25 }, servingGrams: 30 },
  { name: "Potato Chips", brand: "Generic", per100g: { kcal: 536, protein: 7, carbs: 53, fat: 34 }, servingGrams: 28 },
  { name: "Dark Chocolate, 70-85%", per100g: { kcal: 598, protein: 8, carbs: 46, fat: 43 }, servingGrams: 20 },
  { name: "Pizza, cheese, regular crust", per100g: { kcal: 266, protein: 11, carbs: 33, fat: 10 }, servingGrams: 107 },
  { name: "Cheeseburger, fast food", per100g: { kcal: 295, protein: 17, carbs: 24, fat: 14 }, servingGrams: 154 },
  { name: "French Fries", per100g: { kcal: 312, protein: 3.4, carbs: 41, fat: 15 }, servingGrams: 117 },
  { name: "Chicken Wings, fried", per100g: { kcal: 290, protein: 24, carbs: 3, fat: 21 }, servingGrams: 100 },
  { name: "Sushi Roll, salmon avocado", per100g: { kcal: 145, protein: 6, carbs: 21, fat: 4 }, servingGrams: 170 },
  { name: "Hummus", per100g: { kcal: 166, protein: 8, carbs: 14, fat: 10 }, servingGrams: 30 },
];

/**
 * Word-boundary search: query terms must match whole words in the food name
 * (exact word > word prefix). Prevents mid-word substring false positives,
 * e.g. "fat" matching "nonfat".
 */
export function searchSeedFoods(query: string, limit = 12): FoodSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const scored = SEED.map((food) => {
    const words = food.name.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    let score = 0;
    for (const t of terms) {
      if (words.some((w) => w === t)) score += 3; // exact word match
      else if (words.some((w) => w.startsWith(t))) score += 2; // word-prefix match
    }
    return { food, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ food }) => ({
    name: food.name,
    brand: food.brand,
    per100g: food.per100g,
    servingGrams: food.servingGrams ?? null,
    source: "seed" as const,
  }));
}

/** Exact/nearest match by normalized name, for resolving vision items. */
export function findSeedFoodByName(name: string): FoodSearchResult | null {
  const norm = name.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  if (!norm) return null;
  const results = searchSeedFoods(norm, 1);
  return results[0] ?? null;
}

export function getSeedFoodCount(): number {
  return SEED.length;
}
