"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  apiJson,
  compressImage,
  type ResolvedScan,
} from "@/lib/client-utils";
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
      // Pass resolved scan to the calibration screen via sessionStorage.
      sessionStorage.setItem("fodtrack_scan", JSON.stringify(d.resolved));
      router.push("/review");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Scan failed";
      setError(
        msg.includes("no_api_key")
          ? "Vision AI is not configured (missing GEMINI_API_KEY on the server). Use manual search instead."
          : msg
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-28 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <Link href="/" className="chip">← Back</Link>
        <h1 className="text-lg font-bold">Scan Meal</h1>
        <span className="w-14" />
      </header>

      <section className="card">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Selected meal"
            className="mb-3 max-h-72 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="mb-3 flex h-48 items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">
            Take or choose a meal photo
          </div>
        )}

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

        <button
          className="btn-primary w-full"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <>
              <Spinner /> Analyzing…
            </>
          ) : (
            "📸 Take / Choose Photo"
          )}
        </button>

        {busy && (
          <p className="mt-2 text-center text-xs text-muted">
            Decomposing plate into weighed components…
          </p>
        )}

        {error && (
          <div className="mt-3 rounded-xl border border-bad/40 bg-bad/10 p-3 text-xs text-bad">
            {error}
            <div className="mt-2 flex gap-2">
              <Link href="/barcode" className="chip">Use barcode</Link>
              <Link href="/search" className="chip">Manual search</Link>
            </div>
          </div>
        )}
      </section>

      <section className="card mt-4 text-xs text-muted">
        <p className="mb-1 font-semibold text-slate-300">How it works</p>
        <p>
          Your photo is compressed on-device (≤1024px JPEG) and sent to our
          server, which asks the vision model to identify components and estimate
          gram weights — never calories. We match each component against the
          USDA food database to compute macros deterministically. You review and
          adjust everything before anything is logged.
        </p>
      </section>
    </main>
  );
}
