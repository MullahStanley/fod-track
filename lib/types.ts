/**
 * fod-track — shared domain types
 */

export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extremely_active";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly Active",
  moderately_active: "Moderately Active",
  very_active: "Very Active",
  extremely_active: "Extremely Active",
};

export type GoalType = "fat_loss" | "maintenance" | "muscle_gain";

export const GOAL_CALORIE_ADJUSTMENTS: Record<GoalType, number> = {
  fat_loss: -500,
  maintenance: 0,
  muscle_gain: 400, // +300..500 default midpoint
};

export const GOAL_LABELS: Record<GoalType, string> = {
  fat_loss: "Fat Loss",
  maintenance: "Maintenance",
  muscle_gain: "Muscle Gain",
};

/** Preset macro splits, expressed as fractions of total calories. */
export type MacroSplitPreset = "standard" | "high_protein" | "low_carb" | "custom";

export const MACRO_SPLIT_PRESETS: Record<
  Exclude<MacroSplitPreset, "custom">,
  { protein: number; carbs: number; fat: number }
> = {
  standard: { protein: 0.4, carbs: 0.3, fat: 0.3 },
  high_protein: { protein: 0.45, carbs: 0.35, fat: 0.2 },
  low_carb: { protein: 0.35, carbs: 0.2, fat: 0.45 },
};

export interface UserProfile {
  id: string;
  name: string;
  sex: Sex;
  age: number;
  /** Normalized storage units */
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
  goal: GoalType;
  /** Calorie delta applied on top of TDEE (overrides goal default when set) */
  calorieAdjustmentOverride: number | null;
  preset: MacroSplitPreset;
  /** Custom split fractions; must sum to ~1 when preset === "custom" */
  customSplit: { protein: number; carbs: number; fat: number } | null;
  /** g/kg body weight protein target for custom mode */
  proteinGPerKg: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MacroTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snacks"];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

export interface FoodItem {
  id: string;
  name: string;
  /** Per-100g reference macros */
  per100g: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  /** Portion multiplier relative to a single serving, when applicable */
  servingMultiplier: number;
  /** Grams for one serving, when known (barcode/API sourced) */
  servingGrams: number | null;
  /** Computed grams for the current quantity */
  grams: number;
  source: "vision" | "barcode" | "search" | "manual" | "hidden_extra";
  /** Optional provenance */
  fdcId?: number;
  barcode?: string;
  brand?: string;
}

export interface LoggedMeal {
  id: string;
  userId: string;
  logDate: string; // YYYY-MM-DD
  mealType: MealType;
  name: string;
  items: FoodItem[];
  totals: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  /** How the entry was created */
  entrySource: "vision" | "barcode" | "search" | "manual";
  /** Suspected hidden fats flag from vision scan */
  suspectedHiddenFats: boolean;
  createdAt: string;
}

export interface DailyLog {
  date: string;
  meals: LoggedMeal[];
  totals: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

/* ── Vision pipeline types ─────────────────────────────── */

export interface VisionItem {
  name: string;
  estimated_grams: number;
  confidence: number;
}

export interface VisionExtra {
  name: string;
  grams: number;
  reason: string;
}

export interface VisionMealAnalysis {
  meal_name: string;
  suspected_hidden_fats: boolean;
  items: VisionItem[];
  cooking_fats_or_extras: VisionExtra[];
}

/* ── Provider types ────────────────────────────────────── */

export interface FoodSearchResult {
  fdcId?: number;
  barcode?: string;
  name: string;
  brand?: string;
  per100g: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  servingGrams: number | null;
  source: "usda" | "seed" | "openfoodfacts" | "local";
}

export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand?: string;
  /** Per serving */
  serving: {
    grams: number;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}
