"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiJson, type Profile, type Targets } from "@/lib/client-utils";
import { SectionTitle, Spinner } from "@/components/ui";
import { ThemeToggle } from "@/components/theme";

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary", hint: "Desk job, little to no exercise (×1.20)" },
  { value: "lightly_active", label: "Lightly Active", hint: "Light exercise 1-3 days/wk (×1.375)" },
  { value: "moderately_active", label: "Moderately Active", hint: "Moderate exercise 3-5 days/wk (×1.55)" },
  { value: "very_active", label: "Very Active", hint: "Hard exercise 6-7 days/wk (×1.725)" },
  { value: "extremely_active", label: "Extremely Active", hint: "Physical job or athlete (×1.90)" },
] as const;

const GOAL_OPTIONS = [
  { value: "fat_loss", label: "Fat Loss", hint: "−500 kcal deficit" },
  { value: "maintenance", label: "Maintenance", hint: "±0 kcal baseline" },
  { value: "muscle_gain", label: "Muscle Gain", hint: "+400 kcal surplus" },
] as const;

export default function ProfilePage() {
  const [form, setForm] = useState<Profile | null>(null);
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [targets, setTargets] = useState<Targets | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<{ profile: Profile; targets: Targets }>("/api/profile")
      .then((d) => {
        setForm(d.profile);
        setTargets(d.targets);
      })
      .catch((e) => setError(String(e)));
  }, []);

  if (!form) {
    return (
      <main className="relative z-10 mx-auto max-w-md px-4 py-24 text-center">
        <Spinner className="h-8 w-8 border-emerald-400 mx-auto mb-3" />
        <p className="text-xs text-muted">Loading your metabolic profile…</p>
      </main>
    );
  }

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setSaved(false);
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const d = await apiJson<{ profile: Profile; targets: Targets }>("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sex: form.sex,
          age: form.age,
          weightKg: form.weightKg,
          heightCm: form.heightCm,
          activity: form.activity,
          goal: form.goal,
          calorieAdjustmentOverride: form.calorieAdjustmentOverride,
          preset: form.preset,
          customSplit: form.customSplit,
          proteinGPerKg: form.proteinGPerKg,
        }),
      });
      setForm(d.profile);
      setTargets(d.targets);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const lbs = Math.round((form.weightKg / 0.45359237) * 10) / 10;
  const totalInches = form.heightCm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches - ft * 12) * 10) / 10;

  // BMI Calculation
  const heightM = form.heightCm / 100;
  const bmi = heightM > 0 ? Math.round((form.weightKg / (heightM * heightM)) * 10) / 10 : 0;
  const bmiCategory =
    bmi < 18.5
      ? { label: "Underweight", color: "text-amber-400 border-amber-500/30" }
      : bmi < 25
        ? { label: "Normal weight", color: "text-emerald-400 border-emerald-500/30" }
        : bmi < 30
          ? { label: "Overweight", color: "text-amber-400 border-amber-500/30" }
          : { label: "Obese", color: "text-rose-400 border-rose-500/30" };

  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-28 pt-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
        <span>/</span>
        <span className="text-ink font-medium">Metabolic Profile</span>
      </nav>

      <header className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="chip backdrop-blur-md">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-sm font-bold tracking-widest text-ink">
            METABOLIC PROFILE & TARGETS
          </h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Target Results Top Summary Bar */}
      {targets && (
        <section className="card mb-6 border-line bg-surface-raised/85 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/50 pb-3">
            <div>
              <h2 className="text-base font-bold text-ink">Daily Nutrition Targets</h2>
              <p className="text-xs text-muted">
                Calculated deterministically using Mifflin-St Jeor metabolic model
              </p>
            </div>
            <span className={`chip !text-[11px] font-semibold ${bmiCategory.color}`}>
              BMI: {bmi} ({bmiCategory.label})
            </span>
          </div>

          {(() => {
            const pKcal = Math.round(targets.proteinG * 4);
            const cKcal = Math.round(targets.carbsG * 4);
            const fKcal = Math.round(targets.fatG * 9);
            return (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Daily Goal
                  </span>
                  <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5">
                    {targets.targetCalories}
                  </p>
                  <span className="text-[10px] text-muted">kcal / day</span>
                </div>

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                    Protein
                  </span>
                  <p className="text-2xl font-extrabold text-cyan-400 font-mono mt-0.5">
                    {targets.proteinG}g
                  </p>
                  <span className="text-[10px] text-muted">
                    {pKcal} kcal ({Math.round((pKcal / Math.max(1, targets.targetCalories)) * 100)}%)
                  </span>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Carbs
                  </span>
                  <p className="text-2xl font-extrabold text-amber-400 font-mono mt-0.5">
                    {targets.carbsG}g
                  </p>
                  <span className="text-[10px] text-muted">
                    {cKcal} kcal ({Math.round((cKcal / Math.max(1, targets.targetCalories)) * 100)}%)
                  </span>
                </div>

                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    Fats
                  </span>
                  <p className="text-2xl font-extrabold text-rose-400 font-mono mt-0.5">
                    {targets.fatG}g
                  </p>
                  <span className="text-[10px] text-muted">
                    {fKcal} kcal ({Math.round((fKcal / Math.max(1, targets.targetCalories)) * 100)}%)
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-muted border-t border-line/40 pt-2.5">
            <span>Base BMR: <strong className="text-ink">{targets.bmr} kcal</strong></span>
            <span>Maintenance TDEE: <strong className="text-ink">{targets.tdee} kcal</strong></span>
            <span>Active Split: <strong className="text-ink uppercase">{form.preset}</strong></span>
          </div>
        </section>
      )}

      {/* Form Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Section 1: Body Metrics */}
        <section className="card space-y-4 border-line bg-surface-raised/80">
          <SectionTitle>Body & Metrics</SectionTitle>

          <div>
            <label className="label" htmlFor="name">Name</label>
            <input
              id="name"
              className="input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <span className="label">Biological Sex</span>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`btn-ghost ${
                    form.sex === s
                      ? "!border-emerald-400 !bg-emerald-500/20 text-emerald-300 font-bold"
                      : ""
                  }`}
                  onClick={() => set("sex", s)}
                >
                  {s === "male" ? "Male (Mifflin +5)" : "Female (Mifflin -161)"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                className="input font-mono"
                value={form.age}
                min={13}
                max={100}
                onChange={(e) => set("age", Number(e.target.value))}
              />
            </div>

            <div>
              <span className="label">Measurement Units</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`btn-ghost !px-2 !text-xs ${
                    units === "metric" ? "!border-emerald-400 text-emerald-300 font-bold" : ""
                  }`}
                  onClick={() => setUnits("metric")}
                >
                  kg / cm
                </button>
                <button
                  type="button"
                  className={`btn-ghost !px-2 !text-xs ${
                    units === "imperial" ? "!border-emerald-400 text-emerald-300 font-bold" : ""
                  }`}
                  onClick={() => setUnits("imperial")}
                >
                  lb / ft
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {units === "metric" ? (
              <>
                <div>
                  <label className="label" htmlFor="w">Weight (kg)</label>
                  <input
                    id="w"
                    type="number"
                    step={0.1}
                    className="input font-mono"
                    value={form.weightKg}
                    onChange={(e) => set("weightKg", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="h">Height (cm)</label>
                  <input
                    id="h"
                    type="number"
                    className="input font-mono"
                    value={form.heightCm}
                    onChange={(e) => set("heightCm", Number(e.target.value))}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label" htmlFor="wl">Weight (lb)</label>
                  <input
                    id="wl"
                    type="number"
                    step={0.1}
                    className="input font-mono"
                    value={lbs}
                    onChange={(e) => set("weightKg", Number(e.target.value) * 0.45359237)}
                  />
                </div>
                <div>
                  <label className="label">Height (ft / in)</label>
                  <div className="flex gap-2">
                    <input
                      aria-label="Feet"
                      type="number"
                      className="input font-mono"
                      value={ft}
                      onChange={(e) =>
                        set("heightCm", (Number(e.target.value) * 12 + inches) * 2.54)
                      }
                    />
                    <input
                      aria-label="Inches"
                      type="number"
                      className="input font-mono"
                      value={inches}
                      onChange={(e) =>
                        set("heightCm", (ft * 12 + Number(e.target.value)) * 2.54)
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Section 2: Activity Multiplier */}
        <section className="card space-y-4 border-line bg-surface-raised/80">
          <SectionTitle>Daily Activity Level</SectionTitle>
          <div className="space-y-2">
            {ACTIVITY_OPTIONS.map((a) => (
              <button
                key={a.value}
                type="button"
                className={`btn-ghost w-full !justify-between !text-left !p-3 transition ${
                  form.activity === a.value
                    ? "!border-emerald-400 !bg-emerald-500/15 text-emerald-300 font-semibold"
                    : "hover:border-line"
                }`}
                onClick={() => set("activity", a.value)}
              >
                <div>
                  <p className="text-xs font-bold">{a.label}</p>
                  <p className="text-[10px] text-muted">{a.hint}</p>
                </div>
                <span className="text-xs font-mono">{form.activity === a.value ? "✓" : ""}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Section 3: Goal Selection */}
        <section className="card space-y-4 border-line bg-surface-raised/80">
          <SectionTitle>Weight Goal</SectionTitle>
          <div className="space-y-2">
            {GOAL_OPTIONS.map((g) => (
              <button
                key={g.value}
                type="button"
                className={`btn-ghost w-full !justify-between !text-left !p-3 transition ${
                  form.goal === g.value
                    ? "!border-emerald-400 !bg-emerald-500/15 text-emerald-300 font-semibold"
                    : "hover:border-line"
                }`}
                onClick={() => set("goal", g.value)}
              >
                <div>
                  <p className="text-xs font-bold">{g.label}</p>
                  <p className="text-[10px] text-muted">{g.hint}</p>
                </div>
                <span className="text-xs font-mono">{form.goal === g.value ? "✓" : ""}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Section 4: Macro Preset */}
        <section className="card space-y-4 border-line bg-surface-raised/80">
          <SectionTitle>Macro Split Preset</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {(["standard", "high_protein", "low_carb"] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`btn-ghost !px-2 !py-2.5 !text-xs capitalize ${
                  form.preset === p
                    ? "!border-emerald-400 !bg-emerald-500/20 text-emerald-300 font-bold"
                    : ""
                }`}
                onClick={() => set("preset", p)}
              >
                {p === "standard"
                  ? "40/30/30 (Balanced)"
                  : p === "high_protein"
                    ? "45/35/20 (High Pro)"
                    : "35/20/45 (Low Carb)"}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`btn-ghost w-full ${
              form.preset === "custom"
                ? "!border-emerald-400 !bg-emerald-500/20 text-emerald-300 font-bold"
                : ""
            }`}
            onClick={() => set("preset", "custom")}
          >
            Custom Target (Protein g / kg)
          </button>

          {form.preset === "custom" && (
            <div className="mt-3 rounded-xl border border-line/60 bg-surface/50 p-3">
              <label className="label" htmlFor="gkg">
                Protein Target (g per kg bodyweight)
              </label>
              <input
                id="gkg"
                type="number"
                step={0.1}
                min={0.5}
                max={4}
                className="input font-mono font-bold text-cyan-400"
                value={form.proteinGPerKg ?? 1.8}
                onChange={(e) => set("proteinGPerKg", Number(e.target.value))}
              />
              <p className="mt-1.5 text-[11px] text-muted">
                Remainder calories split 60% carbohydrates / 40% healthy fats.
              </p>
            </div>
          )}
        </section>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-bad/40 bg-bad/10 p-3 text-xs text-bad">
          {error}
        </div>
      )}

      {saved && (
        <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-semibold animate-in fade-in">
          ✓ Profile and metabolic baseline updated successfully!
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          className="btn-primary w-full sm:w-auto !px-8 !py-3 font-bold shadow-xl shadow-emerald-500/25"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving changes…" : "Save Metabolic Profile"}
        </button>
      </div>
    </main>
  );
}
