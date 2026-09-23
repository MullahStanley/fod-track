"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Pipeline walkthrough ────────── */

interface Step {
  title: string;
  body: string;
  network: string[];
  code?: string;
}

const STEPS: Step[] = [
  {
    title: "The photo starts on your device",
    body: "You take or choose a picture of your plate. At this moment nothing has been sent anywhere — the file lives only in your browser.",
    network: ["Nothing sent"],
  },
  {
    title: "Compressed before anything moves",
    body: "Your browser downscales the image to 1024px and re-encodes it as a small JPEG (roughly 100–300 KB). The original full-resolution photo never leaves your phone.",
    network: ["Compressed JPEG only"],
  },
  {
    title: "Analysis happens server-side",
    body: "The compressed image goes to our server, which calls the vision model. With Ollama configured, that model runs on our own hardware and the photo never touches a third party. With Gemini, it goes to Google's API over encrypted HTTPS. Either way, no name, email, or account is attached.",
    network: [
      "HTTPS POST /api/scan/analyze-meal",
      "Image bytes + a fixed prompt",
      "No identity attached",
    ],
  },
  {
    title: "The AI returns weights, not calories",
    body: "The model is schema-constrained: component names, estimated grams, and a confidence score. Outputting calories is forbidden by the prompt and stripped by validation — macros are never an AI guess.",
    network: ["Names + grams + confidence only"],
    code: `{
  "meal_name": "Ugali & sukuma",
  "suspected_hidden_fats": true,
  "items": [
    { "name": "ugali", "estimated_grams": 300, "confidence": 0.9 },
    { "name": "sukuma wiki", "estimated_grams": 150, "confidence": 0.8 }
  ]
}`,
  },
  {
    title: "Deterministic math on real databases",
    body: "Each ingredient is matched against the Kenyan local database first — ugali, sukuma wiki, omena, chapati — then global sources. Calories and macros come from per-100g reference values multiplied by grams. Plain arithmetic you can audit.",
    network: ["Database lookups only", "Photo is not re-sent"],
  },
  {
    title: "Nothing is saved until you say so",
    body: "You review every item: steppers to correct grams, one-tap delete for wrong guesses, quick toggles for hidden cooking oil. Only after you tap Save does the meal reach the database — the SQLite file on the server you run.",
    network: ["Your reviewed meal → local SQLite"],
  },
];

export function PipelineWalkthrough() {
  const [open, setOpen] = useState(0);

  return (
    <ol className="relative space-y-2">
      {STEPS.map((step, i) => {
        const isOpen = open === i;
        return (
          <li key={step.title} className="relative pl-10">
            {/* rail */}
            {i < STEPS.length - 1 && (
              <span aria-hidden className="absolute left-[15px] top-10 h-[calc(100%-2.5rem)] w-px bg-line" />
            )}
            <span
              aria-hidden
              className={`absolute left-0 top-2 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${
                isOpen ? "border-ink bg-ink text-accent-contrast" : "border-line bg-surface text-muted"
              }`}
            >
              {i + 1}
            </span>

            <button
              type="button"
              className="w-full rounded-lg py-2 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span className="text-sm font-semibold">{step.title}</span>
            </button>

            {isOpen && (
              <div className="pb-3">
                <p className="text-sm text-muted">{step.body}</p>
                {step.code && (
                  <pre className="mt-2 overflow-x-auto rounded-lg border border-line bg-surface-raised p-3 text-[11px] leading-relaxed text-muted">
                    {step.code}
                  </pre>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-muted">Sent:</span>
                  {step.network.map((n) => (
                    <span key={n} className="chip !py-0.5 !text-[11px]">{n}</span>
                  ))}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ── What leaves your device ─────────────────────────── */

type Mode = "photo" | "barcode" | "search";

const FLOWS: Record<Mode, { label: string; sent: string; stored: string }> = {
  photo: {
    label: "📸 Photo scan",
    sent: `POST /api/scan/analyze-meal
{
  "imageBase64": "<≈150 KB JPEG, ≤1024px>",
  "mimeType": "image/jpeg"
}`,
    stored: "Nothing. The image is analyzed in memory and discarded — never written to disk or a database.",
  },
  barcode: {
    label: "🏷️ Barcode",
    sent: `GET /api/foods/barcode?code=041631000564`,
    stored: "Only what you choose to save: the item's name, macros, and barcode inside your own meal log.",
  },
  search: {
    label: "🔍 Search",
    sent: `GET /api/foods/search?q=ugali`,
    stored: "Nothing — unless you add it to a meal and save that meal.",
  },
};

export function DataFlowTabs() {
  const [mode, setMode] = useState<Mode>("photo");
  const flow = FLOWS[mode];

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Logging modes">
        {(Object.keys(FLOWS) as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            className={`chip ${mode === m ? "!border-ink !font-medium" : ""}`}
            onClick={() => setMode(m)}
          >
            {FLOWS[m].label}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <p className="label">What crosses the network</p>
        <pre className="overflow-x-auto rounded-lg border border-line bg-surface-raised p-3 text-[11px] leading-relaxed text-muted">
          {flow.sent}
        </pre>
        <p className="label mt-3">What gets stored</p>
        <p className="text-sm text-muted">{flow.stored}</p>
      </div>
    </div>
  );
}

/* ── Live macro demo (same math as the server) ───────── */

const DEMO_FOODS = [
  { name: "Ugali", per100: { kcal: 118, p: 2.6, c: 25, f: 0.7 }, def: 250 },
  { name: "Chicken breast", per100: { kcal: 165, p: 31, c: 0, f: 3.6 }, def: 150 },
  { name: "Sukuma, steamed", per100: { kcal: 37, p: 3, c: 6, f: 0.8 }, def: 150 },
  { name: "Cooking oil", per100: { kcal: 884, p: 0, c: 0, f: 100 }, def: 14 },
];

export function MacroDemo() {
  const [idx, setIdx] = useState(0);
  const [grams, setGrams] = useState(DEMO_FOODS[0].def);
  const food = DEMO_FOODS[idx];
  const f = grams / 100;
  const out = {
    kcal: Math.round(food.per100.kcal * f),
    p: Math.round(food.per100.p * f),
    c: Math.round(food.per100.c * f),
    fat: Math.round(food.per100.f * f),
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {DEMO_FOODS.map((d, i) => (
          <button
            key={d.name}
            className={`chip ${idx === i ? "!border-ink !font-medium" : ""}`}
            onClick={() => {
              setIdx(i);
              setGrams(d.def);
            }}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="demo-grams">
          Portion: {grams} g
        </label>
        <input
          id="demo-grams"
          type="range"
          min={10}
          max={600}
          step={10}
          value={grams}
          onChange={(e) => setGrams(Number(e.target.value))}
          className="w-full accent-ink"
        />
      </div>

      <p className="mt-3 rounded-lg border border-line bg-surface-raised p-3 font-mono text-[12px] text-muted">
        {food.per100.kcal} kcal/100g × {grams} g ={" "}
        <span className="font-bold text-ink">{out.kcal} kcal</span> · {out.p}p {out.c}c {out.fat}f
      </p>

      <p className="mt-2 text-xs text-muted">
        This is the exact formula the server runs — per-100g reference values
        times grams, rounded per item. Drag the slider: deterministic, no AI in
        sight.
      </p>

      <Link href="/dashboard" className="btn-ghost mt-4 w-full sm:w-auto">
        Skip the tour — try it for yourself →
      </Link>
    </div>
  );
}
