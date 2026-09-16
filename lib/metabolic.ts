/**
 * Deterministic metabolic math — no IO, fully unit-testable.
 * Mifflin-St Jeor BMR, activity-scaled TDEE, goal adjustment, macro gram targets.
 */
import {
  ACTIVITY_MULTIPLIERS,
  GOAL_CALORIE_ADJUSTMENTS,
  MACRO_SPLIT_PRESETS,
  type MacroTargets,
  type Sex,
  type UserProfile,
} from "./types";

/** Convert pounds to kilograms. */
export function lbsToKg(lbs: number): number {
  return lbs * 0.45359237;
}

/** Convert kilograms to pounds. */
export function kgToLbs(kg: number): number {
  return kg / 0.45359237;
}

/** Convert feet/inches to centimeters. */
export function ftInToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

/** Convert centimeters to feet/inches pair. */
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  return { feet, inches: Math.round((totalInches - feet * 12) * 10) / 10 };
}

/**
 * Mifflin-St Jeor basal metabolic rate.
 * Men:   10·kg + 6.25·cm − 5·age + 5
 * Women: 10·kg + 6.25·cm − 5·age − 161
 */
export function bmrMifflinStJeor(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

/** Total daily energy expenditure = BMR × activity multiplier. */
export function tdeeFromBmr(bmr: number, multiplier: number): number {
  return bmr * multiplier;
}

/** Round to nearest integer, guarding NaN. */
function safeRound(n: number): number {
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/**
 * Compute full macro targets from a profile.
 * Deterministic: same inputs always produce identical outputs.
 */
export function computeMacroTargets(profile: UserProfile): MacroTargets {
  const bmr = bmrMifflinStJeor(profile.sex, profile.weightKg, profile.heightCm, profile.age);
  const tdee = tdeeFromBmr(bmr, ACTIVITY_MULTIPLIERS[profile.activity]);

  const adjustment =
    profile.calorieAdjustmentOverride ?? GOAL_CALORIE_ADJUSTMENTS[profile.goal];
  const targetCalories = Math.max(1000, tdee + adjustment);

  let proteinFrac: number;
  let carbsFrac: number;
  let fatFrac: number;

  if (profile.preset === "custom") {
    if (profile.proteinGPerKg != null && profile.proteinGPerKg > 0) {
      // Protein-first: g/kg → kcal, remainder split 40/60 between carbs and fat.
      const proteinKcal = profile.proteinGPerKg * profile.weightKg * 4;
      const remaining = Math.max(0, targetCalories - proteinKcal);
      proteinFrac = Math.min(1, proteinKcal / targetCalories);
      carbsFrac = remaining * 0.6 / targetCalories;
      fatFrac = remaining * 0.4 / targetCalories;
    } else if (
      profile.customSplit &&
      Math.abs(
        profile.customSplit.protein +
          profile.customSplit.carbs +
          profile.customSplit.fat -
          1
      ) < 0.01
    ) {
      ({ protein: proteinFrac, carbs: carbsFrac, fat: fatFrac } = profile.customSplit);
    } else {
      // Fall back to standard split if custom inputs are incomplete.
      ({ protein: proteinFrac, carbs: carbsFrac, fat: fatFrac } =
        MACRO_SPLIT_PRESETS.standard);
    }
  } else {
    ({ protein: proteinFrac, carbs: carbsFrac, fat: fatFrac } =
      MACRO_SPLIT_PRESETS[profile.preset]);
  }

  return {
    bmr: safeRound(bmr),
    tdee: safeRound(tdee),
    targetCalories: safeRound(targetCalories),
    proteinG: safeRound((targetCalories * proteinFrac) / 4),
    carbsG: safeRound((targetCalories * carbsFrac) / 4),
    fatG: safeRound((targetCalories * fatFrac) / 9),
  };
}

/** Sum macros for a set of food items at their current gram weights. */
export function sumItemTotals(
  items: Array<{ grams: number; per100g: { kcal: number; protein: number; carbs: number; fat: number } }>
): { kcal: number; protein: number; carbs: number; fat: number } {
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  for (const item of items) {
    const f = item.grams / 100;
    kcal += item.per100g.kcal * f;
    protein += item.per100g.protein * f;
    carbs += item.per100g.carbs * f;
    fat += item.per100g.fat * f;
  }
  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}
