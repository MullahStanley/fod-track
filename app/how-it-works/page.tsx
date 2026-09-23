import type { Metadata } from "next";
import Link from "next/link";
import {
  PipelineWalkthrough,
  DataFlowTabs,
  MacroDemo,
} from "@/components/how-it-works";
import { ThemeToggle } from "@/components/theme";

export const metadata: Metadata = {
  title: "How fod-track works — data flow, AI pipeline & privacy",
  description:
    "Follow a meal photo through fod-track step by step: on-device compression, schema-constrained AI that returns grams not calories, deterministic Kenyan-database math, and nothing stored until you approve.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How fod-track turns a meal photo into nutrition data",
    description:
      "The step-by-step pipeline fod-track uses to analyze meals while keeping photo data safe.",
    step: [
      "Compress the photo on your device (≤1024px JPEG)",
      "Send it server-side for AI component analysis — grams, never calories",
      "Match components against the Kenyan local food database",
      "Compute macros deterministically from per-100g values",
      "Review and adjust before anything is saved",
    ].map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s })),
  };

  return (
    <div className="min-h-dvh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-sm font-bold tracking-widest">fod-track</Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-4xl px-5 pb-20">
        <p className="mb-3 inline-block rounded-full border border-line px-3 py-1 text-xs text-muted">
          Transparent by design
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          How your data flows — and where it stops.
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          Every step of the fod-track pipeline, from camera to saved meal. Click
          through the stages, inspect exactly what crosses the network, and do
          the math yourself below.
        </p>

        {/* Pipeline */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">1 · The pipeline, step by step</h2>
          <PipelineWalkthrough />
        </section>

        {/* Data flow inspector */}
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">
            2 · What leaves your device, per logging mode
          </h2>
          <div className="card">
            <DataFlowTabs />
          </div>
        </section>

        {/* Safety notes */}
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">3 · Safety guarantees</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["🔐", "No account, no identity", "Scans carry no name, email, or session identity. There is no user table attached to vision calls."],
              ["🧮", "AI never invents numbers", "The model returns grams only. Calories and macros come from database arithmetic you can audit in tests."],
              ["🗄️", "Storage is yours", "Meals persist to a SQLite file on the server you run — not a third-party analytics cloud."],
              ["✋", "Delete is real", "Deleting a meal removes its rows and itemized records from the database, cascade-enforced."],
              ["🔑", "Keys never ship to browsers", "Ollama host, Gemini key, and USDA key are server-side environment variables only."],
              ["📸", "Photos are ephemeral", "Images are analyzed in memory and discarded. They are never written to disk or logged."],
            ].map(([icon, title, body]) => (
              <div key={title} className="card">
                <p aria-hidden>{icon}</p>
                <h3 className="mt-1 text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Live demo */}
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">4 · Do the math yourself</h2>
          <div className="card">
            <MacroDemo />
          </div>
        </section>

        {/* CTA */}
        <section className="mt-14 rounded-2xl border border-ink bg-ink p-8 text-center text-accent-contrast">
          <h2 className="text-2xl font-bold sm:text-3xl">Try it for yourself</h2>
          <p className="mx-auto mt-2 max-w-md text-sm opacity-80">
            Set your targets once, snap tonight's plate, and watch the review
            screen fill in. Nothing is saved until you approve it.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-accent-contrast px-6 py-3 text-sm font-semibold text-ink transition hover:opacity-90"
          >
            Try it for yourself →
          </Link>
          <p className="mt-3 text-xs opacity-60">
            Free · No account · Local foods work offline
          </p>
        </section>
      </main>
    </div>
  );
}
