"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiJson, type FoodItem, type FoodSearchResult } from "@/lib/client-utils";
import { SectionTitle, Spinner } from "@/components/ui";

const SOURCE_LABEL: Record<FoodSearchResult["source"], string> = {
  local: "🇰🇪 Kenyan Local",
  seed: "📘 Core Food",
  usda: "🌍 USDA",
  openfoodfacts: "🌐 Open Food Facts",
};

const QUICK_FILTERS = [
  { label: "🇰🇪 Ugali & Chapati", query: "ugali" },
  { label: "🥩 Nyama Choma", query: "choma" },
  { label: "🥬 Sukuma & Managu", query: "sukuma" },
  { label: "🫘 Githeri & Ndengu", query: "ndengu" },
  { label: "🍗 Chicken & Tilapia", query: "kuku" },
  { label: "☕ Kenyan Chai & Dawa", query: "chai" },
  { label: "🥚 Boiled Eggs", query: "mayai" },
  { label: "🥑 Avocado & Fruits", query: "avocado" },
];

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Run search
  async function runSearch(queryText: string) {
    const term = queryText.trim();
    if (!term) {
      setResults([]);
      setSearched(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const d = await apiJson<{ results: FoodSearchResult[] }>(
        `/api/foods/search?q=${encodeURIComponent(term)}`
      );
      setResults(d.results);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  // Debounced search on typing
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(() => {
      void runSearch(q);
    }, 280);
    return () => clearTimeout(timer);
  }, [q]);

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
      barcode: r.barcode,
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
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
        <span>/</span>
        <span className="text-ink font-medium">Food Database</span>
      </nav>

      <header className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="chip backdrop-blur-md">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-sm font-bold tracking-widest text-ink">
            FOOD & NUTRITION DATABASE
          </h1>
        </div>
        <span className="w-24" />
      </header>

      {/* Search Input Card */}
      <section className="card mb-4 border-line bg-surface-raised/85 shadow-2xl backdrop-blur-xl">
        <div className="relative flex gap-2">
          <input
            className="input !py-3 !text-base"
            placeholder="Search ugali, sukuma, nyama choma, githeri, chicken, omena…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void runSearch(q)}
            autoFocus
          />
          {busy && (
            <div className="absolute right-3 top-3.5">
              <Spinner className="h-5 w-5 border-emerald-400" />
            </div>
          )}
        </div>

        {/* Quick Filter Categories */}
        <div className="mt-3 pt-3 border-t border-line/60">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Popular Kenyan categories:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.query}
                type="button"
                className={`chip text-[11px] transition ${
                  q === f.query
                    ? "!border-emerald-400 !bg-emerald-500/20 text-emerald-300 font-bold"
                    : "hover:border-emerald-400/50 hover:text-emerald-300"
                }`}
                onClick={() => {
                  setQ(f.query);
                  void runSearch(f.query);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 text-xs text-muted">
          ⚡ 100+ local Kenyan staples indexed offline first, with instant fallback to
          USDA and Open Food Facts.
        </p>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-bad/40 bg-bad/10 p-3 text-xs text-bad">
          {error}
        </div>
      )}

      {/* Empty State when no results */}
      {searched && results.length === 0 && !busy && (
        <div className="card text-center py-10">
          <p className="text-sm font-semibold text-ink">No foods matched &ldquo;{q}&rdquo;</p>
          <p className="mt-1 text-xs text-muted">
            Try a broader word like &ldquo;choma&rdquo;, &ldquo;ugali&rdquo;, &ldquo;rice&rdquo;, or &ldquo;egg&rdquo;.
          </p>
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 && (
        <section className="space-y-3">
          <SectionTitle
            right={
              <span className="text-xs font-mono text-muted">
                {results.length} item{results.length === 1 ? "" : "s"} found
              </span>
            }
          >
            Search Results
          </SectionTitle>

          <ul className="grid gap-3 sm:grid-cols-2">
            {results.map((r, i) => (
              <li
                key={`${r.fdcId ?? r.barcode ?? r.source}-${r.name}-${i}`}
                className="card border-line hover:border-emerald-400/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-ink truncate">{r.name}</p>
                      <p className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                        <span className="chip !py-0 !px-1.5 !text-[10px]">
                          {SOURCE_LABEL[r.source]}
                        </span>
                        {r.brand && <span className="truncate">{r.brand}</span>}
                      </p>
                    </div>

                    <button
                      className="btn-primary !py-1.5 !px-3 !text-xs shrink-0"
                      onClick={() => pick(r)}
                    >
                      + Add
                    </button>
                  </div>

                  {/* Nutrition chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                    <span className="chip !text-[10px] !border-emerald-500/30 text-emerald-400 font-bold">
                      {r.per100g.kcal} kcal/100g
                    </span>
                    <span className="chip !text-[10px] !border-cyan-500/20 text-cyan-300">
                      {r.per100g.protein}g P
                    </span>
                    <span className="chip !text-[10px] !border-amber-500/20 text-amber-300">
                      {r.per100g.carbs}g C
                    </span>
                    <span className="chip !text-[10px] !border-rose-500/20 text-rose-300">
                      {r.per100g.fat}g F
                    </span>
                  </div>
                </div>

                {r.servingGrams && (
                  <p className="mt-2 pt-2 border-t border-line/40 text-[10px] text-muted">
                    Standard serving: {r.servingGrams}g (
                    {Math.round((r.per100g.kcal * r.servingGrams) / 100)} kcal)
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
