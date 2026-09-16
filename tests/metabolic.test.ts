import { describe, it, expect } from "vitest";
import {
  lbsToKg,
  kgToLbs,
  ftInToCm,
  cmToFtIn,
  bmrMifflinStJeor,
  tdeeFromBmr,
  computeMacroTargets,
  sumItemTotals,
} from "../lib/metabolic";
import type { UserProfile } from "../lib/types";

/** Helper: profile factory with deterministic overrides. */
function makeProfile(patch: Partial<UserProfile> = {}): UserProfile {
  const now = new Date().toISOString();
  return {
    id: "test",
    name: "Test",
    sex: "male",
    age: 30,
    weightKg: 70,
    heightCm: 175,
    activity: "moderately_active",
    goal: "maintenance",
    calorieAdjustmentOverride: null,
    preset: "standard",
    customSplit: null,
    proteinGPerKg: null,
    createdAt: now,
    updatedAt: now,
    ...patch,
  };
}

describe("unit conversions", () => {
  it("converts pounds to kilograms and back", () => {
    expect(lbsToKg(220.4623)).toBeCloseTo(100, 3);
    expect(kgToLbs(100)).toBeCloseTo(220.4623, 3);
  });

  it("round-trips kg ↔ lb", () => {
    expect(kgToLbs(lbsToKg(184.3))).toBeCloseTo(184.3, 6);
  });

  it("converts feet/inches to centimeters", () => {
    expect(ftInToCm(5, 9)).toBeCloseTo(175.26, 2); // 69 in × 2.54
    expect(ftInToCm(6, 0)).toBeCloseTo(182.88, 2);
  });

  it("round-trips cm ↔ ft/in", () => {
    const { feet, inches } = cmToFtIn(ftInToCm(5, 11));
    expect(feet).toBe(5);
    expect(inches).toBeCloseTo(11, 1);
  });
});

describe("bmrMifflinStJeor", () => {
  it("computes male BMR: 10·70 + 6.25·175 − 5·30 + 5 = 1648.75", () => {
    expect(bmrMifflinStJeor("male", 70, 175, 30)).toBeCloseTo(1648.75, 2);
  });

  it("computes female BMR: 10·60 + 6.25·165 − 5·25 − 161 = 1345.25", () => {
    expect(bmrMifflinStJeor("female", 60, 165, 25)).toBeCloseTo(1345.25, 2);
  });

  it("male formula is exactly female formula + 166 at identical stats", () => {
    const male = bmrMifflinStJeor("male", 80, 180, 40);
    const female = bmrMifflinStJeor("female", 80, 180, 40);
    expect(male - female).toBeCloseTo(166, 6);
  });
});

describe("tdeeFromBmr", () => {
  it("scales BMR by the exact activity multiplier", () => {
    expect(tdeeFromBmr(1648.75, 1.55)).toBeCloseTo(2555.5625, 4);
    expect(tdeeFromBmr(1500, 1.2)).toBe(1800);
    expect(tdeeFromBmr(2000, 1.9)).toBe(3800);
  });
});

