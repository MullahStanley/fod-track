"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  apiJson,
  formatDayLabel,
  itemsTotals,
  todayLocalISO,
  type LoggedMeal,
  type Profile,
  type Targets,
} from "@/lib/client-utils";
import {
  CalorieProgressRing,
  EmptyState,
  MacroBar,
  SectionTitle,
  Spinner,
  WaterTracker,
} from "@/components/ui";
import { ThemeToggle } from "@/components/theme";

type Tab = "today" | "history";

function shiftDate(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, (d ?? 1) + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [date, setDate] = useState(todayLocalISO());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [targets, setTargets] = useState<Targets | null>(null);
  const [meals, setMeals] = useState<LoggedMeal[]>([]);
  const [recent, setRecent] = useState<LoggedMeal[][]>([]);
  const [loading, setLoading] = useState(true);
  const [waterMl, setWaterMl] = useState(1250);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Load water intake from localStorage for selected date
  useEffect(() => {
    try {
      const savedWater = localStorage.getItem(`fodtrack_water_${date}`);
      if (savedWater) setWaterMl(Number(savedWater));
      else setWaterMl(0);
    } catch {
      // ignore
    }
  }, [date]);

  const updateWater = (newMl: number) => {
    setWaterMl(newMl);
    try {
      localStorage.setItem(`fodtrack_water_${date}`, String(newMl));
    } catch {
      // ignore
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        apiJson<{ profile: Profile; targets: Targets }>("/api/profile"),
        apiJson<{ meals: LoggedMeal[] }>(`/api/logs?date=${date}`),
      ]);
      setProfile(p.profile);
      setTargets(p.targets);
      setMeals(m.meals);
      if (tab === "history") {
        const h = await apiJson<{ days: LoggedMeal[][] }>(`/api/logs?days=14`);
        setRecent(h.days);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [date, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = itemsTotals(meals.flatMap((m) => m.items));
  const targetKcal = targets?.targetCalories ?? 2000;
  const isToday = date === todayLocalISO();

  // Export meals data as JSON
  const handleExportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      profile,
      targets,
      selectedDate: date,
      dayMeals: meals,
      allRecentHistory: recent,
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fodtrack_export_${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6">
      {/* Top Header */}
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 font-black text-slate-950 shadow-md shadow-emerald-500/30">
            F
          </span>
          <span className="text-sm font-extrabold tracking-widest text-ink">
            fod-track
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/dashboard/profile"
            className="chip !border-white/10 hover:!border-emerald-400/50 transition font-medium"
          >
            {profile?.name ? profile.name : "Profile"} ⚙︎
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left Column: Daily Target Summary & Quick Actions */}
        <aside className="space-y-4">
          <section className="card border-white/15 bg-surface-raised/85 shadow-2xl backdrop-blur-xl">
            {/* Day Switcher */}
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <button
                className="btn-ghost !h-8 !w-8 !p-0 text-sm font-bold"
                onClick={() => setDate(shiftDate(date, -1))}
                aria-label="Previous day"
              >
                ←
              </button>
              <div className="text-center">
                <p className="text-sm font-bold text-ink">{formatDayLabel(date)}</p>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isToday ? "bg-emerald-400 animate-pulse" : "bg-muted"
                    }`}
                  />
                  <p className="text-[11px] font-medium text-muted">
                    {isToday ? "Today" : date}
                  </p>
                </div>
              </div>
              <button
                className="btn-ghost !h-8 !w-8 !p-0 text-sm font-bold"
                onClick={() => setDate(shiftDate(date, 1))}
                disabled={date >= todayLocalISO()}
                aria-label="Next day"
              >
                →
              </button>
            </div>

            {/* Circular Calorie Ring with Glowing Highlights */}
            <div className="my-5 flex justify-center">
              <CalorieProgressRing
                current={totals.kcal}
                target={targetKcal}
                size={160}
                strokeWidth={12}
              />
            </div>

            {/* Macro Breakdown Progress Bars */}
            <div className="space-y-3.5 pt-2">
              <MacroBar
                label="Protein"
                value={totals.protein}
                target={targets?.proteinG ?? 150}
                color="#06b6d4"
                glowColor="#22d3ee"
              />
              <MacroBar
                label="Carbohydrates"
                value={totals.carbs}
                target={targets?.carbsG ?? 200}
                color="#f59e0b"
                glowColor="#fbbf24"
              />
              <MacroBar
                label="Fats"
                value={totals.fat}
                target={targets?.fatG ?? 60}
                color="#f43f5e"
                glowColor="#fb7185"
              />
            </div>
          </section>

          {/* Daily Water Tracker */}
          <WaterTracker
            intakeMl={waterMl}
            targetMl={2500}
            onUpdate={updateWater}
          />

          {/* Quick Actions Card */}
          <section className="card border-white/10 bg-surface-raised/80">
            <SectionTitle>Quick actions</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/scan"
                className="btn-ghost !justify-start gap-2 hover:!border-emerald-400/50"
              >
                <span>📸</span> <span>AI Scan</span>
              </Link>
              <Link
                href="/dashboard/barcode"
                className="btn-ghost !justify-start gap-2 hover:!border-emerald-400/50"
              >
                <span>🏷️</span> <span>Barcode</span>
              </Link>
              <Link
                href="/dashboard/search"
                className="btn-ghost !justify-start gap-2 hover:!border-emerald-400/50"
              >
                <span>🔍</span> <span>Search DB</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowQuickAdd(true)}
                className="btn-ghost !justify-start gap-2 hover:!border-emerald-400/50 text-emerald-400 font-semibold"
              >
                <span>⚡</span> <span>Quick Add</span>
              </button>
            </div>
          </section>

          {/* Export & Data ownership */}
          <div className="flex items-center justify-between px-1 text-xs text-muted">
            <button
              type="button"
              onClick={handleExportData}
              className="hover:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              📥 Export day log (JSON)
            </button>
            <span>Kenyan Local-First</span>
          </div>
        </aside>

        {/* Right Column: Meals List & History */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <div className="flex gap-2">
              <button
                className={`chip !px-4 !py-1.5 font-semibold transition ${
                  tab === "today"
                    ? "!border-emerald-400 !bg-emerald-500/20 !text-emerald-300 ring-1 ring-emerald-400/40"
                    : "text-muted hover:text-ink"
                }`}
                onClick={() => setTab("today")}
              >
                Today ({meals.length})
              </button>
              <button
                className={`chip !px-4 !py-1.5 font-semibold transition ${
                  tab === "history"
                    ? "!border-emerald-400 !bg-emerald-500/20 !text-emerald-300 ring-1 ring-emerald-400/40"
                    : "text-muted hover:text-ink"
                }`}
                onClick={() => setTab("history")}
              >
                14-Day History
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowQuickAdd(true)}
              className="chip !border-emerald-500/40 !bg-emerald-500/10 text-emerald-300 font-bold hover:bg-emerald-500/20 hidden sm:inline-flex items-center gap-1"
            >
              + Quick Add
            </button>
          </div>

          {loading && (
            <div className="card text-center py-12">
              <Spinner className="h-6 w-6 border-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-muted">Loading nutrition logs…</p>
            </div>
          )}

          {!loading && tab === "today" && (
            <div>
              <SectionTitle
                right={
                  <span className="text-xs font-mono font-semibold text-muted">
                    Total: {totals.kcal} kcal
                  </span>
                }
              >
                Meals Logged
              </SectionTitle>

              {meals.length === 0 ? (
                <EmptyState
                  title="No meals logged for this day"
                  hint="Snap a photo of your plate, scan a barcode, or search local Kenyan foods."
                  action={
                    <div className="flex justify-center gap-2">
                      <Link href="/dashboard/scan" className="btn-primary !py-2 !text-xs">
                        📸 Snap meal
                      </Link>
                      <Link href="/dashboard/barcode" className="btn-ghost !py-2 !text-xs">
                        🏷️ Scan barcode
                      </Link>
                    </div>
                  }
                />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {meals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} onDeleted={() => void load()} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {!loading && tab === "history" && (
            <div className="space-y-3">
              {recent.length === 0 ? (
                <EmptyState
                  title="No history recorded yet"
                  hint="Your previous logged meals and macro trends will automatically appear here."
                />
              ) : (
                recent.map((dayMeals) => {
                  const t = itemsTotals(dayMeals.flatMap((m) => m.items));
                  const dayDate = dayMeals[0]?.logDate ?? "";
                  return (
                    <div
                      key={dayDate}
                      className="card hover:border-emerald-400/30 cursor-pointer transition"
                      onClick={() => {
                        setDate(dayDate);
                        setTab("today");
                      }}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          <p className="text-sm font-bold text-ink">
                            {formatDayLabel(dayDate)}
                          </p>
                          <span className="text-[11px] font-mono text-muted">
                            ({dayDate})
                          </span>
                        </div>
                        <p className="font-mono text-xs font-semibold text-emerald-400">
                          {t.kcal} kcal
                        </p>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="chip !text-[11px] !border-cyan-500/20 text-cyan-300">
                          {t.protein}g protein
                        </span>
                        <span className="chip !text-[11px] !border-amber-500/20 text-amber-300">
                          {t.carbs}g carbs
                        </span>
                        <span className="chip !text-[11px] !border-rose-500/20 text-rose-300">
                          {t.fat}g fat
                        </span>
                        <span className="text-xs text-muted ml-auto">
                          {dayMeals.length} meal{dayMeals.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>

      {/* Quick Add Meal Modal */}
      {showQuickAdd && (
        <QuickAddModal
          date={date}
          onClose={() => setShowQuickAdd(false)}
          onSuccess={() => {
            setShowQuickAdd(false);
            void load();
          }}
        />
      )}

      {/* Mobile Tab Navigation */}
      <TabBar />
    </main>
  );
}

/** Detailed MealCard with expandable ingredient breakdown and delete action. */
function MealCard({ meal, onDeleted }: { meal: LoggedMeal; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function remove() {
    if (!confirm(`Delete "${meal.name}"?`)) return;
    setBusy(true);
    try {
      await apiJson(`/api/logs?id=${meal.id}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  const mealTypeEmoji: Record<string, string> = {
    breakfast: "🌅",
    lunch: "☀️",
    dinner: "🌙",
    snacks: "🍎",
  };

  return (
    <li className="card border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{mealTypeEmoji[meal.mealType] ?? "🍽️"}</span>
              <p className="truncate text-sm font-bold text-ink">{meal.name}</p>
            </div>
            <p className="text-[11px] text-muted capitalize mt-0.5">
              {meal.mealType} · {meal.items.length} item{meal.items.length === 1 ? "" : "s"}
              {meal.suspectedHiddenFats ? " · ⚠ hidden fats" : ""}
            </p>
          </div>

          <div className="text-right">
            <p className="font-mono text-base font-extrabold text-emerald-400">
              {meal.totals.kcal} <span className="text-xs text-muted font-normal">kcal</span>
            </p>
          </div>
        </div>

        {/* Macro Pill Indicators */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          <span className="chip !text-[10px] !border-cyan-500/20 text-cyan-300">
            {meal.totals.protein}g P
          </span>
          <span className="chip !text-[10px] !border-amber-500/20 text-amber-300">
            {meal.totals.carbs}g C
          </span>
          <span className="chip !text-[10px] !border-rose-500/20 text-rose-300">
            {meal.totals.fat}g F
          </span>
        </div>

        {/* Expandable item list */}
        {expanded && (
          <div className="mt-3 space-y-1.5 border-t border-line/60 pt-2.5">
            {meal.items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                <span className="truncate pr-2">{it.name} ({it.grams}g)</span>
                <span className="font-mono text-[11px] text-muted shrink-0">
                  {Math.round((it.per100g.kcal * it.grams) / 100)} kcal
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line/50 pt-2.5">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-muted hover:text-ink font-medium"
        >
          {expanded ? "Hide ingredients ↑" : `View ${meal.items.length} ingredients ↓`}
        </button>

        <button
          className="btn-danger !py-1 !px-2.5 !text-[11px]"
          onClick={remove}
          disabled={busy}
        >
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
    </li>
  );
}

/** Quick Add Modal for instant custom calorie & macro entry. */
function QuickAddModal({
  date,
  onClose,
  onSuccess,
}: {
  date: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snacks">("lunch");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const caloriesNum = Number(kcal);
    if (!name.trim()) {
      setError("Please provide a meal name.");
      return;
    }
    if (!Number.isFinite(caloriesNum) || caloriesNum < 1) {
      setError("Please enter valid calories (> 0).");
      return;
    }

    setBusy(true);
    setError(null);

    const p = Number(protein) || 0;
    const c = Number(carbs) || 0;
    const f = Number(fat) || 0;

    try {
      await apiJson("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo",
          logDate: date,
          mealType,
          name: name.trim(),
          entrySource: "manual",
          suspectedHiddenFats: false,
          items: [
            {
              name: name.trim(),
              per100g: {
                kcal: Math.min(950, caloriesNum),
                protein: Math.min(100, p),
                carbs: Math.min(100, c),
                fat: Math.min(100, f),
              },
              servingMultiplier: 1,
              servingGrams: 100,
              grams: 100,
              source: "manual",
            },
          ],
        }),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add meal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="card w-full max-w-md border-white/20 bg-slate-950/90 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <span>⚡</span> Quick Add Calories & Macros
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-bad/10 border border-bad/30 p-2.5 text-xs text-bad">
            {error}
          </div>
        )}

        <div className="space-y-3.5">
          <div>
            <label className="label" htmlFor="quick-name">Meal description</label>
            <input
              id="quick-name"
              className="input"
              placeholder="e.g. Avocado Toast or Protein Shake"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <span className="label">Meal type</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(["breakfast", "lunch", "dinner", "snacks"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMealType(t)}
                  className={`chip !justify-center capitalize !text-[11px] ${
                    mealType === t ? "!border-emerald-400 !bg-emerald-500/20 !text-emerald-300 font-bold" : ""
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="quick-kcal">Calories (kcal) *</label>
              <input
                id="quick-kcal"
                type="number"
                className="input font-mono font-bold text-emerald-400"
                placeholder="e.g. 450"
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="quick-protein">Protein (g)</label>
              <input
                id="quick-protein"
                type="number"
                className="input font-mono text-cyan-400"
                placeholder="e.g. 30"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="quick-carbs">Carbs (g)</label>
              <input
                id="quick-carbs"
                type="number"
                className="input font-mono text-amber-400"
                placeholder="e.g. 45"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="quick-fat">Fat (g)</label>
              <input
                id="quick-fat"
                type="number"
                className="input font-mono text-rose-400"
                placeholder="e.g. 15"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="btn-ghost flex-1"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={handleSave}
              disabled={busy}
            >
              {busy ? "Saving…" : "Save to log"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/85 backdrop-blur-xl sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 text-center text-[10px] py-1">
        <Link href="/dashboard" className="flex flex-col items-center py-1 text-emerald-400 font-bold">
          <span className="text-base">🏠</span>
          <span>Today</span>
        </Link>
        <Link href="/dashboard/scan" className="flex flex-col items-center py-1 text-muted hover:text-slate-200">
          <span className="text-base">📸</span>
          <span>AI Scan</span>
        </Link>
        <Link href="/dashboard/barcode" className="flex flex-col items-center py-1 text-muted hover:text-slate-200">
          <span className="text-base">🏷️</span>
          <span>Barcode</span>
        </Link>
        <Link href="/dashboard/search" className="flex flex-col items-center py-1 text-muted hover:text-slate-200">
          <span className="text-base">🔍</span>
          <span>Search</span>
        </Link>
        <Link href="/dashboard/profile" className="flex flex-col items-center py-1 text-muted hover:text-slate-200">
          <span className="text-base">🎯</span>
          <span>Goals</span>
        </Link>
      </div>
    </nav>
  );
}
