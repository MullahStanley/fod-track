"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiJson, type FoodItem, type FoodSearchResult } from "@/lib/client-utils";
import { SectionTitle, Spinner } from "@/components/ui";

const SOURCE_LABEL: Record<FoodSearchResult["source"], string> = {
  local: "🇰🇪 Local",
  seed: "📘 Core",
  usda: "🌍 USDA",
  openfoodfacts: "🌐 OFF",
};

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

  function pick(r: FoodSearchResult) {
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
    sessionStorage.setItem(
      "fodtrack_scan",
      JSON.stringify({
        mealName: r.name,
        items: [item],
        suspectedHiddenFats: false,
        unresolvedNames: [],
      })
    );
    router.push("/dashboard/review");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="chip">← Dashboard</Link>
        <h1 className="text-sm font-bold tracking-widest">FOOD DATABASE</h1>
        <span className="w-24" />
      </header>

      <section className="card mb-4">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="ugali, sukuma, chicken, githeri…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void run()}
          />
          <button className="btn-primary !px-4" onClick={run} disabled={busy || !q.trim()}>
            {busy ? <Spinner /> : "Search"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Kenyan local foods first (ugali, sukuma wiki, nyama choma, omena…),
          then core foods, USDA, and Open Food Facts. Local results work offline.
        </p>
      </section>

      {error && <p className="mb-3 text-sm text-bad">{error}</p>}

      {searched && results.length === 0 && !busy && (
        <p className="card text-sm text-muted">No matches. Try a broader term.</p>
      )}

      {results.length > 0 && (
        <section>
          <SectionTitle>{results.length} results</SectionTitle>
          <ul className="grid gap-2 sm:grid-cols-2">
            {results.map((r, i) => (
              <li key={`${r.fdcId ?? r.source}-${i}`} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted">
                      {SOURCE_LABEL[r.source]}
                      {r.brand ? ` · ${r.brand}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {r.per100g.kcal} kcal/100g · {r.per100g.protein}p {r.per100g.carbs}c {r.per100g.fat}f
                      {r.servingGrams ? ` · ${r.servingGrams}g serving` : ""}
                    </p>
                  </div>
                  <button className="chip !border-ink !font-medium" onClick={() => pick(r)}>
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
