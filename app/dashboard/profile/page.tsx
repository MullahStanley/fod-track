"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiJson, type Profile, type Targets } from "@/lib/client-utils";
import { SectionTitle, Spinner } from "@/components/ui";
import { ThemeToggle } from "@/components/theme";

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary", hint: "×1.20" },
  { value: "lightly_active", label: "Lightly Active", hint: "×1.375" },
  { value: "moderately_active", label: "Moderately Active", hint: "×1.55" },
  { value: "very_active", label: "Very Active", hint: "×1.725" },
  { value: "extremely_active", label: "Extremely Active", hint: "×1.9" },
] as const;

const GOAL_OPTIONS = [
  { value: "fat_loss", label: "Fat Loss", hint: "−500 kcal" },
  { value: "maintenance", label: "Maintenance", hint: "±0" },
  { value: "muscle_gain", label: "Muscle Gain", hint: "+400" },
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
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <Spinner />
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

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="chip">← Dashboard</Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <h1 className="text-sm font-bold tracking-widest">PROFILE</h1>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-3">
          <SectionTitle>Basics</SectionTitle>
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" value={form.name}
              onChange={(e) => set("name", e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <span className="label">Sex</span>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map((s) => (
                <button key={s} type="button"
                  className={`btn-ghost ${form.sex === s ? "!border-ink !font-medium" : ""}`}
                  onClick={() => set("sex", s)}>
                  {s === "male" ? "Male" : "Female"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="age">Age</label>
              <input id="age" type="number" className="input" value={form.age}
                min={13} max={100} onChange={(e) => set("age", Number(e.target.value))} />
            </div>
            <div>
              <span className="label">Units</span>
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  className={`btn-ghost ${units === "metric" ? "!border-ink !font-medium" : ""}`}
                  onClick={() => setUnits("metric")}>kg/cm</button>
                <button type="button"
                  className={`btn-ghost ${units === "imperial" ? "!border-ink !font-medium" : ""}`}
                  onClick={() => setUnits("imperial")}>lb/ft</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {units === "metric" ? (
              <>
                <div>
                  <label className="label" htmlFor="w">Weight (kg)</label>
                  <input id="w" type="number" step={0.1} className="input" value={form.weightKg}
                    onChange={(e) => set("weightKg", Number(e.target.value))} />
                </div>
                <div>
                  <label className="label" htmlFor="h">Height (cm)</label>
                  <input id="h" type="number" className="input" value={form.heightCm}
                    onChange={(e) => set("heightCm", Number(e.target.value))} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label" htmlFor="wl">Weight (lb)</label>
                  <input id="wl" type="number" step={0.1} className="input" value={lbs}
                    onChange={(e) => set("weightKg", Number(e.target.value) * 0.45359237)} />
                </div>
                <div>
                  <label className="label">Height (ft/in)</label>
                  <div className="flex gap-2">
                    <input aria-label="Feet" type="number" className="input" value={ft}
                      onChange={(e) => set("heightCm", (Number(e.target.value) * 12 + inches) * 2.54)} />
                    <input aria-label="Inches" type="number" className="input" value={inches}
                      onChange={(e) => set("heightCm", (ft * 12 + Number(e.target.value)) * 2.54)} />
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="card space-y-4">
          <div>
            <SectionTitle>Activity</SectionTitle>
            <div className="space-y-2">
              {ACTIVITY_OPTIONS.map((a) => (
                <button key={a.value} type="button"
                  className={`btn-ghost w-full justify-between ${form.activity === a.value ? "!border-ink !font-medium" : ""}`}
                  onClick={() => set("activity", a.value)}>
                  <span>{a.label}</span>
                  <span className="text-xs text-muted">{a.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="card space-y-4">
          <div>
            <SectionTitle>Goal</SectionTitle>
            <div className="space-y-2">
              {GOAL_OPTIONS.map((g) => (
                <button key={g.value} type="button"
                  className={`btn-ghost w-full justify-between ${form.goal === g.value ? "!border-ink !font-medium" : ""}`}
                  onClick={() => set("goal", g.value)}>
                  <span>{g.label}</span>
                  <span className="text-xs text-muted">{g.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="card space-y-4">
          <div>
            <SectionTitle>Macro split</SectionTitle>
            <div className="mb-2 grid grid-cols-3 gap-2">
              {(["standard", "high_protein", "low_carb"] as const).map((p) => (
                <button key={p} type="button"
                  className={`btn-ghost !px-2 !text-xs ${form.preset === p ? "!border-ink !font-medium" : ""}`}
                  onClick={() => set("preset", p)}>
                  {p === "standard" ? "40/30/30" : p === "high_protein" ? "45/35/20" : "35/20/45"}
                </button>
              ))}
            </div>
            <button type="button"
              className={`btn-ghost w-full ${form.preset === "custom" ? "!border-ink !font-medium" : ""}`}
              onClick={() => set("preset", "custom")}>
              Custom — protein g/kg
            </button>
            {form.preset === "custom" && (
              <div className="mt-3">
                <label className="label" htmlFor="gkg">Protein (g per kg)</label>
                <input id="gkg" type="number" step={0.1} min={0.5} max={4} className="input"
                  value={form.proteinGPerKg ?? 1.8}
                  onChange={(e) => set("proteinGPerKg", Number(e.target.value))} />
                <p className="mt-1 text-xs text-muted">Remainder splits 60% carbs / 40% fat.</p>
              </div>
            )}
          </div>
          {targets && (
            <div>
              <SectionTitle>Your targets</SectionTitle>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-muted">BMR</dt><dd>{targets.bmr}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">TDEE</dt><dd>{targets.tdee}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Target</dt><dd className="font-bold">{targets.targetCalories} kcal</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Protein</dt><dd>{targets.proteinG} g</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Carbs</dt><dd>{targets.carbsG} g</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Fat</dt><dd>{targets.fatG} g</dd></div>
              </dl>
            </div>
          )}
        </section>
      </div>

      {error && <p className="mt-3 text-sm text-bad">{error}</p>}
      {saved && <p className="mt-3 text-sm text-good">Saved ✓</p>}

      <button className="btn-primary mt-4 w-full sm:w-auto" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </button>
    </main>
  );
}
