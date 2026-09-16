/**
 * Shared zod validators for API routes.
 */
import { z } from "zod";

export const SexSchema = z.enum(["male", "female"]);

export const ActivityLevelSchema = z.enum([
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extremely_active",
]);

export const GoalTypeSchema = z.enum(["fat_loss", "maintenance", "muscle_gain"]);

export const MacroSplitPresetSchema = z.enum([
  "standard",
  "high_protein",
  "low_carb",
  "custom",
]);

export const CustomSplitSchema = z
  .object({
    protein: z.number().min(0).max(1),
    carbs: z.number().min(0).max(1),
    fat: z.number().min(0).max(1),
  })
  .nullable();

export const ProfileSchema = z.object({
  name: z.string().max(80).default(""),
  sex: SexSchema,
  age: z.number().int().min(13).max(100),
  weightKg: z.number().min(25).max(400),
  heightCm: z.number().min(90).max(250),
  activity: ActivityLevelSchema,
  goal: GoalTypeSchema,
  calorieAdjustmentOverride: z.number().min(-2000).max(2000).nullable(),
  preset: MacroSplitPresetSchema,
  customSplit: CustomSplitSchema,
  proteinGPerKg: z.number().min(0.5).max(4).nullable(),
});

export const LogMealSchema = z.object({
  userId: z.string().min(1),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snacks"]),
  name: z.string().min(1).max(120),
  entrySource: z.enum(["vision", "barcode", "search", "manual"]),
  suspectedHiddenFats: z.boolean(),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1).max(120),
        brand: z.string().max(80).optional(),
        per100g: z.object({
          kcal: z.number().min(0).max(950),
          protein: z.number().min(0).max(100),
          carbs: z.number().min(0).max(100),
          fat: z.number().min(0).max(100),
        }),
        servingMultiplier: z.number().min(0.1).max(20),
        servingGrams: z.number().min(1).max(2000).nullable().optional(),
        grams: z.number().min(1).max(3000),
        source: z.enum(["vision", "barcode", "search", "manual", "hidden_extra"]),
        fdcId: z.number().int().optional(),
        barcode: z.string().max(32).optional(),
      })
    )
    .min(1)
    .max(30),
});

export const VisionRequestSchema = z.object({
  imageBase64: z.string().min(100).max(6_000_000), // ~4.5MB base64
  mimeType: z.enum(["image/jpeg", "image/webp"]).default("image/jpeg"),
});

export const BarcodeRequestSchema = z.object({
  code: z.string().regex(/^\d{6,14}$/),
  multiplier: z.number().min(0.1).max(20).default(1),
});
