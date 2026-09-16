# fod-track

Fast, minimal AI nutrition tracker built for Kenya 🇰🇪 — dual-mode logging (AI meal photo estimation + UPC barcode lookup), a **local-first Kenyan food database** (ugali, sukuma wiki, nyama choma, githeri, omena…), deterministic macro math, and a mandatory pre-log calibration screen — you never accept raw AI output.

- **Landing page** (`/`): what calorie tracking is, why it matters, FAQ — server-rendered, SEO-optimized (JSON-LD, sitemap, robots).
- **App** (`/dashboard`): scan, barcode, search, review, targets.
- **Theming**: light = black & white (default), dark = navy & white; `prefers-color-scheme` respected with a manual toggle and no flash-of-wrong-theme.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 | Server routes keep API keys server-side; one deployable |
| Language | TypeScript (strict) | Deterministic math needs types |
| Styling | Tailwind CSS | Fast mobile-first UI |
| DB | SQLite via better-sqlite3 (WAL) | Zero-config persistent storage; swap to Postgres later |
| Vision | Gemini 2.5 Flash (Google AI Studio) | Free-tier multimodal; strict JSON decomposition |
| Food data | USDA FoodData Central + Open Food Facts + offline seed DB | Primary / barcode / resilience |
| Validation | zod | Hard boundaries at every API edge |

## Architecture (modular layers)

```
app/                    UI pages + API routes (presentation / transport)
  page.tsx              Dashboard: day navigation, macro bars, meals, history
  profile/              Onboarding & metabolic baseline editor
  scan/                 Photo capture + client compression (≤1024px JPEG)
  review/               PRE-LOG CALIBRATION SCREEN (edit grams, delete, add, extras)
  barcode/              UPC entry + native Barcode Detection API
  search/               Manual food search fallback
  api/                  profile · scan/analyze-meal · foods/search · foods/barcode · logs
lib/
  metabolic.ts          Mifflin-St Jeor BMR → TDEE → macro grams (pure, unit-testable)
  vision.ts             Gemini handler: strict JSON schema, NO calorie guessing
  resolve.ts            Vision/barcode/search → editable FoodItems (deterministic)
  provider-usda.ts      USDA FDC (server key)
  provider-off.ts       Open Food Facts (keyless)
  seed-foods.ts         ~50-item offline food table (global basics)
  foods-kenya.ts        ~60-item Kenyan/East African offline DB (ugali, sukuma, choma, omena…)
  db.ts / repo-*.ts     SQLite schema + repositories
  validators.ts         zod schemas for all API bodies
```

**Security:** `GEMINI_API_KEY` and `USDA_FDC_API_KEY` are read only in server code (`lib/vision.ts`, `lib/provider-usda.ts`) and never shipped to the client.

## The Vision Pipeline (no raw calorie guessing)

1. Client compresses photo → JPEG ≤1024px (`lib/client-utils.ts`).
2. `lib/vision.ts` sends it to Gemini with a strict schema: components + `estimated_grams` + `confidence` + `suspected_hidden_fats` + `cooking_fats_or_extras`. The prompt explicitly forbids outputting calories/macros.
3. `lib/resolve.ts` matches each component **Kenyan DB → seed DB → USDA → OFF** (best term-coverage wins; ties favor the Kenyan DB) and computes macros **deterministically** per 100g × grams.
4. Everything lands on `/review` as an editable breakdown — steppers, single-tap delete, database search to add missed items, one-tap hidden-fat extras (1 tbsp oil = 14g, etc.).
5. Only after user review does `POST /api/logs` persist the meal.

## Metabolic Engine

- **BMR** (Mifflin-St Jeor): men `10·kg + 6.25·cm − 5·age + 5`; women `−161`.
- **TDEE** = BMR × activity (1.2 / 1.375 / 1.55 / 1.725 / 1.9).
- **Goal**: fat loss −500 kcal, maintenance ±0, muscle gain +400 (configurable override).
- **Macros**: presets 40/30/30, 45/35/20, 35/20/45, or protein-first g/kg custom (remainder 60/40 carbs/fat). Energy densities: protein 4, carbs 4, fat 9 kcal/g.
- Units: stored normalized (kg/cm); UI converts lb and ft/in both directions.

## Database Schema (SQLite)

```sql
users(id PK, name, sex CHECK male|female, age, weight_kg, height_cm,
      activity, goal, calorie_adjustment_override,
      macro_preset, custom_split_json, protein_g_per_kg,
      created_at, updated_at)

logged_meals(id PK, user_id FK→users ON DELETE CASCADE, log_date,
      meal_type CHECK breakfast|lunch|dinner|snacks, name, entry_source,
      suspected_hidden_fats, totals_json, created_at)
  idx (user_id, log_date)

logged_meal_items(id PK, meal_id FK→logged_meals ON DELETE CASCADE,
      name, brand, grams, kcal, protein, carbs, fat,   -- kcal..fat are per-100g refs
      source, fdc_id, barcode, serving_multiplier)
  idx (meal_id)
```

Item macros are recomputed as `per100g × grams/100` everywhere — single source of truth.

## API

| Route | Purpose |
|---|---|
| `GET/POST /api/profile` | Load/save profile; returns computed BMR/TDEE/macro targets |
| `POST /api/scan/analyze-meal` | `{imageBase64, mimeType}` → resolved editable items (503 if no key) |
| `GET /api/foods/search?q=` | USDA + seed, deduped |
| `GET/POST /api/foods/barcode` | OFF lookup; POST returns serving-scaled FoodItem |
| `GET/POST/DELETE /api/logs` | Day/history fetch, save reviewed meal, delete |

## Resilience

- No Gemini key → scan page explains and links to barcode/manual search.
- USDA down/no key → Kenyan + seed databases always answer, offline.
- Food search merges four sources: local Kenyan DB, seed DB, USDA (keyed), Open Food Facts text search (keyless) — deduped in that priority order.
- Barcode not found/network error → friendly error with manual-search link.
- Unresolvable vision items → kept as 0-macro placeholders flagged in review.

## Setup

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY and/or USDA_FDC_API_KEY (both optional)
npm run dev                  # http://localhost:3000
npm run typecheck && npm run build
npm test                     # vitest — 42 unit tests
```

The SQLite file lands in `data/fodtrack.db` (gitignored). First load auto-creates the demo profile.

### Tests

`tests/metabolic.test.ts` — unit conversions (kg/lb, cm/ft-in round trips), Mifflin-St Jeor BMR for both sexes, TDEE across all five activity multipliers, goal adjustments & overrides, every macro preset, protein-first g/kg custom mode, the 1000 kcal floor, and determinism.

`tests/macros.test.ts` — barcode per-serving→per-100g normalization and serving multipliers, search-result item conversion, seed-database word-boundary search, vision resolution (known items, unresolved 0-macro placeholders, pure-fat fallback for unresolvable hidden extras), and client/server total parity (per-item rounding).

## Roadmap

**P0 — shipped here:** metabolic engine, dual-mode scanning pipeline, calibration screen, barcode flow, dashboard + history, seed fallback, server-side keys.

**P1:** real auth (Clerk) replacing the demo user; BarcodeDetector polyfill (html5-qrcode/zxing) for Safari; PWA + offline queue; progress charts and weight tracking; custom food presets/favorites.

**P2:** recipe builder with per-serving scaling; photo re-scan calibration loop (learn from user edits); exports (CSV/Apple Health); Postgres migration; weekly macro trend reports.
