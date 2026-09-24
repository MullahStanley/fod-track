"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiJson, type FoodItem, type FoodSearchResult } from "@/lib/client-utils";
import { SectionTitle, Spinner } from "@/components/ui";

type SearchMode = "all" | "local" | "ai" | "online";

const SOURCE_LABEL: Record<FoodSearchResult["source"], string> = {
  local: "🇰🇪 Kenyan Local",
  seed: "📘 Core Food",
  usda: "🌍 USDA FDC",
  openfoodfacts: "🌐 Open Food Facts",
  ai: "✨ AI Assistant (Local Dialect)",
};

const SOURCE_CHIP_STYLE: Record<FoodSearchResult["source"], string> = {
  local: "!border-emerald-500/30 text-emerald-400 !bg-emerald-500/10",
  seed: "!border-blue-500/30 text-blue-400 !bg-blue-500/10",
  usda: "!border-cyan-500/30 text-cyan-400 !bg-cyan-500/10",
  openfoodfacts: "!border-teal-500/30 text-teal-400 !bg-teal-500/10",
  ai: "!border-purple-500/40 text-purple-300 !bg-purple-500/15 font-bold",
};

const POPULAR_LOCAL_FILTERS = [
  { label: "🇰🇪 Mursik & Wimbi", query: "mursik" },
  { label: "🥩 Nyama & Choma", query: "choma" },
  { label: "🥬 Sukuma, Terere & Managu", query: "terere" },
  { label: "🫘 Githeri & Kamande", query: "kamande" },
  { label: "🍗 Aliadho & Ingokho", query: "aliadho" },
  { label: "☕ Kenyan Chai & Dawa", query: "dawa" },
  { label: "🥚 Mayai Boiro / Pasua", query: "mayai" },
  { label: "🥥 Kaimati & Vibibi", query: "kaimati" },
];

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [mode, setMode] = useState<SearchMode>("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [onlineAvailable, setOnlineAvailable] = useState(true);

  // Run search
  async function runSearch(queryText: string, searchMode: SearchMode = mode) {
    const term = queryText.trim();
    if (!term) {
      setResults([]);
      setSearched(false);
      return;
    }
    setBusy(true);
    setError(null);

    const params = new URLSearchParams({ q: term });
    if (searchMode === "ai") {
      params.set("ai", "1");
    } else if (searchMode === "local") {
      params.set("online", "0");
      params.set("ai", "0");
    } else if (searchMode === "online") {
      params.set("online", "1");
      params.set("ai", "0");
    } else {
      params.set("online", "1");
      params.set("ai", "auto");
    }

    try {
      const d = await apiJson<{
        results: FoodSearchResult[];
        aiAvailable?: boolean;
        onlineAvailable?: boolean;
      }>(`/api/foods/search?${params.toString()}`);

      setResults(d.results ?? []);
      if (typeof d.aiAvailable === "boolean") setAiAvailable(d.aiAvailable);
      if (typeof d.onlineAvailable === "boolean") setOnlineAvailable(d.onlineAvailable);
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
      void runSearch(q, mode);
    }, 320);
    return () => clearTimeout(timer);
  }, [q, mode]);

  function pick(r: FoodSearchResult) {
    const item: FoodItem = {
      id: `s_${Date.now().toString(36)}`,
      name: r.name,
      brand: r.brand,
      per100g: r.per100g,
      servingMultiplier: 1,
      servingGrams: r.servingGrams,
      grams: r.servingGrams ?? 100,
      source: r.source === "ai" ? "ai" : "search",
      fdcId: r.fdcId,
      barcode: r.barcode,
      localOrigin: r.localOrigin,
      culturalNotes: r.culturalNotes,
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

      {/* Search Input & Source Toggles Card */}
      <section className="card mb-4 border-line bg-surface-raised/85 shadow-2xl backdrop-blur-xl">
        <div className="relative flex gap-2">
          <input
            className="input !py-3 !text-base"
            placeholder="Search ugali, mursik, kamande, aliadho, kuku choma, cheddar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void runSearch(q, mode)}
            autoFocus
          />
          {busy && (
            <div className="absolute right-3 top-3.5">
              <Spinner className="h-5 w-5 border-emerald-400" />
            </div>
          )}
        </div>

        {/* Search Mode Tabs */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line/50 pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted mr-1">
            Search mode:
          </span>
          {[
            { id: "all" as const, label: "✨ All Sources (Smart Merge)" },
            { id: "local" as const, label: "🇰🇪 Local Kenya (Offline)" },
            { id: "ai" as const, label: "✨ AI Local Dialects" },
            { id: "online" as const, label: "🌍 Online (USDA & OFF)" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              className={`chip text-[11px] transition ${
                mode === m.id
                  ? "!border-emerald-400 !bg-emerald-500/20 text-emerald-300 font-bold"
                  : "hover:border-line text-muted hover:text-ink"
              }`}
              onClick={() => {
                setMode(m.id);
                if (q.trim()) void runSearch(q, m.id);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Quick Filter Categories */}
        <div className="mt-3 pt-3 border-t border-line/50">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Popular Kenyan staples & regional dishes:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_LOCAL_FILTERS.map((f) => (
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
                  void runSearch(f.query, mode);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info & Status row */}
        <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-muted border-t border-line/40 pt-2.5">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            100+ local staples indexed offline
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${onlineAvailable ? "bg-cyan-400" : "bg-muted"}`} />
            USDA FoodData Central: {onlineAvailable ? "Active" : "Offline"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${aiAvailable ? "bg-purple-400 animate-pulse" : "bg-muted"}`} />
            AI Local Dialect Assistant: {aiAvailable ? "Active" : "Off"}
          </span>
        </div>
      </section>

      {/* Explicit On-Demand AI Query Bar */}
      {q.trim().length >= 2 && mode !== "ai" && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2.5 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2 text-purple-300">
            <span>✨</span>
            <span>Query written in local language, Sheng, or regional dialect?</span>
          </div>
          <button
            type="button"
            className="chip !border-purple-500/40 text-purple-300 hover:bg-purple-500/20 font-bold shrink-0"
            onClick={() => {
              setMode("ai");
              void runSearch(q, "ai");
            }}
            disabled={busy}
          >
            Ask AI Assistant →
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-bad/40 bg-bad/10 p-3 text-xs text-bad">
          {error}
        </div>
      )}

      {/* Empty State with AI Resolution Fallback */}
      {searched && results.length === 0 && !busy && (
        <div className="card text-center py-8 border-line bg-surface-raised/90 shadow-xl">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500/20 to-emerald-500/20 border border-purple-500/30 text-2xl">
            ✨
          </div>
          <p className="text-sm font-bold text-ink">No exact database entry for &ldquo;{q}&rdquo;</p>
          <p className="mt-1 text-xs text-muted max-w-md mx-auto leading-relaxed">
            If this dish is written in Swahili, Sheng, Kikuyu, Luo, Luhya, Kalenjin, or another dialect,
            our AI Food Assistant can identify the ingredients and calculate nutrition based on Kenyan culinary recipes.
          </p>
          <button
            type="button"
            onClick={() => {
              setMode("ai");
              void runSearch(q, "ai");
            }}
            className="btn-primary mt-4 mx-auto !py-2.5 !px-5 text-xs font-bold shadow-lg shadow-purple-500/20 bg-gradient-to-r from-purple-600 via-emerald-600 to-teal-600 hover:from-purple-500 hover:to-emerald-500"
          >
            ✨ Ask AI to Translate & Calculate Nutrition for &ldquo;{q}&rdquo;
          </button>
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
                className={`card transition-all flex flex-col justify-between ${
                  r.source === "ai"
                    ? "border-purple-500/40 bg-purple-500/5 hover:border-purple-400 shadow-lg shadow-purple-950/10"
                    : "border-line hover:border-emerald-400/30"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-ink truncate">{r.name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={`chip !py-0 !px-1.5 !text-[10px] ${SOURCE_CHIP_STYLE[r.source]}`}>
                          {SOURCE_LABEL[r.source]}
                        </span>
                        {r.brand && (
                          <span className="text-[11px] text-muted truncate">
                            {r.brand}
                          </span>
                        )}
                        {r.localOrigin && (
                          <span className="chip !py-0 !px-1.5 !text-[10px] !border-purple-500/30 text-purple-300">
                            📍 {r.localOrigin}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      className="btn-primary !py-1.5 !px-3 !text-xs shrink-0"
                      onClick={() => pick(r)}
                    >
                      + Add
                    </button>
                  </div>

                  {/* Cultural Notes / Description for local dishes */}
                  {r.culturalNotes && (
                    <p className="mt-2 text-[11px] text-muted leading-relaxed line-clamp-2 italic border-l-2 border-purple-500/40 pl-2">
                      {r.culturalNotes}
                    </p>
                  )}

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
