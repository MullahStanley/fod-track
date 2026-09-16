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
    body: "Packaged products resolve through Open Food Facts — thousands of Kenyan supermarket items included.",
  },
  {
    icon: "🇰🇪",
    title: "Built for Kenyan plates",
    body: "Local-first database: ugali, chapati, githeri, mukimo, pilau, omena, sukuma, managu, terere, matoke — offline, no API key needed.",
  },
  {
    icon: "🎯",
    title: "Real targets, not guesses",
    body: "Mifflin-St Jeor BMR, activity-scaled TDEE, and macro goals tuned to fat loss, maintenance, or muscle gain.",
  },
  {
    icon: "📴",
    title: "Works on any phone",
    body: "Minimal, fast, and light on data. Your log lives on your device's server — no account required to start.",
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
    q: "Is my data private?",
    a: "Your profile and logs are stored in a local database, not sold or shared. Photos are analyzed and discarded — nothing is published.",
  },
  {
    q: "Is it free?",
    a: "Yes. The local food database, barcode lookup, and manual search are fully free. AI photo scanning uses a free-tier vision model.",
  },
  {
    q: "Do I need an account?",
    a: "No. Open the app, set your profile once, and start logging.",
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
    <div className="min-h-dvh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <span className="text-sm font-bold tracking-widest">fod-track</span>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/dashboard" className="btn-primary !py-2">Open app</Link>
        </nav>
        <div className="hidden" />
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10 text-center sm:pt-16">
        <p className="mb-4 inline-block rounded-full border border-line px-3 py-1 text-xs text-muted">
          Built for Kenya 🇰🇪 · Free · No account needed
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Know what your plate
          <span className="block">costs you.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          Snap a photo of ugali and sukuma, scan a barcode, or search the local
          database. fod-track turns any meal into calories and macros — and you
          approve every number before it counts.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="btn-primary w-full max-w-xs sm:w-auto">
            Start tracking free
          </Link>
          <Link href="/dashboard" className="btn-ghost w-full max-w-xs sm:w-auto">
            See how it works ↓
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted">
          No sign-up · Works offline for local foods · Your data stays yours
        </p>
      </section>

      {/* Why tracking matters */}
      <section className="border-y border-line bg-surface-raised">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Why bother counting calories?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted sm:text-base">
            You can't manage what you don't measure. Portion sizes have grown,
            "healthy" foods hide calories, and guessing fails silently.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="card">
              <p className="text-2xl">⚖️</p>
              <h3 className="mt-2 font-semibold">Weight change is math</h3>
              <p className="mt-1 text-sm text-muted">
                Fat loss needs a sustained calorie deficit; muscle needs a
                surplus. Tracking is the only way to know which side of the
                equation you're on.
              </p>
            </div>
            <div className="card">
              <p className="text-2xl">👀</p>
              <h3 className="mt-2 font-semibold">Portions deceive</h3>
              <p className="mt-1 text-sm text-muted">
                A "small" plate of ugali with chai can quietly carry half a
                day's energy. Seeing the numbers ends the guessing.
              </p>
            </div>
            <div className="card">
              <p className="text-2xl">📊</p>
              <h3 className="mt-2 font-semibold">Logging changes behavior</h3>
              <p className="mt-1 text-sm text-muted">
                Studies consistently show people who log meals lose more weight
                than those who don't — the act of tracking itself improves
                choices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          Everything you need, nothing you don't
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <p className="text-xl">{f.icon}</p>
              <h3 className="mt-2 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface-raised">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">How it works</h2>
          <ol className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
            {[
              "Set your profile — sex, age, weight, height, activity, goal.",
              "Snap the plate or scan the barcode. The AI weighs components, not calories.",
              "Review the breakdown, adjust grams, save. Progress bars update instantly.",
            ].map((step, i) => (
              <li key={i} className="text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-line text-lg font-bold">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm text-muted">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Link href="/dashboard" className="btn-primary">
              Start tracking free
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-5 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="mt-8 space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="card">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} fod-track. Nutrition data from USDA FDC, Open Food Facts, and regional food composition tables.</p>
          <div className="flex gap-4">
            <Link href="/dashboard">Open app</Link>
            <Link href="/dashboard/profile">Set targets</Link>
          </div>
          <span className="hidden">.</span>
        </div>
      </footer>
    </div>
  );
}
