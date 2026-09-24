"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiJson, compressImage, type ResolvedScan } from "@/lib/client-utils";
import { Spinner } from "@/components/ui";

const DEMO_MEALS: Array<{ label: string; scan: ResolvedScan }> = [
  {
    label: "🇰🇪 Ugali, Sukuma Wiki & Beef Stew Plate",
    scan: {
      mealName: "Ugali with Sukuma & Beef Stew",
      suspectedHiddenFats: true,
      unresolvedNames: [],
      items: [
        {
          id: "item_demo_1",
          name: "Ugali (maize, stiff porridge)",
          brand: "Local (Kenya)",
          per100g: { kcal: 118, protein: 2.6, carbs: 25, fat: 0.7 },
          servingMultiplier: 1,
          servingGrams: 250,
          grams: 250,
          source: "vision",
        },
        {
          id: "item_demo_2",
          name: "Sukuma Wiki, sauteed",
          brand: "Local (Kenya)",
          per100g: { kcal: 65, protein: 3, carbs: 6, fat: 4 },
          servingMultiplier: 1,
          servingGrams: 150,
          grams: 150,
          source: "vision",
        },
        {
          id: "item_demo_3",
          name: "Beef, stewed lean",
          brand: "Local (Kenya)",
          per100g: { kcal: 190, protein: 27, carbs: 0, fat: 8 },
          servingMultiplier: 1,
          servingGrams: 150,
          grams: 150,
          source: "vision",
        },
        {
          id: "item_demo_4",
          name: "Cooking oil (1 tbsp)",
          per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 },
          servingMultiplier: 1,
          servingGrams: 14,
          grams: 14,
          source: "hidden_extra",
        },
      ],
    },
  },
  {
    label: "🇰🇪 Chapati Madondo (Chapati & Yellow Beans)",
    scan: {
      mealName: "Chapati with Stewed Beans",
      suspectedHiddenFats: false,
      unresolvedNames: [],
      items: [
        {
          id: "item_demo_5",
          name: "Chapati",
          brand: "Local (Kenya)",
          per100g: { kcal: 290, protein: 8, carbs: 46, fat: 8 },
          servingMultiplier: 2,
          servingGrams: 80,
          grams: 160,
          source: "vision",
        },
        {
          id: "item_demo_6",
          name: "Beans, boiled",
          brand: "Local (Kenya)",
          per100g: { kcal: 127, protein: 8.7, carbs: 22.8, fat: 0.5 },
          servingMultiplier: 1,
          servingGrams: 200,
          grams: 220,
          source: "vision",
        },
        {
          id: "item_demo_7",
          name: "Kachumbari (fresh tomato, onion, cilantro salad)",
          brand: "Local (Kenya)",
          per100g: { kcal: 28, protein: 1.1, carbs: 5.5, fat: 0.3 },
          servingMultiplier: 1,
          servingGrams: 100,
          grams: 80,
          source: "vision",
        },
      ],
    },
  },
];

export default function ScanPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setBusy(true);
    setError(null);

    try {
      const { base64, mimeType } = await compressImage(file);
      const d = await apiJson<{ resolved: ResolvedScan }>("/api/scan/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      sessionStorage.setItem("fodtrack_scan", JSON.stringify(d.resolved));
      router.push("/dashboard/review");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Scan failed";
      setError(
        msg.includes("unavailable") || msg.includes("not configured")
          ? `${msg} You can use barcode lookup, manual food search, or try one of the demo meal plates below.`
          : msg
      );
    } finally {
      setBusy(false);
    }
  }

  function loadDemoMeal(demo: (typeof DEMO_MEALS)[number]) {
    sessionStorage.setItem("fodtrack_scan", JSON.stringify(demo.scan));
    router.push("/dashboard/review");
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
        <span>/</span>
        <span className="text-ink font-medium">AI Meal Scanner</span>
      </nav>

      <header className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="chip backdrop-blur-md">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-sm font-bold tracking-widest text-ink">
            AI MEAL PHOTO SCANNER
          </h1>
        </div>
        <span className="w-20" />
      </header>

      {/* Upload & Camera Dropzone */}
      <section className="card border-line bg-surface-raised/85 shadow-2xl backdrop-blur-xl">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />

        {previewUrl ? (
          <div className="relative mb-4 overflow-hidden rounded-xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected meal preview"
              className="max-h-80 w-full object-cover"
            />
            {busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm gap-2">
                <Spinner className="h-8 w-8 border-emerald-400" />
                <p className="font-semibold text-sm text-slate-100">
                  Decomposing plate into weighed ingredients…
                </p>
                <p className="text-xs text-emerald-400/90">
                  Cross-referencing Kenyan local composition database
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFile(file);
            }}
            onClick={() => inputRef.current?.click()}
            className={`mb-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? "border-emerald-400 bg-emerald-500/10"
                : "border-line/80 bg-surface/40 hover:border-emerald-400/60 hover:bg-surface/60"
            }`}
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-2xl">
              📸
            </div>
            <p className="text-sm font-bold text-ink">
              Take a meal photo or upload from gallery
            </p>
            <p className="mt-1 text-xs text-muted max-w-sm">
              Point at your plate. The AI breaks down ugali, sukuma, choma, rice,
              and estimates gram weights before calculation.
            </p>
          </div>
        )}

        <button
          className="btn-primary w-full !py-3 font-semibold shadow-lg shadow-emerald-500/20"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <>
              <Spinner /> Analyzing plate…
            </>
          ) : (
            "📸 Take / choose photo"
          )}
        </button>

        {error && (
          <div className="mt-4 rounded-xl border border-bad/40 bg-bad/10 p-3.5 text-xs text-bad">
            <p className="font-semibold mb-1">Scanning notice</p>
            <p>{error}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/dashboard/barcode" className="chip !border-line">
                🏷️ Try Barcode Scanner
              </Link>
              <Link href="/dashboard/search" className="chip !border-line">
                🔍 Manual Food Search
              </Link>
            </div>
          </div>
        )}

        {/* Quick Demo Meals */}
        <div className="mt-6 pt-4 border-t border-line/60">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Quick demo scans (explore calibration flow):
          </p>
          <div className="space-y-2">
            {DEMO_MEALS.map((demo, idx) => (
              <button
                key={idx}
                type="button"
                className="chip w-full !justify-start !py-2 text-xs hover:border-emerald-400 hover:text-emerald-300 transition text-left"
                onClick={() => loadDemoMeal(demo)}
              >
                🍽️ <span className="font-medium text-ink">{demo.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Info card */}
      <section className="card mt-4 text-xs text-muted border-line bg-surface-raised/70">
        <p className="mb-1 font-bold text-ink">Strict Zero-Calorie-Guessing Policy</p>
        <p>
          Unlike generic apps that guess raw calories from pictures, fod-track
          only uses AI vision to decompose your meal into specific physical
          ingredients and estimated grams. Ingredients are deterministically
          matched against our Kenyan local food tables, and you have final
          approval over every single gram before anything is committed to your
          log.
        </p>
      </section>
    </main>
  );
}
