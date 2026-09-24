"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiJson, type BarcodeProduct, type FoodItem } from "@/lib/client-utils";
import { SectionTitle, Spinner } from "@/components/ui";
import { BarcodeScanner } from "@/components/barcode-scanner";

const MULTIPLIERS = [0.5, 1, 1.5, 2, 2.5, 3];

const SAMPLE_BARCODES = [
  { label: "Brookside Milk", code: "6161100000001" },
  { label: "Indomie Supa", code: "896861707211" },
  { label: "Jogoo Ugali", code: "6161101234567" },
  { label: "Weetabix", code: "5010029000016" },
  { label: "Farmers Smokies", code: "6161103334445" },
  { label: "Whole Milk", code: "041631000564" },
];

export default function BarcodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(targetCode?: string) {
    const rawCode = (targetCode ?? code).trim().replace(/\D/g, "");
    if (!rawCode || rawCode.length < 6) {
      setError("Please enter a valid 6-14 digit UPC/EAN barcode.");
      return;
    }

    setBusy(true);
    setError(null);
    setProduct(null);

    try {
      const d = await apiJson<{ product: BarcodeProduct }>(
        `/api/foods/barcode?code=${encodeURIComponent(rawCode)}&multiplier=1`
      );
      setProduct(d.product);
      setCode(rawCode);
      setShowScanner(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lookup failed";
      setError(
        msg.includes("not_found")
          ? `Barcode "${rawCode}" not found in database. Try manual search.`
          : msg.includes("network_error")
            ? "Network error reaching food database. Check your internet connection or try manual search."
            : msg
      );
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!product) return;
    setBusy(true);
    try {
      const d = await apiJson<{ item: FoodItem }>("/api/foods/barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: product.barcode, multiplier }),
      });
      sessionStorage.setItem(
        "fodtrack_scan",
        JSON.stringify({
          mealName: product.name,
          items: [d.item],
          suspectedHiddenFats: false,
          unresolvedNames: [],
        })
      );
      router.push("/dashboard/review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const scaled = product
    ? {
        kcal: Math.round(product.serving.kcal * multiplier),
        protein: Math.round(product.serving.protein * multiplier * 10) / 10,
        carbs: Math.round(product.serving.carbs * multiplier * 10) / 10,
        fat: Math.round(product.serving.fat * multiplier * 10) / 10,
      }
    : null;

  return (
    <main className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
        <span>/</span>
        <span className="text-ink font-medium">Barcode Scanner</span>
      </nav>

      <header className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="chip backdrop-blur-md">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-sm font-bold tracking-widest text-ink">BARCODE SCANNER</h1>
        </div>
        <span className="w-24" />
      </header>

      {/* Camera Live Scanner Section */}
      {showScanner ? (
        <section className="mb-6 space-y-3">
          <BarcodeScanner
            onDetected={(detectedCode) => {
              setCode(detectedCode);
              void lookup(detectedCode);
            }}
            onClose={() => setShowScanner(false)}
          />
        </section>
      ) : (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/15 to-emerald-500/10 p-5 text-sm font-semibold text-emerald-300 shadow-xl shadow-emerald-950/20 backdrop-blur-xl transition hover:border-emerald-400/50 hover:bg-emerald-500/20 active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-lg group-hover:scale-110 transition">
              📷
            </span>
            <div className="text-left">
              <div className="font-bold text-ink">Open Camera Barcode Scanner</div>
              <div className="text-xs font-normal text-emerald-400/80">
                Live viewfinder, autofocus reticle & photo upload
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Manual Input Section */}
      <section className="card mb-4 backdrop-blur-xl bg-surface-raised/80 border-line shadow-xl">
        <label className="label" htmlFor="code">
          Manual UPC / EAN entry
        </label>
        <div className="flex gap-2">
          <input
            id="code"
            className="input font-mono text-base tracking-wider"
            inputMode="numeric"
            placeholder="e.g. 6161100000001"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 14))}
            onKeyDown={(e) => e.key === "Enter" && void lookup()}
          />
          <button
            className="btn-primary !px-5"
            onClick={() => void lookup()}
            disabled={busy || code.length < 6}
          >
            {busy ? <Spinner /> : "Look up"}
          </button>
        </div>

        {/* Quick Demo Barcodes for instant testing */}
        <div className="mt-4 pt-3 border-t border-line/50">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Quick test products (click to load):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_BARCODES.map((s) => (
              <button
                key={s.code}
                type="button"
                className="chip text-[11px] hover:border-emerald-400 hover:text-emerald-300 transition"
                onClick={() => {
                  setCode(s.code);
                  void lookup(s.code);
                }}
              >
                🏷️ {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-bad/40 bg-bad/10 p-3.5 text-xs text-bad backdrop-blur-md flex items-center justify-between gap-3">
          <span>{error}</span>
          <Link href="/dashboard/search" className="underline whitespace-nowrap font-medium text-ink hover:text-emerald-400">
            Search manually →
          </Link>
        </div>
      )}

      {/* Product Card */}
      {product && scaled && (
        <section className="card backdrop-blur-xl bg-surface-raised/85 border-line shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <SectionTitle right={<span className="chip !text-[11px]">{product.brand ?? "Generic"}</span>}>
            Matched Product
          </SectionTitle>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">{product.name}</h2>
            <span className="font-mono text-xs text-muted">#{product.barcode}</span>
          </div>

          <div className="mt-4 rounded-xl border border-line/60 bg-surface/50 p-3">
            <span className="label">
              Portion size: {multiplier}× ({Math.round(product.serving.grams * multiplier)}g)
            </span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {MULTIPLIERS.map((m) => (
                <button
                  key={m}
                  className={`chip px-3 py-1 font-medium transition ${
                    multiplier === m
                      ? "!border-emerald-400 !bg-emerald-500/20 !text-emerald-300 ring-1 ring-emerald-400"
                      : "hover:bg-white/10"
                  }`}
                  onClick={() => setMultiplier(m)}
                >
                  {m}×
                </button>
              ))}
            </div>
          </div>

          {/* Macro grid with rich glowing indicators */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <span className="text-[11px] font-medium text-emerald-400/80 uppercase">Calories</span>
              <p className="mt-0.5 text-xl font-extrabold text-emerald-400">{scaled.kcal}</p>
              <span className="text-[10px] text-muted">kcal</span>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-center">
              <span className="text-[11px] font-medium text-cyan-400/80 uppercase">Protein</span>
              <p className="mt-0.5 text-xl font-extrabold text-cyan-400">{scaled.protein}g</p>
              <span className="text-[10px] text-muted">
                {Math.round(((scaled.protein * 4) / Math.max(1, scaled.kcal)) * 100)}% kcal
              </span>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
              <span className="text-[11px] font-medium text-amber-400/80 uppercase">Carbs</span>
              <p className="mt-0.5 text-xl font-extrabold text-amber-400">{scaled.carbs}g</p>
              <span className="text-[10px] text-muted">
                {Math.round(((scaled.carbs * 4) / Math.max(1, scaled.kcal)) * 100)}% kcal
              </span>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-center">
              <span className="text-[11px] font-medium text-rose-400/80 uppercase">Fat</span>
              <p className="mt-0.5 text-xl font-extrabold text-rose-400">{scaled.fat}g</p>
              <span className="text-[10px] text-muted">
                {Math.round(((scaled.fat * 9) / Math.max(1, scaled.kcal)) * 100)}% kcal
              </span>
            </div>
          </div>

          <button
            className="btn-primary mt-5 w-full !py-3 font-semibold shadow-lg shadow-emerald-500/20"
            onClick={save}
            disabled={busy}
          >
            {busy ? "Preparing meal review…" : "Review & add to log →"}
          </button>
        </section>
      )}
    </main>
  );
}
