/**
 * Meal-log repository — daily entries and their itemized breakdowns.
 */
import { getDb, newId } from "./db";
import type { FoodItem, LoggedMeal, MealType } from "./types";

interface MealRow {
  id: string;
  user_id: string;
  log_date: string;
  meal_type: string;
  name: string;
  entry_source: string;
  suspected_hidden_fats: number;
  totals_json: string;
  created_at: string;
}

interface ItemRow {
  id: string;
  meal_id: string;
  name: string;
  brand: string | null;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  fdc_id: number | null;
  barcode: string | null;
  serving_multiplier: number;
}

function computeTotals(items: FoodItem[]): {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  for (const it of items) {
    // Round per item so stored totals equal what the client displayed on save.
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

function itemToRow(itemId: string, mealId: string, it: FoodItem) {
  return {
    id: itemId,
    meal_id: mealId,
    name: it.name,
    brand: it.brand ?? null,
    grams: it.grams,
    kcal: it.per100g.kcal,
    protein: it.per100g.protein,
    carbs: it.per100g.carbs,
    fat: it.per100g.fat,
    source: it.source,
    fdc_id: it.fdcId ?? null,
    barcode: it.barcode ?? null,
    serving_multiplier: it.servingMultiplier,
  };
}

function rowToItem(row: ItemRow): FoodItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    per100g: {
      kcal: row.kcal,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
    },
    servingMultiplier: row.serving_multiplier,
    servingGrams: null,
    grams: row.grams,
    source: row.source as FoodItem["source"],
    fdcId: row.fdc_id ?? undefined,
    barcode: row.barcode ?? undefined,
  };
}

function rowToMeal(row: MealRow, items: ItemRow[]): LoggedMeal {
  return {
    id: row.id,
    userId: row.user_id,
    logDate: row.log_date,
    mealType: row.meal_type as MealType,
    name: row.name,
    items: items.map((r) => rowToItem(r)),
    totals: JSON.parse(row.totals_json),
    entrySource: row.entry_source as LoggedMeal["entrySource"],
    suspectedHiddenFats: row.suspected_hidden_fats === 1,
    createdAt: row.created_at,
  };
}

export function addMeal(
  meal: Omit<LoggedMeal, "id" | "createdAt" | "totals"> & { items: FoodItem[] }
): LoggedMeal {
  const db = getDb();
  const id = newId();
  const now = new Date().toISOString();
  const totals = computeTotals(meal.items);

  db.prepare(
    `INSERT INTO logged_meals
       (id, user_id, log_date, meal_type, name, entry_source, suspected_hidden_fats, totals_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    meal.userId,
    meal.logDate,
    meal.mealType,
    meal.name,
    meal.entrySource,
    meal.suspectedHiddenFats ? 1 : 0,
    JSON.stringify(totals),
    now
  );

  const insertItem = db.prepare(
    `INSERT INTO logged_meal_items
       (id, meal_id, name, brand, grams, kcal, protein, carbs, fat, source, fdc_id, barcode, serving_multiplier)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const it of meal.items) {
    const r = itemToRow(newId(), id, it);
    insertItem.run(
      r.id, r.meal_id, r.name, r.brand, r.grams, r.kcal, r.protein, r.carbs,
      r.fat, r.source, r.fdc_id, r.barcode, r.serving_multiplier
    );
  }

  return { ...meal, id, createdAt: now, totals };
}

export function getDayLog(userId: string, logDate: string): LoggedMeal[] {
  const meals = getDb()
    .prepare(
      "SELECT * FROM logged_meals WHERE user_id = ? AND log_date = ? ORDER BY created_at ASC"
    )
    .all(userId, logDate) as unknown as MealRow[];
  if (meals.length === 0) return [];

  const itemStmt = getDb().prepare("SELECT * FROM logged_meal_items WHERE meal_id = ?");
  const out: LoggedMeal[] = [];
  for (const m of meals) {
    const items = itemStmt.all(m.id) as unknown as ItemRow[];
    out.push(rowToMeal(m, items));
  }
  return out;
}

export function getRecentDays(userId: string, days = 30): LoggedMeal[][] {
  const dates = getDb()
    .prepare(
      `SELECT DISTINCT log_date FROM logged_meals
       WHERE user_id = ? ORDER BY log_date DESC LIMIT ?`
    )
    .all(userId, days) as unknown as Array<{ log_date: string }>;
  return dates.map((d) => getDayLog(userId, d.log_date));
}

export function deleteMeal(mealId: string): boolean {
  const result = getDb()
    .prepare("DELETE FROM logged_meals WHERE id = ?")
    .run(mealId);
  return result.changes > 0;
}
