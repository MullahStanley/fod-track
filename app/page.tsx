import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme";

export const metadata: Metadata = {
  title: "fod-track — AI Calorie & Nutrition Tracking for Kenya",
  description:
    "Know what your plate costs you. AI meal scanning tuned for Kenyan and East African foods — ugali, sukuma, nyama choma, githeri — plus barcodes and global foods.",
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    icon: "📸",
    title: "Snap your plate",
    body: "One photo. The AI decomposes your meal into weighed components — ugali, sukuma, managu, choma — and estimates grams, never guesses calories.",
  },
  {
    icon: "✋",
    title: "You stay in control",
    body: "Nothing is logged until you review it. Adjust grams, delete wrong items, add hidden oils and extras. The AI proposes; you decide.",
  },
  {
    icon: "🏷️",
    title: "Scan any barcode",
    body: "Live camera scanner with reticle & photo upload. Packaged products resolve through Open Food Facts and our offline Kenyan catalog.",
  },
  {
    icon: "🇰🇪",
    title: "Built for Kenyan plates",
    body: "Local-first database: ugali, chapati, githeri, mukimo, pilau, omena, sukuma, managu, terere, matoke — offline, no API key needed.",
  },
  {
    icon: "🎯",
    title: "Real targets, not guesses",
    body: "Mifflin-St Jeor BMR, activity-scaled TDEE, and macro goals tuned to fat loss, maintenance, or muscle gain with instant BMI tracking.",
  },
  {
    icon: "💧",
    title: "Hydration & Data Ownership",
    body: "Daily water hydration tracker, one-tap quick-add macros, and instant JSON data exports. Your log lives on your device.",
  },
];

