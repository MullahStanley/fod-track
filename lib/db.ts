/**
 * SQLite database layer using Node's built-in node:sqlite (no native deps).
 * Exposes a lazily-initialized singleton connection.
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  _db = new DatabaseSync(path.join(dataDir, "fodtrack.db"));
  _db.exec("PRAGMA journal_mode = WAL;");
  _db.exec("PRAGMA foreign_keys = ON;");
  migrate(_db);
  return _db;
}

function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      sex TEXT NOT NULL CHECK (sex IN ('male','female')),
      age INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      height_cm REAL NOT NULL,
      activity TEXT NOT NULL,
      goal TEXT NOT NULL,
      calorie_adjustment_override REAL,
      macro_preset TEXT NOT NULL,
      custom_split_json TEXT,
      protein_g_per_kg REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS logged_meals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      log_date TEXT NOT NULL,
      meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snacks')),
      name TEXT NOT NULL,
      entry_source TEXT NOT NULL,
      suspected_hidden_fats INTEGER NOT NULL DEFAULT 0,
      totals_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_logged_meals_user_date
      ON logged_meals(user_id, log_date);

    CREATE TABLE IF NOT EXISTS logged_meal_items (
      id TEXT PRIMARY KEY,
      meal_id TEXT NOT NULL REFERENCES logged_meals(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      brand TEXT,
      grams REAL NOT NULL,
      kcal REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      source TEXT NOT NULL,
      fdc_id INTEGER,
      barcode TEXT,
      serving_multiplier REAL NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_logged_meal_items_meal
      ON logged_meal_items(meal_id);
  `);
}

export function newId(): string {
  return globalThis.crypto.randomUUID();
}
