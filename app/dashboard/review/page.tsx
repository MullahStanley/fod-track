"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  apiJson,
  itemMacros,
  itemsTotals,
  todayLocalISO,
  uid,
  type FoodItem,
  type FoodSearchResult,
  type ResolvedScan,
} from "@/lib/client-utils";
import { GramStepper, SectionTitle, Spinner } from "@/components/ui";

const HIDDEN_EXTRA_PRESETS = [
  { name: "Cooking oil (1 tbsp / 14g)", per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 }, grams: 14 },
  { name: "Butter (1 tbsp / 14g)", per100g: { kcal: 717, protein: 0.9, carbs: 0.1, fat: 81 }, grams: 14 },
  { name: "Blue Band Margarine (1 tbsp / 10g)", per100g: { kcal: 720, protein: 0, carbs: 0.5, fat: 80 }, grams: 10 },
  { name: "Chai with sugar (1 cup / 200ml)", per100g: { kcal: 45, protein: 1.6, carbs: 6.5, fat: 1.6 }, grams: 200 },
  { name: "Kachumbari side (100g)", per100g: { kcal: 28, protein: 1.1, carbs: 5.5, fat: 0.3 }, grams: 100 },
  { name: "Avocado slice (50g)", per100g: { kcal: 160, protein: 2, carbs: 8.5, fat: 15 }, grams: 50 },
  { name: "Sugar (1 tsp / 4g)", per100g: { kcal: 387, protein: 0, carbs: 100, fat: 0 }, grams: 4 },
  { name: "Mayonnaise (1 tbsp / 14g)", per100g: { kcal: 680, protein: 1, carbs: 0.6, fat: 75 }, grams: 14 },
];

const SOURCE_BADGES: Record<FoodItem["source"], string> = {
  vision: "🤖 AI Scan",
  barcode: "🏷️ Barcode",
  search: "🔍 Database",
  manual: "✍️ Manual",
  hidden_extra: "🧈 Extra",
  ai: "✨ AI Resolved",
};

