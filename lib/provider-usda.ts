/**
 * USDA FoodData Central provider.
 * Docs: https://fdc.nal.usda.gov/api-guide.html
 */
import type { FoodSearchResult } from "./types";

const FDC_BASE =
  process.env.USDA_FDC_API_URL || "https://api.nal.usda.gov/fdc/v1/foods/search";

const MACRO_NUTRITION_IDS = {
  energyKcal: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
} as const;

interface FdcNutrient {
  nutrientId?: number;
  nutrient?: { id?: number; name?: string };
  unitName?: string;
  value: number;
}

interface FdcFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  gramWeight?: number;
  foodNutrients?: FdcNutrient[];
}

function pickNutrient(food: FdcFood, id: number): number {
  const n = food.foodNutrients?.find(
    (x) => x.nutrientId === id || x.nutrient?.id === id
  );
  return n && Number.isFinite(n.value) ? n.value : 0;
}

function toResult(food: FdcFood): FoodSearchResult | null {
  const kcal = pickNutrient(food, MACRO_NUTRITION_IDS.energyKcal);
  const protein = pickNutrient(food, MACRO_NUTRITION_IDS.protein);
  const carbs = pickNutrient(food, MACRO_NUTRITION_IDS.carbs);
  const fat = pickNutrient(food, MACRO_NUTRITION_IDS.fat);

  // Skip entries missing any energy data entirely.
  if (!kcal && !protein && !carbs && !fat) return null;

  const gramWeight =
    typeof food.gramWeight === "number" && food.gramWeight > 0
      ? food.gramWeight
      : null;

  // Branded foods report per-serving; normalize everything to per-100g.
  const perServing = gramWeight != null && gramWeight !== 100;
  const factor = perServing ? 100 / gramWeight : 1;

  return {
    fdcId: food.fdcId,
    name: food.description,
    brand: food.brandOwner || undefined,
    per100g: {
      kcal: round1(kcal * factor),
      protein: round1(protein * factor),
      carbs: round1(carbs * factor),
      fat: round1(fat * factor),
    },
    servingGrams: gramWeight,
    source: "usda",
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

const USDA_CACHE = new Map<string, FoodSearchResult[]>();

export function hasUsdaKey(): boolean {
  return Boolean(process.env.USDA_FDC_API_KEY);
}

/**
 * Search USDA FDC. Requires USDA_FDC_API_KEY.
 * Cached in-memory to prevent rate limits and ensure instant queries.
 * Returns [] on network failure — callers should fall back to the seed DB.
 */
export async function searchUsdaFoods(
  query: string,
  limit = 10
): Promise<FoodSearchResult[]> {
  const q = query.trim().toLowerCase();
  const key = process.env.USDA_FDC_API_KEY;
  if (!key || !q) return [];

  const cached = USDA_CACHE.get(q);
  if (cached) {
    return cached.slice(0, limit);
  }

  const params = new URLSearchParams({
    api_key: key,
    query: q,
    pageSize: String(limit),
    requireAllWords: "false",
  });

  try {
    const res = await fetch(`${FDC_BASE}?${params}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { foods?: FdcFood[] };
    const items = (data.foods ?? [])
      .map(toResult)
      .filter((r): r is FoodSearchResult => r !== null);

    if (items.length > 0) {
      if (USDA_CACHE.size >= 200) {
        const first = USDA_CACHE.keys().next().value;
        if (first) USDA_CACHE.delete(first);
      }
      USDA_CACHE.set(q, items);
    }
    return items.slice(0, limit);
  } catch {
    return [];
  }
}
