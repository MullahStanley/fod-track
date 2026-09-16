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
import { EmptyState, MacroBar, SectionTitle } from "@/components/ui";
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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm font-bold tracking-widest">fod-track</Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/dashboard/profile" className="chip">
            {profile?.name ? profile.name : "Profile"} ⚙︎
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Summary column */}
        <aside className="space-y-4">
          <section className="card">
            <div className="flex items-center justify-between">
              <button
                className="btn-ghost !px-3 !py-2"
                onClick={() => setDate(shiftDate(date, -1))}
                aria-label="Previous day"
              >
                ←
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold">{formatDayLabel(date)}</p>
                <p className="text-xs text-muted">
                  {date === todayLocalISO() ? "Today" : date}
                </p>
              </div>
              <button
                className="btn-ghost !px-3 !py-2"
                onClick={() => setDate(shiftDate(date, 1))}
                disabled={date >= todayLocalISO()}
                aria-label="Next day"
              >
                →
              </button>
            </div>

            <div className="mt-5 text-center">
              <p className="text-4xl font-bold tracking-tight">
                {totals.kcal}
                <span className="text-lg font-normal text-muted">
                  {" "}
                  / {targets?.targetCalories ?? "–"} kcal
                </span>
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <MacroBar label="Calories" value={totals.kcal} target={targets?.targetCalories ?? 0} unit="kcal" color="rgb(var(--ink))" />
              <MacroBar label="Protein" value={totals.protein} target={targets?.proteinG ?? 0} color="rgb(var(--muted))" />
              <MacroBar label="Carbs" value={totals.carbs} target={targets?.carbsG ?? 0} color="rgb(var(--muted))" />
              <MacroBar label="Fat" value={totals.fat} target={targets?.fatG ?? 0} color="rgb(var(--muted))" />
            </div>
          </section>

          <section className="card">
            <SectionTitle>Quick actions</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/dashboard/scan" className="btn-ghost">📸 Scan</Link>
              <Link href="/dashboard/barcode" className="btn-ghost">🏷️ Barcode</Link>
              <Link href="/dashboard/search" className="btn-ghost">🔍 Search</Link>
              <Link href="/dashboard/profile" className="btn-ghost">🎯 Targets</Link>
            </div>
          </section>
        </aside>

        {/* Meals column */}
        <section>
          <div className="mb-4 flex gap-2">
            <button
              className={`chip ${tab === "today" ? "!border-ink !font-medium" : ""}`}
              onClick={() => setTab("today")}
            >
              Today
            </button>
            <button
              className={`chip ${tab === "history" ? "!border-ink !font-medium" : ""}`}
              onClick={() => setTab("history")}
            >
              History
            </button>
          </div>

          {loading && <p className="text-sm text-muted">Loading…</p>}

          {!loading && tab === "today" && (
            <div>
              <SectionTitle>Meals</SectionTitle>
              {meals.length === 0 ? (
                <EmptyState
                  title="No meals logged yet"
                  hint="Scan, snap, or search to add your first meal."
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
                <EmptyState title="No history yet" hint="Logged meals will appear here." />
              ) : (
                recent.map((dayMeals) => {
                  const t = itemsTotals(dayMeals.flatMap((m) => m.items));
                  const key = dayMeals[0]?.logDate ?? String(dayMeals.length);
                  return (
                    <div key={key} className="card">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold">
                          {formatDayLabel(dayMeals[0]?.logDate ?? "")}
                        </p>
                        <p className="text-sm text-muted">
                          {t.kcal} kcal · {t.protein}p / {t.carbs}c / {t.fat}f
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {dayMeals.length} meal{dayMeals.length === 1 ? "" : "s"} logged
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>

      <TabBar />
    </main>
  );
}

function MealCard({ meal, onDeleted }: { meal: LoggedMeal; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);

  async function remove() {
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

  return (
    <li className="card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{meal.name}</p>
          <p className="text-xs text-muted">
            {meal.mealType} · {meal.items.length} item{meal.items.length === 1 ? "" : "s"}
            {meal.suspectedHiddenFats ? " · hidden fats flagged" : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{meal.totals.kcal} kcal</p>
          <p className="text-xs text-muted">
            {meal.totals.protein}p / {meal.totals.carbs}c / {meal.totals.fat}f
          </p>
        </div>
      </div>
      <button className="btn-danger mt-3 !py-1.5 !text-xs" onClick={remove} disabled={busy}>
        {busy ? "Deleting…" : "Delete"}
      </button>
    </li>
  );
}

function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 text-center text-[11px]">
        <Link href="/dashboard" className="py-2 text-ink">🏠 Today</Link>
        <Link href="/dashboard/scan" className="py-2 text-muted">📸 Scan</Link>
        <Link href="/dashboard/barcode" className="py-2 text-muted">🏷️ Code</Link>
        <Link href="/dashboard/search" className="py-2 text-muted">🔍 Find</Link>
        <Link href="/dashboard/profile" className="py-2 text-muted">🎯 Goals</Link>
      </div>
    </nav>
  );
}