export default function ReviewPage() {
  const router = useRouter();
  const [scan, setScan] = useState<ResolvedScan | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("fodtrack_scan");
    return raw ? (JSON.parse(raw) as ResolvedScan) : null;
  });
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snacks">("lunch");
  const [mealName, setMealName] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolvingAi, setResolvingAi] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = scan?.items ?? [];
  const totals = useMemo(() => itemsTotals(items), [items]);

  async function resolveUnresolvedWithAi(targetName: string) {
    if (!scan) return;
    setResolvingAi(targetName);
    setError(null);
    try {
      const existing = scan.items.find(
        (i) => i.name.toLowerCase() === targetName.toLowerCase()
      );
      const grams = existing ? existing.grams : 100;
      const res = await apiJson<{ item: FoodItem }>("/api/foods/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve_ai", name: targetName, grams }),
      });

      if (res.item && res.item.per100g.kcal > 0) {
        const nextItems = scan.items.map((i) =>
          i.name.toLowerCase() === targetName.toLowerCase()
            ? { ...res.item, id: i.id }
            : i
        );
        const nextUnresolved = scan.unresolvedNames.filter(
          (u) => u.toLowerCase() !== targetName.toLowerCase()
        );
        const nextScan: ResolvedScan = {
          ...scan,
          items: nextItems,
          unresolvedNames: nextUnresolved,
        };
        setScan(nextScan);
        sessionStorage.setItem("fodtrack_scan", JSON.stringify(nextScan));
      } else {
        setError(`AI could not determine nutrition for "${targetName}". Please search database manually.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI resolution failed");
    } finally {
      setResolvingAi(null);
    }
  }

  if (!scan) {
    return (
      <main className="relative z-10 mx-auto max-w-md px-4 pb-24 pt-20 text-center">
        <div className="card border-line bg-surface-raised/85 shadow-2xl backdrop-blur-xl py-10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface border border-line text-xl">
            🍽️
          </div>
          <h2 className="text-base font-bold text-ink mb-1">No Meal in Calibration Buffer</h2>
          <p className="text-xs text-muted mb-6">
            Start by scanning a plate photo, looking up a barcode, or searching the food database.
          </p>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <Link href="/dashboard/scan" className="btn-primary !py-2.5">
              📸 AI Photo Scan
            </Link>
            <Link href="/dashboard/barcode" className="btn-ghost !py-2.5">
              🏷️ Scan Barcode
            </Link>
            <Link href="/dashboard/search" className="btn-ghost !py-2.5">
              🔍 Search Kenyan Foods
            </Link>
          </div>
        </div>
      </main>
    );
  }

  function updateItem(id: string, patch: Partial<FoodItem>) {
    setScan((s) =>
      s ? { ...s, items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) } : s
    );
  }

  function removeItem(id: string) {
    setScan((s) => (s ? { ...s, items: s.items.filter((it) => it.id !== id) } : s));
  }

  function addItemFromResult(r: FoodSearchResult) {
    const item: FoodItem = {
      id: uid(),
      name: r.name,
      brand: r.brand,
      per100g: r.per100g,
      servingMultiplier: 1,
      servingGrams: r.servingGrams,
      grams: r.servingGrams ?? 100,
      source: "search",
      fdcId: r.fdcId,
    };
    setScan((s) => (s ? { ...s, items: [...s.items, item] } : s));
    setSearchQ("");
    setSearchResults([]);
  }

  function addHiddenExtra(preset: (typeof HIDDEN_EXTRA_PRESETS)[number]) {
    const item: FoodItem = {
      id: uid(),
      name: preset.name,
      per100g: preset.per100g,
      servingMultiplier: 1,
      servingGrams: preset.grams,
      grams: preset.grams,
      source: "hidden_extra",
    };
    setScan((s) => (s ? { ...s, items: [...s.items, item] } : s));
  }

  async function runSearch() {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const d = await apiJson<{ results: FoodSearchResult[] }>(
        `/api/foods/search?q=${encodeURIComponent(searchQ)}`
      );
      setSearchResults(d.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function save() {
    if (items.length === 0 || !scan) return;
    setSaving(true);
    setError(null);
    try {
      await apiJson("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo",
          logDate: todayLocalISO(),
          mealType,
          name: mealName.trim() || scan.mealName || "Unnamed meal",
          entrySource: items.some((i) => i.source === "vision")
            ? ("vision" as const)
            : items.some((i) => i.source === "barcode")
              ? ("barcode" as const)
              : ("search" as const),
          suspectedHiddenFats: scan.suspectedHiddenFats,
          items: items.map((i) => ({
            name: i.name,
            brand: i.brand,
            per100g: i.per100g,
            servingMultiplier: i.servingMultiplier,
            servingGrams: i.servingGrams,
            grams: i.grams,
            source: i.source,
            fdcId: i.fdcId,
            barcode: i.barcode,
          })),
        }),
      });
      sessionStorage.removeItem("fodtrack_scan");
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-44 pt-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
        <span>/</span>
        <span className="text-ink font-medium">Plate Calibration</span>
      </nav>

      <header className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="chip backdrop-blur-md">
          ← Cancel
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-sm font-bold tracking-widest text-ink">
            PRE-LOG CALIBRATION
          </h1>
        </div>
        <span className="w-20" />
      </header>

      {/* Warnings & Notices */}
      {scan.suspectedHiddenFats && (
        <div className="mb-4 rounded-xl border border-warn/40 bg-warn/10 p-3.5 text-xs text-warn backdrop-blur-md flex items-start gap-2.5">
          <span className="text-base">⚠️</span>
          <div>
            <span className="font-bold">Hidden oils/fats flagged by AI vision.</span>
            <p className="mt-0.5 text-ink/80">
              Check the cooking oils or dressing items below and adjust their grams if needed.
            </p>
          </div>
        </div>
      )}

      {scan.unresolvedNames.length > 0 && (
        <div className="mb-4 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5 text-xs text-ink backdrop-blur-md">
          <div className="flex items-center gap-1.5 font-bold text-purple-300">
            <span>✨</span>
            <span>Unmatched local components in buffer:</span>
          </div>
          <p className="mt-1 text-muted text-[11px] leading-relaxed">
            {scan.unresolvedNames.join(", ")} — default macros are 0.
            Our AI Food Assistant can interpret local language names, Sheng, and traditional Kenyan dishes:
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {scan.unresolvedNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => void resolveUnresolvedWithAi(name)}
                disabled={resolvingAi === name}
                className="chip !border-purple-500/40 text-purple-300 hover:bg-purple-500/20 font-bold !text-[11px] flex items-center gap-1"
              >
                {resolvingAi === name ? <Spinner className="h-3 w-3 border-purple-400" /> : "✨ "}
                Calculate nutrition for &ldquo;{name}&rdquo; with AI
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Totals Summary Card */}
      <section className="card mb-4 border-line bg-surface-raised/85 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Total Energy
            </span>
            <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5">
              {totals.kcal}
            </p>
            <span className="text-[10px] text-muted">kcal</span>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2.5">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              Protein
            </span>
            <p className="text-2xl font-extrabold text-cyan-400 font-mono mt-0.5">
              {totals.protein}g
            </p>
            <span className="text-[10px] text-muted">
              {Math.round(((totals.protein * 4) / Math.max(1, totals.kcal)) * 100)}% kcal
            </span>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Carbs
            </span>
            <p className="text-2xl font-extrabold text-amber-400 font-mono mt-0.5">
              {totals.carbs}g
            </p>
            <span className="text-[10px] text-muted">
              {Math.round(((totals.carbs * 4) / Math.max(1, totals.kcal)) * 100)}% kcal
            </span>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              Fats
            </span>
            <p className="text-2xl font-extrabold text-rose-400 font-mono mt-0.5">
              {totals.fat}g
            </p>
            <span className="text-[10px] text-muted">
              {Math.round(((totals.fat * 9) / Math.max(1, totals.kcal)) * 100)}% kcal
            </span>
          </div>
        </div>
      </section>

      {/* Meal Metadata */}
      <section className="card mb-4 grid gap-3 sm:grid-cols-2 border-line bg-surface-raised/80">
        <div>
          <label className="label" htmlFor="mealName">
            Meal name
          </label>
          <input
            id="mealName"
            className="input"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder={scan.mealName || "Unnamed meal"}
          />
        </div>
        <div>
          <span className="label">Meal type</span>
          <div className="grid grid-cols-4 gap-1.5">
            {(["breakfast", "lunch", "dinner", "snacks"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`chip !justify-center !px-1 capitalize !text-[11px] ${
                  mealType === t
                    ? "!border-emerald-400 !bg-emerald-500/20 !text-emerald-300 font-bold"
                    : "hover:border-line"
                }`}
                onClick={() => setMealType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Items Breakdown with Steppers */}
      <SectionTitle
        right={
          <span className="text-xs font-mono font-semibold text-muted">
            {items.length} component{items.length === 1 ? "" : "s"}
          </span>
        }
      >
        Verified Plate Components
      </SectionTitle>

      <ul className="mb-4 space-y-2.5">
        {items.map((item) => {
          const m = itemMacros(item);
          return (
            <li
              key={item.id}
              className="card border-line hover:border-emerald-500/30 transition-all bg-surface-raised/85"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="chip !py-0 !px-1.5 !text-[10px] font-semibold text-emerald-300 !border-emerald-500/30">
                      {SOURCE_BADGES[item.source]}
                    </span>
                    <p className="truncate text-sm font-bold text-ink">{item.name}</p>
                  </div>
                  {item.brand && <p className="text-xs text-muted mt-0.5">{item.brand}</p>}
                  {item.localOrigin && (
                    <span className="inline-block chip !py-0 !px-1.5 !text-[10px] !border-purple-500/30 text-purple-300 mt-1">
                      📍 {item.localOrigin}
                    </span>
                  )}
                  {item.culturalNotes && (
                    <p className="text-[11px] text-muted italic mt-0.5 line-clamp-1">
                      {item.culturalNotes}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-xs text-muted">
                    <span className="font-bold text-emerald-400">{m.kcal} kcal</span> · {m.protein}p {m.carbs}c {m.fat}f
                  </p>
                </div>

                <button
                  aria-label={`Delete ${item.name}`}
                  className="rounded-lg p-1 text-bad hover:bg-bad/10 text-sm font-bold transition"
                  onClick={() => removeItem(item.id)}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>

              {/* Stepper & Quick multipliers */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/50 pt-2.5">
                <GramStepper
                  grams={item.grams}
                  onChange={(g) => updateItem(item.id, { grams: g })}
                />

                <div className="flex gap-1">
                  {[0.5, 1, 1.5, 2].map((factor) => {
                    const baseG = item.servingGrams ?? 100;
                    return (
                      <button
                        key={factor}
                        type="button"
                        className="chip !px-2 !py-0.5 !text-[10px] hover:border-emerald-400"
                        onClick={() =>
                          updateItem(item.id, { grams: Math.round(baseG * factor) })
                        }
                      >
                        {factor}×
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Hidden Fats & Extras Tray */}
      <section className="card mb-4 border-line bg-surface-raised/80">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Add Hidden Fats & Extras
            </h3>
            <p className="text-[11px] text-muted">
              Oils, butter, chai, dressings often omitted from meal photos
            </p>
          </div>
          <button
            className="chip !text-[11px] font-medium"
            onClick={() => setShowExtras((v) => !v)}
          >
            {showExtras ? "Hide ▲" : "Show ▼"}
          </button>
        </div>

        {showExtras && (
          <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t border-line/50">
            {HIDDEN_EXTRA_PRESETS.map((p) => (
              <button
                key={p.name}
                className="chip text-[11px] hover:border-emerald-400 hover:text-emerald-300 transition"
                onClick={() => addHiddenExtra(p)}
              >
                + {p.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Add Missing Items via Search */}
      <section className="card mb-4 border-line bg-surface-raised/80">
        <SectionTitle>Add extra ingredient from database</SectionTitle>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Search avocado, omena, beans, rice…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void runSearch()}
          />
          <button
            className="btn-ghost !px-4"
            onClick={runSearch}
            disabled={searching || !searchQ.trim()}
          >
            {searching ? <Spinner /> : "Search"}
          </button>
        </div>

        {searchResults.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-line/60 pt-3">
            {searchResults.map((r, i) => (
              <li
                key={`${r.fdcId ?? r.source}-${i}`}
                className="flex items-center justify-between rounded-xl bg-surface/40 p-2.5 hover:bg-surface/70 transition"
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate text-xs font-bold text-ink">{r.name}</p>
                  <p className="text-[10px] text-muted font-mono">
                    {r.per100g.kcal} kcal/100g · {r.per100g.protein}p {r.per100g.carbs}c {r.per100g.fat}f
                  </p>
                </div>
                <button
                  className="chip !border-emerald-500/30 text-emerald-400 font-bold shrink-0 hover:bg-emerald-500/10"
                  onClick={() => addItemFromResult(r)}
                >
                  + Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Floating Save Footer */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-raised/95 p-4 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="text-xs font-semibold uppercase text-muted tracking-wider">
              Calibrated Meal Total
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {totals.kcal} kcal · {totals.protein}p / {totals.carbs}c / {totals.fat}f
            </span>
          </div>

          <button
            className="btn-primary w-full !py-3.5 text-base font-bold shadow-xl shadow-emerald-500/25"
            onClick={save}
            disabled={saving || items.length === 0}
          >
            {saving ? "Saving to daily log…" : "Approve & Save to Daily Log →"}
          </button>
        </div>
      </div>
    </main>
  );
}
