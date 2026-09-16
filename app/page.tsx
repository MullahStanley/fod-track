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

type Tab = "dashboard" | "history";

function shiftDate(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, (d ?? 1) + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [date, setDate] = useState(todayLocalISO());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [targets, setTargets] = useState<Targets | null>(null);
  const [meals, setMeals] = useState<LoggedMeal[]>([]);
  const [recent, setRecent] = useState<LoggedMeal[][]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, meals] = await Promise.all([
        apiJson<{ profile: Profile; targets: Targets }>("/api/profile"),
        apiJson<{ meals: LoggedMeal[] }>(`/api/logs?date=${date}`),
      ]);
      setProfile(p.profile);
      setTargets(p.targets);
      setMeals(meals.meals);
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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-28 pt-6">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          fod-track
        </p>
        <div className="mt-1 flex items-center justify-between">
          <button
            className="btn-ghost !px-3 !py-2"
            onClick={() => setDate(shiftDate(date, -1))}
            aria-label="Previous day"
          >
            ←
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">{formatDayLabel(date)}</h1>
            {date === todayLocalISO() && (
              <p className="text-xs text-muted">Today</p>
            )}
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
        <div className="mt-3 flex gap-2">
          <button
            className={`chip ${tab === "dashboard" ? "!border-accent !text-accent" : ""}`}
            onClick={() => setTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`chip ${tab === "history" ? "!border-accent !text-accent" : ""}`}
            onClick={() => setTab("history")}
          >
            History
          </button>
        </div>
      </header>

      {loading && <p className="text-sm text-muted">Loading…</p>}

      {!loading && tab === "dashboard" && targets && profile && (
        <>
          <section className="card mb-4">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Calories</p>
                <p className="text-3xl font-bold">
                  {totals.kcal}
                  <span className="ml-1 text-base font-normal text-muted">
                    / {targets.targetCalories} kcal
                  </span>
                </p>
              </div>
              <Link href="/profile" className="chip">
                {profile.name || "Edit profile"} ⚙︎
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              <MacroBar label="Protein" value={totals.protein} target={targets.proteinG} color="#22d3ee" />
              <MacroBar label="Carbs" value={totals.carbs} target={targets.carbsG} color="#34d399" />
              <MacroBar label="Fat" value={totals.fat} target={targets.fatG} color="#fbbf24" />
            </div>
          </section>

          <section>
            <SectionTitle right={<Link href="/scan" className="chip !border-accent !text-accent">+ Scan meal</Link>}>
              Meals
            </SectionTitle>
            {meals.length === 0 ? (
              <EmptyState
                title="No meals logged"
                hint="Use Scan or Search to add your first meal."
              />
            ) : (
              <ul className="space-y-2">
                {meals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} onDeleted={() => void load()} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {!loading && tab === "history" && (
        <section className="space-y-3">
          {recent.length === 0 ? (
            <EmptyState title="No history yet" hint="Logged meals will appear here." />
          ) : (
            recent.map((dayMeals) => {
              const t = itemsTotals(dayMeals.flatMap((m) => m.items));
              return (
                <div key={dayMeals[0]?.logDate ?? Math.random()} className="card">
                  <div className="flex items-baseline justify-between">
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
        </section>
      )}

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
        <div>
          <p className="text-sm font-semibold">{meal.name}</p>
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
      <button
        className="btn-danger mt-3 !py-1.5 !text-xs"
        onClick={remove}
        disabled={busy}
      >
        {busy ? "Deleting…" : "Delete"}
      </button>
    </li>
  );
}

function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <Link href="/" className="text-accent">
          <span className="block text-lg">🏠</span>
          Home
        </Link>
        <Link href="/scan" className="text-slate-300">
          <span className="block text-lg">📸</span>
          Scan
        </Link>
        <Link href="/barcode" className="text-slate-300">
          <span className="block text-lg">🏷️</span>
          Barcode
        </Link>
        <Link href="/profile" className="text-slate-300">
          <span className="block text-lg">⚙️</span>
          Profile
        </Link>
      </div>
    </nav>
  );
}
