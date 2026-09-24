/**
 * Resolution layer: turns vision/barcode/search results into editable FoodItems
 * with deterministic macros computed from per-100g database values.
 */
import { findSeedFoodByName, searchSeedFoods } from "./seed-foods";
import { findKenyaFoodByName, searchKenyaFoods } from "./foods-kenya";
import { hasUsdaKey, searchUsdaFoods } from "./provider-usda";
import { searchOpenFoodFacts } from "./provider-off";
import { hasAiFoodSearch, searchAiFoods } from "./ai-food-search";
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

export interface SearchFoodsOptions {
  limit?: number;
  includeOnline?: boolean;
  useAiFallback?: boolean;
  aiOnly?: boolean;
}

/**
 * Local-first merged search across all sources:
 * 1. Kenyan local DB (always, offline)
 * 2. Generic seed DB (always, offline)
 * 3. USDA FDC (when keyed / online search enabled)
 * 4. Open Food Facts text search (keyless, best-effort)
 * 5. AI Assistant for local languages / missing nutrition (when 0 matches or aiOnly requested)
 * Results are deduped by normalized name in that priority order.
 */
export async function searchFoods(
  query: string,
  options?: number | SearchFoodsOptions
): Promise<FoodSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const opts: SearchFoodsOptions =
    typeof options === "number" ? { limit: options } : options ?? {};
  const limit = Math.max(1, opts.limit ?? 12);
  const includeOnline = opts.includeOnline !== false;
  const useAiFallback = opts.useAiFallback !== false;
  const aiOnly = opts.aiOnly === true;

  // Direct AI search requested (for local language translation & custom nutrition)
  if (aiOnly) {
    if (hasAiFoodSearch()) {
      return searchAiFoods(q, limit);
    }
    return [];
  }

  const results: FoodSearchResult[] = [
    ...searchKenyaFoods(q, limit),
    ...searchSeedFoods(q, limit),
  ];

  if (includeOnline) {
    const [usda, off] = await Promise.allSettled([
      hasUsdaKey() ? searchUsdaFoods(q, limit) : Promise.resolve([]),
      searchOpenFoodFacts(q, Math.min(8, limit)),
    ]);
    if (usda.status === "fulfilled") results.push(...usda.value);
    if (off.status === "fulfilled") results.push(...off.value);
  }

  // Dedupe by normalized name, keeping higher-priority sources first.
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

  // If local DB and online databases have 0 matches (e.g. obscure local language term, dialect, slang),
  // fall back to AI model to translate and calculate nutrition!
  if (out.length === 0 && useAiFallback && hasAiFoodSearch()) {
    try {
      const aiResults = await searchAiFoods(q, Math.min(6, limit));
      for (const r of aiResults) {
        const key = r.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (key && !seen.has(key)) {
          seen.add(key);
          out.push(r);
        }
      }
    } catch (err) {
      console.warn("[searchFoods] AI fallback search failed:", err);
    }
  }

  return out;
}

/**
 * Best offline match for a vision-identified ingredient: compare Kenya and
 * generic seed candidates by how many query terms each name covers, breaking
 * ties in favor of the Kenyan DB (target-audience context).
 */
function bestOfflineMatch(name: string): FoodSearchResult | null {
  const terms = name
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
  if (terms.length === 0) return null;

  const coverage = (r: FoodSearchResult): number => {
    const words = r.name.toLowerCase().split(/[^a-z]+/);
    return terms.filter((t) => words.some((w) => w === t || w.startsWith(t))).length;
  };

  const candidates = [
    ...searchKenyaFoods(name, 3),
    ...searchSeedFoods(name, 3),
  ];
  if (candidates.length === 0) return null;

  let best = candidates[0];
  let bestScore = coverage(best);
  for (const c of candidates.slice(1)) {
    const s = coverage(c);
    // Strictly greater: earlier sources (Kenya first) win ties.
    if (s > bestScore) {
      best = c;
      bestScore = s;
    }
  }

  // Require most of the phrase to match: all terms for short names, ≥60% for
  // longer ones. Stops "gibberish fat" resolving to "beef with fat".
  const minTerms = terms.length <= 2 ? terms.length : Math.ceil(terms.length * 0.6);
  return bestScore >= minTerms ? best : null;
}

/** Resolve one vision-identified ingredient against offline DBs, then USDA. */
async function resolveVisionItem(
  name: string,
  grams: number,
  source: FoodItem["source"]
): Promise<FoodItem> {
  let match: FoodSearchResult | null = bestOfflineMatch(name);
  if (!match && hasUsdaKey()) {
    const usda = await searchUsdaFoods(name, 1);
    match = usda[0] ?? null;
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

/**
 * Resolve an ingredient using the AI model when static tables don't have it.
 * Ideal for local Kenyan languages, regional dishes, or custom preparations.
 */
export async function resolveItemWithAi(
  name: string,
  grams: number
): Promise<FoodItem> {
  if (hasAiFoodSearch()) {
    try {
      const aiResults = await searchAiFoods(name, 1);
      const match = aiResults[0];
      if (match) {
        return {
          id: nextItemId(),
          name: match.name,
          brand: match.brand,
          per100g: match.per100g,
          servingMultiplier: 1,
          servingGrams: match.servingGrams,
          grams: Math.round(grams),
          source: "ai",
          localOrigin: match.localOrigin,
          culturalNotes: match.culturalNotes,
        };
      }
    } catch (err) {
      console.warn("[resolveItemWithAi] AI resolution failed:", err);
    }
  }

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
    source: result.source === "ai" ? "ai" : "search",
    fdcId: result.fdcId,
    barcode: result.barcode,
    localOrigin: result.localOrigin,
    culturalNotes: result.culturalNotes,
  };
}
