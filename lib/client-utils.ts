"use client";

/**
 * Client-side helpers: image compression + typed fetch wrappers.
 */

export function todayLocalISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Downscale + compress an image file to ≤1024px JPEG for upload.
 */
export async function compressImage(
  file: File,
  maxDim = 1024,
  quality = 0.82
): Promise<{ base64: string; mimeType: "image/jpeg" }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const base64 = dataUrl.split(",")[1] ?? "";
  return { base64, mimeType: "image/jpeg" };
}

export async function apiJson<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

/* ── Shared client types mirroring the server types ── */

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  per100g: { kcal: number; protein: number; carbs: number; fat: number };
  servingMultiplier: number;
  servingGrams: number | null;
  grams: number;
  source: "vision" | "barcode" | "search" | "manual" | "hidden_extra" | "ai";
  fdcId?: number;
  barcode?: string;
  localOrigin?: string;
  culturalNotes?: string;
}

export interface Profile {
  id: string;
  name: string;
  sex: "male" | "female";
  age: number;
  weightKg: number;
  heightCm: number;
  activity:
    | "sedentary"
    | "lightly_active"
    | "moderately_active"
    | "very_active"
    | "extremely_active";
  goal: "fat_loss" | "maintenance" | "muscle_gain";
  calorieAdjustmentOverride: number | null;
  preset: "standard" | "high_protein" | "low_carb" | "custom";
  customSplit: { protein: number; carbs: number; fat: number } | null;
  proteinGPerKg: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Targets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface LoggedMeal {
  id: string;
  userId: string;
  logDate: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snacks";
  name: string;
  items: FoodItem[];
  totals: { kcal: number; protein: number; carbs: number; fat: number };
  entrySource: "vision" | "barcode" | "search" | "manual";
  suspectedHiddenFats: boolean;
  createdAt: string;
}

export interface FoodSearchResult {
  fdcId?: number;
  barcode?: string;
  name: string;
  brand?: string;
  per100g: { kcal: number; protein: number; carbs: number; fat: number };
  servingGrams: number | null;
  source: "usda" | "seed" | "openfoodfacts" | "local" | "ai";
  localOrigin?: string;
  culturalNotes?: string;
}

export interface ResolvedScan {
  mealName: string;
  items: FoodItem[];
  suspectedHiddenFats: boolean;
  unresolvedNames: string[];
}

export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand?: string;
  serving: { grams: number; kcal: number; protein: number; carbs: number; fat: number };
}

/** Local macro math for instant UI updates (mirrors lib/metabolic.ts). */
export function itemMacros(item: FoodItem): {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const f = item.grams / 100;
  return {
    kcal: Math.round(item.per100g.kcal * f),
    protein: Math.round(item.per100g.protein * f),
    carbs: Math.round(item.per100g.carbs * f),
    fat: Math.round(item.per100g.fat * f),
  };
}

export function itemsTotals(items: FoodItem[]) {
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  for (const i of items) {
    const m = itemMacros(i);
    kcal += m.kcal;
    protein += m.protein;
    carbs += m.carbs;
    fat += m.fat;
  }
  return { kcal, protein, carbs, fat };
}

export function uid(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
