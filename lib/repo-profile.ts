/**
 * Profile repository — persisted user metabolic profile.
 */
import { getDb, newId } from "./db";
import type { Sex, UserProfile } from "./types";

const DEFAULT_PROFILE: Omit<UserProfile, "id" | "createdAt" | "updatedAt"> = {
  name: "",
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
};

export function getDefaultProfile(): UserProfile {
  const now = new Date().toISOString();
  return { ...DEFAULT_PROFILE, id: "demo", createdAt: now, updatedAt: now };
}

interface UserRow {
  id: string;
  name: string;
  sex: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  activity: string;
  goal: string;
  calorie_adjustment_override: number | null;
  macro_preset: string;
  custom_split_json: string | null;
  protein_g_per_kg: number | null;
  created_at: string;
  updated_at: string;
}

function rowToProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    sex: row.sex as Sex,
    age: row.age,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    activity: row.activity as UserProfile["activity"],
    goal: row.goal as UserProfile["goal"],
    calorieAdjustmentOverride: row.calorie_adjustment_override,
    preset: row.macro_preset as UserProfile["preset"],
    customSplit: row.custom_split_json
      ? JSON.parse(row.custom_split_json)
      : null,
    proteinGPerKg: row.protein_g_per_kg,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getProfile(profileId: string): UserProfile {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(profileId) as unknown as UserRow | undefined;
  return row ? rowToProfile(row) : getDefaultProfile();
}

export function saveProfile(profile: UserProfile): UserProfile {
  const db = getDb();
  const now = new Date().toISOString();
  const toSave: UserProfile = { ...profile, updatedAt: now };

  db.prepare(
    `INSERT INTO users (
       id, name, sex, age, weight_kg, height_cm, activity, goal,
       calorie_adjustment_override, macro_preset, custom_split_json,
       protein_g_per_kg, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       sex = excluded.sex,
       age = excluded.age,
       weight_kg = excluded.weight_kg,
       height_cm = excluded.height_cm,
       activity = excluded.activity,
       goal = excluded.goal,
       calorie_adjustment_override = excluded.calorie_adjustment_override,
       macro_preset = excluded.macro_preset,
       custom_split_json = excluded.custom_split_json,
       protein_g_per_kg = excluded.protein_g_per_kg,
       updated_at = excluded.updated_at`
  ).run(
    toSave.id,
    toSave.name,
    toSave.sex,
    toSave.age,
    toSave.weightKg,
    toSave.heightCm,
    toSave.activity,
    toSave.goal,
    toSave.calorieAdjustmentOverride,
    toSave.preset,
    toSave.customSplit ? JSON.stringify(toSave.customSplit) : null,
    toSave.proteinGPerKg,
    toSave.createdAt,
    toSave.updatedAt
  );

  return toSave;
}

/** Create the demo profile row on first use. */
export function ensureDemoProfile(): UserProfile {
  const existing = getProfile("demo");
  const row = getDb().prepare("SELECT id FROM users WHERE id = ?").get("demo");
  if (!row) {
    const profile = getDefaultProfile();
    saveProfile(profile);
    return profile;
  }
  return existing;
}

/** Kept for API parity — the demo user id. */
export function demoUserId(): string {
  void newId;
  return "demo";
}
