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
  { name: "Olive oil (1 tbsp)", per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 }, grams: 14 },
  { name: "Butter (1 tbsp)", per100g: { kcal: 717, protein: 0.9, carbs: 0.1, fat: 81 }, grams: 14 },
  { name: "Mayonnaise (1 tbsp)", per100g: { kcal: 680, protein: 1, carbs: 0.6, fat: 75 }, grams: 14 },
  { name: "Ranch dressing", per100g: { kcal: 430, protein: 1, carbs: 6, fat: 45 }, grams: 30 },
  { name: "Sugar (1 tsp)", per100g: { kcal: 387, protein: 0, carbs: 100, fat: 0 }, grams: 4 },
  { name: "Ketchup (1 tbsp)", per100g: { kcal: 101, protein: 1.3, carbs: 25.8, fat: 0.1 }, grams: 17 },
];

const SOURCE_BADGES: Record<FoodItem["source"], string> = {
  vision: "🤖 AI",
  barcode: "🏷️ UPC",
  search: "🔍 DB",
  manual: "✍️ Manual",
  hidden_extra: "🧈 Extra",
};

export default function ReviewPage() {
  const router = useRouter();
  const [scan, setScan] = useState<ResolvedScan | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("fodtrack_scan");
    return raw ? (JSON.parse(raw) as ResolvedScan) : null;
  });
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snacks">("lunch");
  const [mealName, setMealName] = useState(scan?.mealName ?? "");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = scan?.items ?? [];
  const totals = useMemo(() => itemsTotals(items), [items]);

  if (!scan) {
    return (
      <main className="mx-auto max-w-md px-4 pb-28 pt-6 text-center">
        <p className="card text-sm text-muted">
          No scan in progress.{" "}
          <Link href="/scan" className="text-accent underline">Start a scan</Link>{" "}
          or <Link href="/search" className="text-accent underline">search foods</Link>.
        </p>
      </main>
    );
  }

  function updateItem(id: string, patch: Partial<FoodItem>) {
    setScan((s) =>
      s
        ? {
            ...s,
            items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
          }
        : s
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
          name: mealName.trim() || "Unnamed meal",
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
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-40 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <Link href="/scan" className="chip">← Rescan</Link>
        <h1 className="text-lg font-bold">Review &amp; Adjust</h1>
        <span className="w-16" />
      </header>

      {scan.suspectedHiddenFats && (
        <div className="mb-4 rounded-xl border border-warn/40 bg-warn/10 p-3 text-xs text-warn">
          ⚠️ AI flagged possible hidden fats (oil sheen, dressings, sauces).
          Review the extras below before saving.
        </div>
      )}
      {scan.unresolvedNames.length > 0 && (
        <div className="mb-4 rounded-xl border border-line bg-surface-raised p-3 text-xs text-muted">
          Couldn&apos;t match: {scan.unresolvedNames.join(", ")}. Macros are 0 —
          edit grams or replace via search.
        </div>
      )}

      <section className="card mb-4 space-y-3">
        <div>
          <label className="label" htmlFor="mealName">Meal name</label>
          <input
            id="mealName"
            className="input"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
          />
        </div>
        <div>
          <span className="label">Meal type</span>
          <div className="grid grid-cols-4 gap-2">
            {(["breakfast", "lunch", "dinner", "snacks"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`btn-ghost !px-1 !text-xs capitalize ${mealType === t ? "!border-accent !text-accent" : ""}`}
                onClick={() => setMealType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <SectionTitle right={<span className="text-xs text-muted">{totals.kcal} kcal total</span>}>
        Items
      </SectionTitle>
      <ul className="mb-4 space-y-2">
        {items.map((item) => {
          const m = itemMacros(item);
          return (
            <li key={item.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {SOURCE_BADGES[item.source]} {item.name}
                  </p>
                  {item.brand && <p className="text-xs text-muted">{item.brand}</p>}
                  <p className="mt-0.5 text-xs text-muted">
                    {m.kcal} kcal · {m.protein}p {m.carbs}c {m.fat}f
                  </p>
                </div>
                <button
                  aria-label={`Delete ${item.name}`}
                  className="rounded-lg px-2 py-1 text-bad hover:bg-bad/10"
                  onClick={() => removeItem(item.id)}
                >
                  ✕
                </button>
              </div>
              <div className="mt-2">
                <GramStepper grams={item.grams} onChange={(g) => updateItem(item.id, { grams: g })} />
              </div>
            </li>
          );
        })}
      </ul>

      <section className="card mb-4">
        <SectionTitle
          right={
            <button className="chip" onClick={() => setShowExtras((v) => !v)}>
              {showExtras ? "Hide" : "Show"}
            </button>
          }
        >
          Hidden fats &amp; extras
        </SectionTitle>
        {showExtras && (
          <div className="flex flex-wrap gap-2">
            {HIDDEN_EXTRA_PRESETS.map((p) => (
              <button key={p.name} className="chip" onClick={() => addHiddenExtra(p)}>
                + {p.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="card mb-4">
        <SectionTitle>Add item (database search)</SectionTitle>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="e.g. greek yogurt"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void runSearch()}
          />
          <button className="btn-ghost !px-3" onClick={runSearch} disabled={searching}>
            {searching ? <Spinner /> : "Find"}
          </button>
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-2 divide-y divide-line">
            {searchResults.map((r, i) => (
              <li key={`${r.fdcId ?? r.name}-${i}`}>
                <button
                  className="w-full py-2 text-left text-sm"
                  onClick={() => addItemFromResult(r)}
                >
                  <span className="font-medium">{r.name}</span>
                  {r.brand && <span className="text-muted"> · {r.brand}</span>}
                  <span className="block text-xs text-muted">
                    {r.per100g.kcal} kcal/100g · {r.per100g.protein}p {r.per100g.carbs}c {r.per100g.fat}f
                    {r.servingGrams ? ` · ${r.servingGrams}g serving` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-line bg-surface/95 p-4 backdrop-blur">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted">Total</span>
          <span className="font-bold">
            {totals.kcal} kcal · {totals.protein}p / {totals.carbs}c / {totals.fat}f
          </span>
        </div>
        <button className="btn-primary w-full" onClick={save} disabled={saving || items.length === 0}>
          {saving ? "Saving…" : "Save to daily log"}
        </button>
      </div>
    </main>
  );
}