const FAQS = [
  {
    q: "How many calories should I eat per day?",
    a: "It depends on your body and activity. fod-track computes your BMR with the Mifflin-St Jeor equation, multiplies by your activity level, then adjusts for your goal — fat loss, maintenance, or muscle gain. Most adults land between 1,600 and 3,000 kcal/day.",
  },
  {
    q: "Does calorie tracking actually work?",
    a: "Yes — consistently tracking intake, even roughly, is one of the strongest predictors of reaching a weight goal. People who log meals are far more likely to lose weight and keep it off than those who don't.",
  },
  {
    q: "Can it recognize Kenyan foods?",
    a: "That's the point. Ugali, sukuma wiki, githeri, mukimo, nyama choma, omena, chapati, mandazi, chai — the local database ships offline, and the AI scanner resolves ingredients against it first.",
  },
  {
    q: "How does the barcode scanner work?",
    a: "Open the barcode tab and point your camera at any UPC or EAN barcode. You can also upload a photo from your gallery or type the number manually. It instantly identifies Brookside milk, Indomie, Weetabix, and thousands of packaged products.",
  },
  {
    q: "Is my data private and free?",
    a: "Yes, completely free. Your profile and logs are stored in a local SQLite database on your device's server, not sold or shared. Photos are analyzed and discarded.",
  },
];

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "fod-track",
        applicationCategory: "HealthApplication",
        operatingSystem: "Web",
        description:
          "AI calorie and nutrition tracker with Kenyan local foods, meal photo scanning, and barcode lookup.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KES" },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="relative z-10 min-h-dvh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 font-black text-slate-950 shadow-lg shadow-emerald-500/25">
            F
          </span>
          <span className="text-base font-extrabold tracking-widest text-ink">
            fod-track
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="btn-primary !py-2.5 !px-5 text-xs font-bold uppercase tracking-wider"
          >
            Open App →
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 text-center sm:pt-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Built for Kenya 🇰🇪 · Local Foods First · 100% Free</span>
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl text-ink">
          Know what your plate
          <span className="block bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            costs you.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg">
          Snap a photo of ugali and sukuma, scan a barcode, or search the local
          Kenyan database. fod-track turns any meal into exact grams and macros —
          and you approve every number before it counts.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="btn-primary w-full max-w-xs sm:w-auto !py-3.5 !px-8 text-base font-bold shadow-xl shadow-emerald-500/25"
          >
            Start Tracking Free
          </Link>
          <Link
            href="/dashboard/barcode"
            className="btn-ghost w-full max-w-xs sm:w-auto !py-3.5 !px-6 text-sm font-semibold"
          >
            📷 Test Barcode Scanner
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted">
          No sign-up required · 100+ Kenyan meals offline · Your data stays on your device
        </p>

        {/* Interactive Plate Card Preview */}
        <div className="mx-auto mt-12 max-w-xl text-left">
          <div className="card border-white/20 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍽️</span>
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Sample Plate Breakdown
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    AI Vision Decomposed · Kenyan DB Matched
                  </div>
                </div>
              </div>
              <span className="chip !text-[11px] font-mono text-emerald-300 !border-emerald-500/30">
                635 kcal
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-2.5">
                <span className="font-medium text-slate-200">Ugali (maize porridge)</span>
                <span className="font-mono text-muted">250g · 295 kcal</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-2.5">
                <span className="font-medium text-slate-200">Sukuma Wiki (sautéed)</span>
                <span className="font-mono text-muted">150g · 98 kcal</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-2.5">
                <span className="font-medium text-slate-200">Beef Stew (lean meat)</span>
                <span className="font-mono text-muted">150g · 285 kcal</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-center text-xs font-mono">
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-300">
                <div className="text-[10px] uppercase font-bold text-cyan-400/80">Protein</div>
                <div className="font-bold text-sm">45g</div>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-300">
                <div className="text-[10px] uppercase font-bold text-amber-400/80">Carbs</div>
                <div className="font-bold text-sm">71g</div>
              </div>
              <div className="rounded-lg bg-rose-500/10 p-2 text-rose-300">
                <div className="text-[10px] uppercase font-bold text-rose-400/80">Fats</div>
                <div className="font-bold text-sm">18g</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Tracking Matters */}
      <section className="border-y border-line/60 bg-surface-raised/60 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-6xl px-5 py-20">
          <h2 className="text-center text-2xl font-extrabold sm:text-4xl text-ink">
            Why bother counting calories?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted sm:text-base">
            You can&apos;t manage what you don&apos;t measure. Traditional Kenyan plates
            can vary widely in oil, starches, and portions. Seeing the numbers
            gives you power.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="card border-white/10 bg-surface/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-xl text-emerald-400 mb-3">
                ⚖️
              </div>
              <h3 className="font-bold text-base text-ink">Weight change is physics</h3>
              <p className="mt-2 text-sm text-muted">
                Fat loss requires a gentle calorie deficit; muscle growth needs a
                surplus. Tracking eliminates guesswork so you stay on your path.
              </p>
            </div>

            <div className="card border-white/10 bg-surface/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-xl text-cyan-400 mb-3">
                👀
              </div>
              <h3 className="font-bold text-base text-ink">Portions silently deceive</h3>
              <p className="mt-2 text-sm text-muted">
                A &ldquo;small&rdquo; mound of ugali with chapati and chai can quietly
                pack 1,200+ kcal. Seeing measured grams gives you exact awareness.
              </p>
            </div>

            <div className="card border-white/10 bg-surface/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-xl text-amber-400 mb-3">
                📊
              </div>
              <h3 className="font-bold text-base text-ink">Consistency wins</h3>
              <p className="mt-2 text-sm text-muted">
                Daily logging builds intuition. Over time, you automatically know
                how much protein you&apos;re getting and make effortless choices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20">
        <h2 className="text-center text-2xl font-extrabold sm:text-4xl text-ink">
          Built for speed, accuracy, and Kenyan plates
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card border-white/10 bg-surface-raised/75 hover:border-emerald-400/40 transition-all p-6"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-bold text-base text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="border-t border-line/60 bg-surface-raised/60 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-4xl px-5 py-20">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl text-ink">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="card border-white/10 bg-surface/70 p-5">
                <h3 className="font-bold text-sm text-ink">{faq.q}</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/dashboard"
              className="btn-primary !py-3.5 !px-8 text-base font-bold shadow-xl shadow-emerald-500/25"
            >
              Open Dashboard & Start Tracking →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-muted">
        <p>fod-track — Fast, minimal AI nutrition tracking for Kenya 🇰🇪</p>
      </footer>
    </div>
  );
}
