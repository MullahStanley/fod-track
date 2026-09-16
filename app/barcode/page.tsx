"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  apiJson,
  itemMacros,
  todayLocalISO,
  type BarcodeProduct,
} from "@/lib/client-utils";
import { SectionTitle, Spinner } from "@/components/ui";

const MULTIPLIERS = [0.5, 1, 1.5, 2, 2.5, 3];

export default function BarcodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    setBusy(true);
    setError(null);
    setProduct(null);
    try {
      const d = await apiJson<{ product: BarcodeProduct }>(
        `/api/foods/barcode?code=${encodeURIComponent(code.trim())}&multiplier=1`
      );
      setProduct(d.product);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lookup failed";
      setError(
        msg.includes("not_found")
          ? "Product not found in Open Food Facts. Try manual search."
          : msg.includes("network_error")
            ? "Network error reaching Open Food Facts. Try manual search."
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
      const d = await apiJson<{ item: import("@/lib/client-utils").FoodItem }>(
        "/api/foods/barcode",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: product.barcode, multiplier }),
        }
      );
      // Hand off to review so the user keeps calibration powers.
      sessionStorage.setItem(
        "fodtrack_scan",
        JSON.stringify({
          mealName: product.name,
          items: [d.item],
          suspectedHiddenFats: false,
          unresolvedNames: [],
        })
      );
      router.push("/review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const scaled = product
    ? {
        kcal: Math.round(product.serving.kcal * multiplier),
        protein: Math.round(product.serving.protein * multiplier),
        carbs: Math.round(product.serving.carbs * multiplier),
        fat: Math.round(product.serving.fat * multiplier),
      }
    : null;

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-40 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <Link href="/" className="chip">← Back</Link>
        <h1 className="text-lg font-bold">Barcode Lookup</h1>
        <span className="w-14" />
      </header>

      <section className="card mb-4">
        <label className="label" htmlFor="code">UPC / EAN code</label>
        <div className="flex gap-2">
          <input
            id="code"
            className="input"
            inputMode="numeric"
            placeholder="e.g. 041631000564"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 14))}
            onKeyDown={(e) => e.key === "Enter" && void lookup()}
          />
          <button className="btn-primary !px-4" onClick={lookup} disabled={busy || code.length < 6}>
            {busy ? <Spinner /> : "Look up"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Camera scanning: the browser Barcode Detection API is used automatically
          where available; otherwise type the number below the barcode.
        </p>
        <CameraScan onDetected={(c) => { setCode(c); void lookup(); }} />
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-bad/40 bg-bad/10 p-3 text-xs text-bad">
          {error}{" "}
          <Link href="/search" className="underline">Search manually →</Link>
        </div>
      )}

      {product && scaled && (
        <section className="card">
          <SectionTitle right={<span className="text-xs text-muted">{product.brand ?? "Generic"}</span>}>
            Product
          </SectionTitle>
          <p className="text-base font-semibold">{product.name}</p>

          <div className="mt-3">
            <span className="label">Servings (×{multiplier} = {Math.round(product.serving.grams * multiplier)}g)</span>
            <div className="flex flex-wrap gap-2">
              {MULTIPLIERS.map((m) => (
                <button
                  key={m}
                  className={`chip ${multiplier === m ? "!border-accent !text-accent" : ""}`}
                  onClick={() => setMultiplier(m)}
                >
                  {m}×
                </button>
              ))}
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Calories</dt><dd className="font-bold">{scaled.kcal} kcal</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Protein</dt><dd>{scaled.protein} g</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Carbs</dt><dd>{scaled.carbs} g</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Fat</dt><dd>{scaled.fat} g</dd></div>
          </dl>

          <button className="btn-primary mt-4 w-full" onClick={save} disabled={busy}>
            {busy ? "Preparing…" : "Continue to review →"}
          </button>
        </section>
      )}
    </main>
  );
}

/**
 * Uses the native Barcode Detection API when available ("shape detection" in
 * Chromium). Gracefully hides itself elsewhere.
 */
function CameraScan({ onDetected }: { onDetected: (code: string) => void }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  async function start() {
    setScanning(true);
    try {
      const video = document.createElement("video");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      video.srcObject = stream;
      await video.play();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
      const deadline = Date.now() + 15000;
      let found: string | null = null;

      while (Date.now() < deadline && !found) {
        const codes = await detector.detect(video);
        if (codes.length > 0) {
          found = codes[0].rawValue;
          break;
        }
        await new Promise((r) => setTimeout(r, 250));
      }

      stream.getTracks().forEach((t) => t.stop());
      if (found) onDetected(found);
      else setCameraError((e) => e ?? "No barcode detected — try again or type it.");
    } catch {
      setSupported(false);
      setCameraError("Camera scanning unavailable — type the code instead.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="mt-3">
      {supported === false ? null : (
        <button
          className="btn-ghost w-full"
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ("BarcodeDetector" in window) {
              setSupported(true);
              void start();
            } else {
              setSupported(false);
            }
          }}
          disabled={scanning}
        >
          {scanning ? "Scanning… (15s)" : "📷 Scan with camera"}
        </button>
      )}
      {cameraError && <p className="mt-1 text-xs text-bad">{cameraError}</p>}
    </div>
  );
}
