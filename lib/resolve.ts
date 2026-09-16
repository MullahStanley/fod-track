/**
 * Resolution layer: turns vision/barcode/search results into editable FoodItems
 * with deterministic macros computed from per-100g database values.
 */
import { findSeedFoodByName, searchSeedFoods } from "./seed-foods";
import { hasUsdaKey, searchUsdaFoods } from "./provider-usda";
import type {
  BarcodeProduct,
  FoodItem,
  FoodSearchResult,
  VisionMealAnalysis,
} from "./types";

let idCounter = 0;
function nextItemId(): string {
  idCounter += 1;
  return `item_${Date.now().toString(36)}_${idCounter}`;
}

/** USDA first (if keyed), seed fallback, merged + deduped by name. */
export async function searchFoods(query: string, limit = 12): Promise<FoodSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const results: FoodSearchResult[] = [];
  if (hasUsdaKey()) {
    results.push(...(await searchUsdaFoods(q, limit)));
  }
  results.push(...searchSeedFoods(q, limit));

  // Dedupe by normalized name, keeping USDA (more precise) first.
  const seen = new Set<string>();
  const out: FoodSearchResult[] = [];
  for (const r of results) {
    const key = r.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
    if (out.length >= limit) break;
  }
  return out;
}

/** Resolve one vision-identified ingredient to database macros. */
async function resolveVisionItem(
  name: string,
  grams: number,
  source: FoodItem["source"]
): Promise<FoodItem> {
  let match: FoodSearchResult | null = null;
  if (hasUsdaKey()) {
    const usda = await searchUsdaFoods(name, 1);
    match = usda[0] ?? null;
  }
  if (!match) {
    match = findSeedFoodByName(name);
  }

  if (match) {
    return {
      id: nextItemId(),
      name: match.name,
      brand: match.brand,
      per100g: match.per100g,
      servingMultiplier: 1,
      servingGrams: match.servingGrams,
      grams: Math.round(grams),
      source,
      fdcId: match.fdcId,
    };
  }

  // Unresolved: neutral placeholder the user must edit or replace.
  return {
    id: nextItemId(),
    name,
    per100g: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    servingMultiplier: 1,
    servingGrams: null,
    grams: Math.round(grams),
    source: "manual",
  };
}

export interface ResolvedScan {
  mealName: string;
  items: FoodItem[];
  suspectedHiddenFats: boolean;
  unresolvedNames: string[];
}

/**
 * Resolve a full vision analysis into editable items.
 * Hidden fats become optional (source: "hidden_extra") items the user can toggle.
 */
export async function resolveVisionAnalysis(
  analysis: VisionMealAnalysis
): Promise<ResolvedScan> {
  const items: FoodItem[] = [];
  const unresolvedNames: string[] = [];

  for (const it of analysis.items) {
    const item = await resolveVisionItem(it.name, it.estimated_grams, "vision");
    if (item.source === "manual") unresolvedNames.push(it.name);
    items.push(item);
  }

  for (const extra of analysis.cooking_fats_or_extras) {
    const item = await resolveVisionItem(extra.name, extra.grams, "hidden_extra");
    if (item.source === "manual") {
      // Apply generic fat values when the extra itself can't be resolved.
      item.per100g = { kcal: 884, protein: 0, carbs: 0, fat: 100 };
      item.source = "hidden_extra";
    }
    items.push(item);
  }

  return {
    mealName: analysis.meal_name,
    items,
    suspectedHiddenFats: analysis.suspected_hidden_fats,
    unresolvedNames,
  };
}

/** Convert a barcode product into a single editable FoodItem. */
export function barcodeToFoodItem(
  product: BarcodeProduct,
  servingMultiplier: number
): FoodItem {
  const grams = Math.round(product.serving.grams * servingMultiplier);
  const f = product.serving.grams > 0 ? 100 / product.serving.grams : 0;
  return {
    id: nextItemId(),
    name: product.name,
    brand: product.brand,
    per100g: {
      kcal: Math.round(product.serving.kcal * f),
      protein: product.serving.protein * f,
      carbs: product.serving.carbs * f,
      fat: product.serving.fat * f,
    },
    servingMultiplier,
    servingGrams: product.serving.grams,
    grams,
    source: "barcode",
    barcode: product.barcode,
  };
}

/** Convert a search result into an editable FoodItem at a given gram weight. */
export function searchResultToFoodItem(
  result: FoodSearchResult,
  grams?: number
): FoodItem {
  return {
    id: nextItemId(),
    name: result.name,
    brand: result.brand,
    per100g: result.per100g,
    servingMultiplier: 1,
    servingGrams: result.servingGrams,
    grams: grams ?? result.servingGrams ?? 100,
    source: "search",
    fdcId: result.fdcId,
    barcode: result.barcode,
  };
}
