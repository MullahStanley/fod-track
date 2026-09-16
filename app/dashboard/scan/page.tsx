"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiJson, compressImage, type ResolvedScan } from "@/lib/client-utils";
import { Spinner } from "@/components/ui";

export default function ScanPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
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
        msg.includes("no_api_key")
          ? "Vision AI is not configured on this server yet. Use barcode or manual search — both work fully offline."
          : msg
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="chip">← Dashboard</Link>
        <h1 className="text-sm font-bold tracking-widest">SCAN MEAL</h1>
        <span className="w-20" />
      </header>

      <section className="card">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Selected meal"
            className="mb-3 max-h-80 w-full rounded-lg border border-line object-cover" />
        ) : (
          <div className="mb-3 flex h-56 items-center justify-center rounded-lg border border-dashed border-line text-sm text-muted">
            Take or choose a meal photo
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/*" capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }} />

        <button className="btn-primary w-full" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? (<><Spinner /> Analyzing…</>) : "📸 Take / choose photo"}
        </button>

        {busy && (
          <p className="mt-2 text-center text-xs text-muted">
            Identifying components and estimating grams…
          </p>
        )}

        {error && (
          <div className="mt-3 rounded-lg border border-bad/40 bg-bad/10 p-3 text-xs text-bad">
            {error}
            <div className="mt-2 flex gap-2">
              <Link href="/dashboard/barcode" className="chip">Use barcode</Link>
              <Link href="/dashboard/search" className="chip">Manual search</Link>
            </div>
          </div>
        )}
      </section>

      <section className="card mt-4 text-xs text-muted">
        <p className="mb-1 font-medium text-ink">How it works</p>
        <p>
          Your photo is compressed on-device (≤1024px) and analyzed server-side.
          The AI identifies components and estimates gram weights — it never
          guesses calories. Each ingredient is matched against the Kenyan local
          database first, then global sources, and macros are computed
          deterministically. You review everything before it's logged.
        </p>
      </section>
    </main>
  );
}
