"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  apiJson,
  todayLocalISO,
  type FoodItem,
  type FoodSearchResult,
} from "@/lib/client-utils";
import { SectionTitle, Spinner } from "@/components/ui";

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function run() {
    if (!q.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const d = await apiJson<{ results: FoodSearchResult[] }>(
        `/api/foods/search?q=${encodeURIComponent(q.trim())}`
      );
      setResults(d.results);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  async function quickAdd(r: FoodSearchResult) {
    const item: FoodItem = {
      id: `s_${Date.now().toString(36)}`,
      name: r.name,
      brand: r.brand,
      per100g: r.per100g,
      servingMultiplier: 1,
      servingGrams: r.servingGrams,
      grams: r.servingGrams ?? 100,
      source: "search",
      fdcId: r.fdcId,
    };
    // Route through the review screen so grams stay editable before saving.
    sessionStorage.setItem(
      "fodtrack_scan",
      JSON.stringify({
        mealName: r.name,
        items: [item],
        suspectedHiddenFats: false,
        unresolvedNames: [],
      })
    );
    router.push("/review");
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-28 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <Link href="/" className="chip">← Back</Link>
        <h1 className="text-lg font-bold">Search Foods</h1>
        <span className="w-14" />
      </header>

      <section className="card mb-4">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Search 'chicken breast', 'greek yogurt'…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void run()}
          />
          <button className="btn-primary !px-4" onClick={run} disabled={busy || !q.trim()}>
            {busy ? <Spinner /> : "Go"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Searches USDA FoodData Central (when configured) with an offline seed
          database as fallback.
        </p>
      </section>

      {error && <p className="mb-3 text-sm text-bad">{error}</p>}

      {searched && results.length === 0 && !busy && (
        <p className="card text-sm text-muted">No matches. Try a broader term.</p>
      )}

      {results.length > 0 && (
        <section>
          <SectionTitle>Results</SectionTitle>
          <ul className="space-y-2">
            {results.map((r, i) => (
              <li key={`${r.fdcId ?? "s"}-${i}`} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    {r.brand && <p className="text-xs text-muted">{r.brand}</p>}
                    <p className="text-xs text-muted">
                      {r.per100g.kcal} kcal/100g · {r.per100g.protein}p {r.per100g.carbs}c {r.per100g.fat}f
                      {r.servingGrams ? ` · ${r.servingGrams}g serving` : ""}
                    </p>
                  </div>
                  <button className="chip !border-accent !text-accent" onClick={() => void quickAdd(r)}>
                    Add
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
