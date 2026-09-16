"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  apiJson,
  type Profile,
  type Targets,
} from "@/lib/client-utils";
import { SectionTitle, Spinner } from "@/components/ui";

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary", hint: "×1.20" },
  { value: "lightly_active", label: "Lightly Active", hint: "×1.375" },
  { value: "moderately_active", label: "Moderately Active", hint: "×1.55" },
  { value: "very_active", label: "Very Active", hint: "×1.725" },
  { value: "extremely_active", label: "Extremely Active", hint: "×1.9" },
] as const;

const GOAL_OPTIONS = [
  { value: "fat_loss", label: "Fat Loss", hint: "−500 kcal" },
  { value: "maintenance", label: "Maintenance", hint: "±0 kcal" },
  { value: "muscle_gain", label: "Muscle Gain", hint: "+400 kcal" },
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
      .then((d) => setForm(d.profile))
      .catch((e) => setError(String(e)));
  }, []);

  if (!form) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center">
        <Spinner /> <p className="mt-2 text-sm text-muted">Loading profile…</p>
        {error && <p className="mt-2 text-xs text-bad">{error}</p>}
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

  const lbs = Math.round(form.weightKg / 0.45359237 * 10) / 10;
  const totalInches = form.heightCm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches - ft * 12) * 10) / 10;

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-28 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <Link href="/" className="chip">← Back</Link>
        <h1 className="text-lg font-bold">Your Profile</h1>
        <span className="w-14" />
      </header>

      <section className="card mb-4 space-y-3">
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
          <span className="label">Sex</span>
          <div className="grid grid-cols-2 gap-2">
            {(["male", "female"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`btn-ghost ${form.sex === s ? "!border-accent !text-accent" : ""}`}
                onClick={() => set("sex", s)}
              >
                {s === "male" ? "Male" : "Female"}
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
              className="input"
              value={form.age}
              min={13}
              max={100}
              onChange={(e) => set("age", Number(e.target.value))}
            />
          </div>
          <div>
            <span className="label">Units</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`btn-ghost ${units === "metric" ? "!border-accent !text-accent" : ""}`}
                onClick={() => setUnits("metric")}
              >
                kg/cm
              </button>
              <button
                type="button"
                className={`btn-ghost ${units === "imperial" ? "!border-accent !text-accent" : ""}`}
                onClick={() => setUnits("imperial")}
              >
                lb/ft
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {units === "metric" ? (
            <>
              <div>
                <label className="label" htmlFor="weight">Weight (kg)</label>
                <input
                  id="weight"
                  type="number"
                  className="input"
                  value={form.weightKg}
                  step={0.1}
                  onChange={(e) => set("weightKg", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="label" htmlFor="height">Height (cm)</label>
                <input
                  id="height"
                  type="number"
                  className="input"
                  value={form.heightCm}
                  onChange={(e) => set("heightCm", Number(e.target.value))}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label" htmlFor="weightLb">Weight (lb)</label>
                <input
                  id="weightLb"
                  type="number"
                  className="input"
                  value={lbs}
                  step={0.1}
                  onChange={(e) => set("weightKg", Number(e.target.value) * 0.45359237)}
                />
              </div>
              <div>
                <label className="label" htmlFor="heightFt">Height (ft/in)</label>
                <div className="flex gap-2">
                  <input
                    id="heightFt"
                    type="number"
                    className="input"
                    value={ft}
                    onChange={(e) =>
                      set("heightCm", (Number(e.target.value) * 12 + inches) * 2.54)
                    }
                  />
                  <input
                    aria-label="Height inches"
                    type="number"
                    className="input"
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

      <section className="card mb-4">
        <SectionTitle>Activity Level</SectionTitle>
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map((a) => (
            <button
              key={a.value}
              type="button"
              className={`btn-ghost w-full justify-between ${form.activity === a.value ? "!border-accent !text-accent" : ""}`}
              onClick={() => set("activity", a.value)}
            >
              <span>{a.label}</span>
              <span className="text-xs text-muted">{a.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card mb-4">
        <SectionTitle>Goal</SectionTitle>
        <div className="space-y-2">
          {GOAL_OPTIONS.map((g) => (
            <button
              key={g.value}
              type="button"
              className={`btn-ghost w-full justify-between ${form.goal === g.value ? "!border-accent !text-accent" : ""}`}
              onClick={() => set("goal", g.value)}
            >
              <span>{g.label}</span>
              <span className="text-xs text-muted">{g.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card mb-4">
        <SectionTitle>Macro Split</SectionTitle>
        <div className="mb-2 grid grid-cols-3 gap-2">
          {(["standard", "high_protein", "low_carb"] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`btn-ghost !px-2 !text-xs ${form.preset === p ? "!border-accent !text-accent" : ""}`}
              onClick={() => set("preset", p)}
            >
              {p === "standard" ? "40/30/30" : p === "high_protein" ? "45/35/20" : "35/20/45"}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`btn-ghost w-full ${form.preset === "custom" ? "!border-accent !text-accent" : ""}`}
          onClick={() => set("preset", "custom")}
        >
          Custom (g/kg protein)
        </button>
        {form.preset === "custom" && (
          <div className="mt-3">
            <label className="label" htmlFor="gkg">
              Protein target (g per kg body weight)
            </label>
            <input
              id="gkg"
              type="number"
              className="input"
              step={0.1}
              min={0.5}
              max={4}
              value={form.proteinGPerKg ?? 1.8}
              onChange={(e) => set("proteinGPerKg", Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-muted">
              Remainder of calories split 60% carbs / 40% fat.
            </p>
          </div>
        )}
      </section>

      {targets && (
        <section className="card mb-4">
          <SectionTitle>Computed Targets</SectionTitle>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">BMR</dt><dd>{targets.bmr} kcal</dd></div>
            <div className="flex justify-between"><dt className="text-muted">TDEE</dt><dd>{targets.tdee} kcal</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Target</dt><dd className="font-bold">{targets.targetCalories} kcal</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Protein</dt><dd>{targets.proteinG} g</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Carbs</dt><dd>{targets.carbsG} g</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Fat</dt><dd>{targets.fatG} g</dd></div>
          </dl>
        </section>
      )}

      {error && <p className="mb-3 text-sm text-bad">{error}</p>}
      {saved && <p className="mb-3 text-sm text-good">Profile saved ✓</p>}

      <button className="btn-primary w-full" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save Profile"}
      </button>
    </main>
  );
}
