/**
 * Open Food Facts provider — keyless barcode product lookup.
 * Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */
import type { BarcodeProduct } from "./types";

function baseUrl(): string {
  return process.env.OFF_BASE_URL || "https://world.openfoodfacts.org";
}

interface OffNutriments {
  ["energy-kcal_100g"]?: number;
  ["energy-kcal_serving"]?: number;
  energy_100g?: number; // often kJ
  energy_serving?: number;
  proteins_100g?: number;
  proteins_serving?: number;
  carbohydrates_100g?: number;
  carbohydrates_serving?: number;
  fat_100g?: number;
  fat_serving?: number;
}

interface OffProduct {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: OffNutriments;
}

interface OffResponse {
  status?: number;
  status_verbose?: string;
  product?: OffProduct;
}

function kJtoKcal(kj: number): number {
  return kj / 4.184;
}

function num(v: number | string | undefined): number | null {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/** kJ fallback: OFF sometimes reports energy only in kJ. */
function kcalFrom(
  n: OffNutriments,
  kcalField: keyof OffNutriments,
  kjField: keyof OffNutriments
): number | null {
  const kcal = num(n[kcalField]);
  if (kcal != null) return kcal;
  const kj = num(n[kjField]);
  return kj != null ? kJtoKcal(kj) : null;
}

export interface BarcodeLookupResult {
  ok: boolean;
  product?: BarcodeProduct;
  reason?: "not_found" | "network_error" | "incomplete_data";
}

/**
 * Look up a product by UPC/EAN barcode. No API key required.
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const clean = barcode.replace(/\D/g, "");
  if (!clean) return { ok: false, reason: "not_found" };

  const url = `${baseUrl()}/api/v2/product/${clean}.json?fields=product_name,product_name_en,brands,serving_size,serving_quantity,nutriments`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "fod-track/0.1 (nutrition tracker)" },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return { ok: false, reason: "network_error" };
  }

  if (res.status === 404) return { ok: false, reason: "not_found" };
  if (!res.ok) return { ok: false, reason: "network_error" };

  let data: OffResponse;
  try {
    data = (await res.json()) as OffResponse;
  } catch {
    return { ok: false, reason: "network_error" };
  }

  if (data.status === 0 || !data.product) {
    return { ok: false, reason: "not_found" };
  }

  const p = data.product;
  const name = p.product_name_en || p.product_name;
  if (!name) return { ok: false, reason: "incomplete_data" };

  const servingGrams = num(p.serving_quantity);
  const per100 = {
    kcal: kcalFrom(p.nutriments ?? {}, "energy-kcal_100g", "energy_100g"),
    protein: num(p.nutriments?.proteins_100g),
    carbs: num(p.nutriments?.carbohydrates_100g),
    fat: num(p.nutriments?.fat_100g),
  };

  // Prefer per-serving values when present; else derive from per-100g.
  const perServingDirect = {
    kcal: num(p.nutriments?.["energy-kcal_serving"]) ??
      (p.nutriments?.energy_serving != null
        ? kJtoKcal(num(p.nutriments.energy_serving)!)
        : null),
    protein: num(p.nutriments?.proteins_serving),
    carbs: null as number | null,
    fat: null as number | null,
  };

  let serving = {
    grams: servingGrams ?? 100,
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  if (perServingDirect.kcal != null && per100.kcal != null) {
    // Derive serving grams from the kcal ratio when not stated.
    if (serving.grams === 100 && per100.kcal > 0) {
      serving.grams = Math.round((perServingDirect.kcal / per100.kcal) * 100);
    }
  }

  if (per100.kcal != null || per100.protein != null || per100.carbs != null || per100.fat != null) {
    const f = serving.grams / 100;
    serving = {
      grams: Math.round(serving.grams),
      kcal: Math.round(perServingDirect.kcal ?? (per100.kcal ?? 0) * f),
      protein: round1(perServingDirect.protein ?? (per100.protein ?? 0) * f),
      carbs: round1(per100.carbs != null ? per100.carbs * f : 0),
      fat: round1(per100.fat != null ? per100.fat * f : 0),
    };
  } else {
    return { ok: false, reason: "incomplete_data" };
  }

  return {
    ok: true,
    product: {
      barcode: clean,
      name: name.trim(),
      brand: p.brands?.split(",")[0]?.trim() || undefined,
      serving,
    },
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