describe("computeMacroTargets", () => {
  it("produces documented reference values for the default male profile", () => {
    const t = computeMacroTargets(makeProfile());
    expect(t.bmr).toBe(1649);
    expect(t.tdee).toBe(2556); // 1648.75 × 1.55
    expect(t.targetCalories).toBe(2556); // maintenance ±0
    // 40/30/30 split: p=2556·0.4/4, c=2556·0.3/4, f=2556·0.3/9
    expect(t.proteinG).toBe(256);
    expect(t.carbsG).toBe(192);
    expect(t.fatG).toBe(85);
  });

  it("applies fat-loss deficit of 500 kcal", () => {
    const t = computeMacroTargets(makeProfile({ goal: "fat_loss" }));
    expect(t.targetCalories).toBe(2556 - 500);
  });

  it("applies muscle-gain surplus within the 300–500 band default", () => {
    const t = computeMacroTargets(makeProfile({ goal: "muscle_gain" }));
    expect(t.targetCalories).toBe(2556 + 400);
  });

  it("honors calorieAdjustmentOverride over the goal default", () => {
    const t = computeMacroTargets(
      makeProfile({ goal: "maintenance", calorieAdjustmentOverride: -250 })
    );
    expect(t.targetCalories).toBe(2556 - 250);
  });

  it("respects every activity multiplier via TDEE", () => {
    const cases: Array<[UserProfile["activity"], number]> = [
      ["sedentary", 1.2],
      ["lightly_active", 1.375],
      ["moderately_active", 1.55],
      ["very_active", 1.725],
      ["extremely_active", 1.9],
    ];
    for (const [activity, mult] of cases) {
      const t = computeMacroTargets(makeProfile({ activity }));
      expect(t.tdee).toBe(Math.round(1648.75 * mult));
    }
  });

  it("computes preset splits: 45/35/20 high-protein", () => {
    const t = computeMacroTargets(makeProfile({ preset: "high_protein" }));
    expect(t.proteinG).toBe(Math.round((2556 * 0.45) / 4)); // 288
    expect(t.carbsG).toBe(Math.round((2556 * 0.35) / 4)); // 224
    expect(t.fatG).toBe(Math.round((2556 * 0.2) / 9)); // 57
  });

  it("computes preset splits: 35/20/45 low-carb", () => {
    const t = computeMacroTargets(makeProfile({ preset: "low_carb" }));
    expect(t.proteinG).toBe(Math.round((2556 * 0.35) / 4)); // 224
    expect(t.carbsG).toBe(Math.round((2556 * 0.2) / 4)); // 128
    expect(t.fatG).toBe(Math.round((2556 * 0.45) / 9)); // 128
  });

  it("protein-first custom mode: g/kg drives protein, remainder 60/40 carbs/fat", () => {
    // 1.8 g/kg × 70 kg = 126 g protein = 504 kcal; remaining 2052 → 1231 c-kcal / 821 f-kcal
    const t = computeMacroTargets(makeProfile({ preset: "custom", proteinGPerKg: 1.8 }));
    expect(t.proteinG).toBe(126);
    expect(t.carbsG).toBe(Math.round(2052 * 0.6 / 4)); // 308
    expect(t.fatG).toBe(Math.round(2052 * 0.4 / 9)); // 91
  });

  it("custom fractional split is used when it sums to ~1", () => {
    const t = computeMacroTargets(
      makeProfile({
        preset: "custom",
        customSplit: { protein: 0.3, carbs: 0.5, fat: 0.2 },
      })
    );
    expect(t.proteinG).toBe(Math.round((2555.5625 * 0.3) / 4)); // 191 — engine uses unrounded TDEE
    expect(t.carbsG).toBe(Math.round((2555.5625 * 0.5) / 4)); // 319
    expect(t.fatG).toBe(Math.round((2555.5625 * 0.2) / 9)); // 57
  });

  it("falls back to standard split when custom inputs are incomplete", () => {
    const t = computeMacroTargets(
      makeProfile({ preset: "custom", customSplit: { protein: 0.5, carbs: 0.5, fat: 0.5 }, proteinGPerKg: null })
    );
    expect(t.proteinG).toBe(256); // standard 40%
    expect(t.carbsG).toBe(192);
    expect(t.fatG).toBe(85);
  });

  it("never targets below 1000 kcal even with extreme deficit", () => {
    const t = computeMacroTargets(makeProfile({ calorieAdjustmentOverride: -5000 }));
    expect(t.targetCalories).toBe(1000);
  });

  it("is deterministic — identical profiles produce identical targets", () => {
    const a = computeMacroTargets(makeProfile({ sex: "female", weightKg: 62, age: 28 }));
    const b = computeMacroTargets(makeProfile({ sex: "female", weightKg: 62, age: 28 }));
    expect(a).toEqual(b);
  });
});

describe("sumItemTotals", () => {
  it("scales per-100g values by grams deterministically", () => {
    const totals = sumItemTotals([
      { grams: 150, per100g: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 } }, // chicken
      { grams: 158, per100g: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 } }, // rice
    ]);
    expect(totals.kcal).toBe(Math.round(165 * 1.5) + Math.round(130 * 1.58)); // 248 + 205 = 453 (per-item rounding)
    expect(totals.protein).toBe(Math.round(31 * 1.5) + Math.round(2.7 * 1.58)); // 47 + 4
  });

  it("returns zeros for an empty list", () => {
    expect(sumItemTotals([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it("handles pure-fat items at 9 kcal/g density", () => {
    const totals = sumItemTotals([
      { grams: 14, per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 } }, // 1 tbsp olive oil
    ]);
    expect(totals.kcal).toBe(Math.round(884 * 0.14)); // 124
    expect(totals.fat).toBe(14);
  });
});
