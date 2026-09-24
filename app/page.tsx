import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme";

export const metadata: Metadata = {
  title: "AI Calorie & Nutrition Tracker for Kenya — Ugali, Sukuma, Nyama Choma & Barcodes",
  description:
    "Free AI nutrition and calorie tracker built specifically for Kenya. Dual-mode tracking with AI plate photo scanning, UPC/EAN barcode lookup, and 100+ verified Kenyan foods (ugali, sukuma, nyama choma, githeri, chapati).",
  keywords: [
    "calorie tracker Kenya",
    "Kenyan food nutrition",
    "ugali calories",
    "sukuma wiki macros",
    "nyama choma calories",
    "chapati nutrition Kenya",
    "githeri calories",
    "AI meal scanner Africa",
    "Kenyan diet tracker",
    "barcode scanner food Kenya",
  ],
  alternates: { canonical: "https://fod-track.app" },
  openGraph: {
    title: "fod-track — Fast AI Calorie & Nutrition Tracking for Kenya",
    description:
      "Dual-mode AI meal photo estimation, UPC barcode scanner, and a 100+ item local Kenyan food database. Calculate BMR, TDEE, and macros with zero guessing.",
    url: "https://fod-track.app",
    siteName: "fod-track",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "fod-track — Kenyan Food Calorie & Macro Tracker",
    description:
      "Snap a meal photo or scan a barcode. Deterministic macro math for Kenyan staples — ugali, sukuma, choma, chapati, omena.",
  },
};

const TOP_KENYAN_FOODS = [
  { name: "Ugali (White Maize)", serving: "250g slice", kcal: 295, p: 6.5, c: 62.5, f: 1.8 },
  { name: "Sukuma Wiki (Sautéed)", serving: "150g cup", kcal: 98, p: 4.5, c: 9.0, f: 6.0 },
  { name: "Nyama Choma (Roasted Goat)", serving: "200g portion", kcal: 392, p: 54.0, c: 0.0, f: 18.0 },
  { name: "Chapati (Kenyan Flatbread)", serving: "80g piece", kcal: 232, p: 6.4, c: 36.8, f: 6.4 },
  { name: "Githeri (Maize & Beans)", serving: "300g bowl", kcal: 360, p: 14.4, c: 63.0, f: 3.0 },
  { name: "Mukimo (Irio with Greens)", serving: "250g serving", kcal: 300, p: 7.5, c: 55.0, f: 6.0 },
  { name: "Omena (Stewed Lake Sardines)", serving: "100g portion", kcal: 210, p: 24.0, c: 4.0, f: 11.0 },
  { name: "Matoke with Beef Stew", serving: "300g serving", kcal: 435, p: 22.5, c: 63.0, f: 11.4 },
  { name: "Ndengu Stew (Green Grams)", serving: "220g bowl", kcal: 297, p: 15.8, c: 46.2, f: 6.2 },
  { name: "Kenyan Chai with Whole Milk", serving: "200ml cup", kcal: 90, p: 3.2, c: 13.0, f: 3.2 },
];

const FEATURES = [
  {
    icon: "📸",
    title: "AI Meal Photo Decomposition",
    body: "Snap one plate photo. AI breaks your meal down into physical weighed items — ugali, sukuma, managu, choma — and proposes grams, never raw calorie guesses.",
  },
  {
    icon: "✋",
    title: "Pre-Log Calibration Screen",
    body: "You stay in total control. Adjust grams with single-tap steppers, remove ingredients, and log hidden cooking fats or chai before committing to your log.",
  },
  {
    icon: "🏷️",
    title: "Cross-Browser Barcode Scanner",
    body: "Live viewfinder with reticle autofocus, camera switcher, and photo upload. Instantly look up Brookside milk, Indomie, Weetabix, and supermarket packaged goods.",
  },
  {
    icon: "🇰🇪",
    title: "Offline-First Kenyan Food Database",
    body: "Over 90+ verified Kenyan local foods: ugali, chapati, githeri, mukimo, pilau, omena, terere, matoke, mutura, smokies pasua — zero internet needed.",
  },
  {
    icon: "🎯",
    title: "Mifflin-St Jeor Metabolic Engine",
    body: "BMR and TDEE math scaled to your exact age, biological sex, weight, and activity level. Calorie goals for fat loss (−500 kcal), maintenance, or muscle gain.",
  },
  {
    icon: "💧",
    title: "Daily Hydration & Local Data Ownership",
    body: "Track daily water glasses, log custom quick-add meals, and export all nutrition history as JSON anytime. Your personal health data stays on your device.",
  },
];

const FAQS = [
  {
    q: "How many calories should I eat per day for weight loss in Kenya?",
    a: "It depends on your body composition and daily activity. fod-track uses the medically validated Mifflin-St Jeor equation to compute your Basal Metabolic Rate (BMR), scales it by your activity multiplier (TDEE), and applies a safe 500 kcal deficit. Most active Kenyan adults land between 1,600 and 2,400 kcal per day for consistent fat loss.",
  },
  {
    q: "How many calories are in standard Kenyan ugali and sukuma wiki?",
    a: "A standard 250g slice of white maize ugali has approximately 295 kcal (6.5g protein, 62.5g carbs, 1.8g fat). A typical 150g serving of sautéed sukuma wiki contains about 98 kcal, though this can rise to 180+ kcal if cooked with generous oil. fod-track flags hidden cooking fats so you know your true intake.",
  },
  {
    q: "Can the scanner recognize traditional Kenyan foods and street foods?",
    a: "Yes. Our database contains over 90+ traditional Kenyan preparations including ugali, sukuma, managu, terere, githeri, mukimo wa njahi, nyama choma, mutura, rolex, kaimati, smokie pasua with kachumbari, and Kenyan tea. The AI resolves against our local database first.",
  },
  {
    q: "How does the barcode scanner work on mobile phones?",
    a: "Tap Barcode in the app to open the live camera viewfinder. Point your camera at any UPC or EAN barcode found on supermarket packaging. You can also upload a photo of a barcode from your gallery or type the number manually. It instantly identifies products and calculates portion macros.",
  },
  {
    q: "Is my personal nutrition data private?",
    a: "Yes. Your profile and logged meals are stored locally on your device's server in an SQLite database. We do not sell or monetize personal health data, and meal photos are analyzed in memory and immediately discarded.",
  },
  {
    q: "Is fod-track completely free to use?",
    a: "Yes. The Kenyan food composition database, barcode lookup, daily nutrition dashboard, water tracker, and metabolic calculator are 100% free with no account required.",
  },
];

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "fod-track",
        url: "https://fod-track.app",
        applicationCategory: "HealthApplication",
        operatingSystem: "All (Web, iOS, Android)",
        description:
          "Fast, minimal AI nutrition and calorie tracker built for Kenya with local food composition tables and barcode scanning.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KES" },
        featureList: [
          "Kenyan local food database",
          "AI meal photo component decomposition",
          "UPC and EAN barcode scanner",
          "Mifflin-St Jeor BMR and TDEE macro targets",
          "Daily water hydration tracking",
          "Pre-log calibration screen",
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://fod-track.app",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Dashboard",
            item: "https://fod-track.app/dashboard",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Barcode Scanner",
            item: "https://fod-track.app/dashboard/barcode",
          },
          {
            "@type": "ListItem",
            position: 4,
            name: "Kenyan Food Database",
            item: "https://fod-track.app/dashboard/search",
          },
        ],
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
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5" role="banner">
        <Link href="/" className="flex items-center gap-2" title="fod-track home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 font-black text-slate-950 shadow-lg shadow-emerald-500/25">
            F
          </span>
          <span className="text-base font-extrabold tracking-widest text-ink">
            fod-track
          </span>
        </Link>

        <nav className="flex items-center gap-3" aria-label="Main Navigation">
          <Link
            href="/dashboard/search"
            className="text-xs font-semibold text-muted hover:text-ink hidden sm:inline-block transition"
          >
            Kenyan Foods
          </Link>
          <Link
            href="/dashboard/barcode"
            className="text-xs font-semibold text-muted hover:text-ink hidden sm:inline-block transition"
          >
            Barcode
          </Link>
          <Link
            href="/how-it-works"
            className="text-xs font-semibold text-muted hover:text-ink hidden sm:inline-block transition"
          >
            How It Works
          </Link>
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="btn-primary !py-2.5 !px-5 text-xs font-bold uppercase tracking-wider"
            title="Open fod-track web application"
          >
            Open App →
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main id="main-content">
        <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10 text-center sm:pt-16" aria-labelledby="hero-title">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-300 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Built for Kenya 🇰🇪 · Local Foods First · 100% Free &amp; Offline-Ready</span>
          </div>

          <h1 id="hero-title" className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl text-ink">
            Know what your plate
            <span className="block bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
              costs you.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg">
            Snap a photo of ugali and sukuma, scan a supermarket barcode, or search 90+
            local Kenyan foods. fod-track computes exact calories and macros with
            deterministic math — and you calibrate every number before it counts.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="btn-primary w-full max-w-xs sm:w-auto !py-3.5 !px-8 text-base font-bold shadow-xl shadow-emerald-500/25"
              title="Launch the nutrition tracker dashboard"
            >
              Start Tracking Free
            </Link>
            <Link
              href="/dashboard/barcode"
              className="btn-ghost w-full max-w-xs sm:w-auto !py-3.5 !px-6 text-sm font-semibold"
              title="Test the live camera barcode scanner"
            >
              🏷️ Barcode Scanner
            </Link>
            <Link
              href="/dashboard/search"
              className="btn-ghost w-full max-w-xs sm:w-auto !py-3.5 !px-6 text-sm font-semibold"
              title="Search the Kenyan food database"
            >
              🔍 Browse 90+ Foods
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted">
            Zero sign-up required · Works offline for local foods · No calorie guessing
          </p>

          {/* Interactive Plate Card Preview */}
          <div className="mx-auto mt-12 max-w-xl text-left">
            <article className="card p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍽️</span>
                  <div>
                    <h2 className="text-xs font-bold text-ink">
                      Sample Kenyan Plate Breakdown
                    </h2>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      AI Vision Decomposed · Kenyan DB Matched
                    </p>
                  </div>
                </div>
                <span className="chip !text-[11px] font-mono text-emerald-600 dark:text-emerald-300 font-bold !border-emerald-500/30">
                  678 kcal total
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-surface/70 border border-line/60 p-2.5">
                  <span className="font-semibold text-ink">Ugali (white maize)</span>
                  <span className="font-mono text-muted">250g · 295 kcal</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface/70 border border-line/60 p-2.5">
                  <span className="font-semibold text-ink">Sukuma Wiki (sautéed)</span>
                  <span className="font-mono text-muted">150g · 98 kcal</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface/70 border border-line/60 p-2.5">
                  <span className="font-semibold text-ink">Beef Stew (tender lean beef)</span>
                  <span className="font-mono text-muted">150g · 285 kcal</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center text-xs font-mono">
                <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-2 text-cyan-600 dark:text-cyan-300">
                  <div className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400">Protein</div>
                  <div className="font-bold text-sm">45g</div>
                </div>
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2 text-amber-600 dark:text-amber-300">
                  <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Carbs</div>
                  <div className="font-bold text-sm">71g</div>
                </div>
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-2 text-rose-600 dark:text-rose-300">
                  <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Fats</div>
                  <div className="font-bold text-sm">18g</div>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* SEO Nutrition Reference Table Section */}
        <section className="border-y border-line bg-surface-raised/70 backdrop-blur-xl py-16" aria-labelledby="reference-table-heading">
          <div className="mx-auto w-full max-w-5xl px-5">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="chip !text-[11px] font-semibold text-emerald-600 dark:text-emerald-300 mb-2">
                Official Kenya Food Composition Data
              </span>
              <h2 id="reference-table-heading" className="text-2xl font-extrabold sm:text-3xl text-ink">
                Popular Kenyan Foods Calories &amp; Macros Guide
              </h2>
              <p className="mt-2 text-sm text-muted">
                Reference values compiled from Kenya Food Composition Tables and USDA FDC.
                Every dish is calibrated deterministically per 100g.
              </p>
            </div>

            {/* Nutrition Table */}
            <div className="overflow-x-auto rounded-2xl border border-line bg-surface/85 shadow-lg">
              <table className="w-full text-left text-xs sm:text-sm">
                <caption className="sr-only">Kenyan staple foods calorie and macronutrient breakdown</caption>
                <thead className="border-b border-line bg-surface-overlay/80 text-[11px] uppercase tracking-wider text-muted font-bold">
                  <tr>
                    <th scope="col" className="p-3.5">Kenyan Food Item</th>
                    <th scope="col" className="p-3.5">Portion Size</th>
                    <th scope="col" className="p-3.5 text-right">Calories</th>
                    <th scope="col" className="p-3.5 text-right">Protein</th>
                    <th scope="col" className="p-3.5 text-right">Carbs</th>
                    <th scope="col" className="p-3.5 text-right">Fat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-mono text-ink">
                  {TOP_KENYAN_FOODS.map((food, i) => (
                    <tr key={food.name} className={i % 2 === 0 ? "bg-transparent" : "bg-surface-raised/40"}>
                      <th scope="row" className="p-3.5 font-sans font-semibold text-ink">
                        {food.name}
                      </th>
                      <td className="p-3.5 font-sans text-muted">{food.serving}</td>
                      <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {food.kcal} kcal
                      </td>
                      <td className="p-3.5 text-right text-cyan-600 dark:text-cyan-300">
                        {food.p}g
                      </td>
                      <td className="p-3.5 text-right text-amber-600 dark:text-amber-300">
                        {food.c}g
                      </td>
                      <td className="p-3.5 text-right text-rose-600 dark:text-rose-300">
                        {food.f}g
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
              <span>Looking for githeri special, mutura, rolex, managu, or terere?</span>
              <Link
                href="/dashboard/search"
                className="chip font-bold hover:!border-emerald-500 text-emerald-600 dark:text-emerald-300 transition"
              >
                Search all 90+ foods in database →
              </Link>
            </div>
          </div>
        </section>

        {/* Why Tracking Matters */}
        <section className="mx-auto w-full max-w-6xl px-5 py-20" aria-labelledby="why-track-heading">
          <h2 id="why-track-heading" className="text-center text-2xl font-extrabold sm:text-4xl text-ink">
            Why bother counting calories in Kenya?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted sm:text-base">
            You cannot manage what you do not measure. Traditional Kenyan plates
            can vary widely in oil, starches, and portions. Seeing the numbers
            gives you power over your health.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <article className="card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-xl text-emerald-500 mb-3" aria-hidden="true">
                ⚖️
              </div>
              <h3 className="font-bold text-base text-ink">Weight change is physics</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Fat loss requires a gentle, sustained calorie deficit; muscle growth requires a
                calibrated surplus. Tracking eliminates guesswork so you stay on your goal.
              </p>
            </article>

            <article className="card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-xl text-cyan-500 mb-3" aria-hidden="true">
                👀
              </div>
              <h3 className="font-bold text-base text-ink">Portions silently deceive</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                A &ldquo;small&rdquo; mound of ugali with chapati and sweet chai can quietly
                pack 1,200+ kcal. Seeing measured grams gives you effortless, clear awareness.
              </p>
            </article>

            <article className="card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-xl text-amber-500 mb-3" aria-hidden="true">
                📊
              </div>
              <h3 className="font-bold text-base text-ink">Consistency builds intuition</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Daily logging trains your eye. After a few weeks, you intuitively know
                how much protein you&apos;re getting and make smarter choices anywhere.
              </p>
            </article>
          </div>
        </section>

        {/* Features Grid */}
        <section className="border-t border-line bg-surface-raised/60 backdrop-blur-xl py-20" aria-labelledby="features-heading">
          <div className="mx-auto w-full max-w-6xl px-5">
            <h2 id="features-heading" className="text-center text-2xl font-extrabold sm:text-4xl text-ink">
              Built for speed, accuracy, and Kenyan plates
            </h2>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article
                  key={f.title}
                  className="card hover:border-emerald-500/40 transition-all p-6"
                >
                  <span className="text-2xl" aria-hidden="true">{f.icon}</span>
                  <h3 className="mt-3 font-bold text-base text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="mx-auto w-full max-w-4xl px-5 py-20" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-center text-2xl font-extrabold sm:text-3xl text-ink">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="card p-5 group open:ring-1 open:ring-emerald-500/30" open={i < 2}>
                <summary className="font-bold text-sm text-ink cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="ml-2 text-muted group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed border-t border-line/60 pt-2.5">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/dashboard"
              className="btn-primary !py-3.5 !px-8 text-base font-bold shadow-xl shadow-emerald-500/25"
              title="Open the dashboard and start tracking"
            >
              Open Dashboard &amp; Start Tracking →
            </Link>
          </div>
        </section>
      </main>

      {/* Structured SEO Footer */}
      <footer className="border-t border-line py-12 bg-surface-raised/80 backdrop-blur-xl text-xs text-muted" role="contentinfo">
        <div className="mx-auto max-w-6xl px-5 grid gap-8 sm:grid-cols-4">
          <div className="space-y-2">
            <span className="text-sm font-extrabold tracking-widest text-ink">fod-track</span>
            <p className="text-[11px] leading-relaxed">
              Fast, minimal AI nutrition and calorie tracker built specifically for Kenya 🇰🇪.
              Dual-mode vision + barcode tracking with offline-first local foods.
            </p>
          </div>

          <div>
            <p className="font-bold text-ink uppercase tracking-wider text-[11px] mb-2">Track &amp; Log</p>
            <ul className="space-y-1.5">
              <li><Link href="/dashboard" className="hover:text-ink">Nutrition Dashboard</Link></li>
              <li><Link href="/dashboard/scan" className="hover:text-ink">AI Meal Photo Scanner</Link></li>
              <li><Link href="/dashboard/barcode" className="hover:text-ink">Barcode Scanner (UPC/EAN)</Link></li>
              <li><Link href="/dashboard/search" className="hover:text-ink">Food Database Search</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-ink uppercase tracking-wider text-[11px] mb-2">Kenyan Nutrition</p>
            <ul className="space-y-1.5">
              <li><Link href="/dashboard/search?q=ugali" className="hover:text-ink">Ugali Calories &amp; Macros</Link></li>
              <li><Link href="/dashboard/search?q=sukuma" className="hover:text-ink">Sukuma Wiki Nutrition</Link></li>
              <li><Link href="/dashboard/search?q=choma" className="hover:text-ink">Nyama Choma Protein</Link></li>
              <li><Link href="/dashboard/search?q=githeri" className="hover:text-ink">Githeri &amp; Ndengu Stews</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-ink uppercase tracking-wider text-[11px] mb-2">Methodology</p>
            <ul className="space-y-1.5">
              <li><Link href="/how-it-works" className="hover:text-ink">How AI Vision Works</Link></li>
              <li><Link href="/dashboard/profile" className="hover:text-ink">BMR &amp; TDEE Calculator</Link></li>
              <li><Link href="/sitemap.xml" className="hover:text-ink">XML Sitemap</Link></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-5 mt-8 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <p>© {new Date().getFullYear()} fod-track. No cookies. Open source nutrition math.</p>
          <p>Kenya Food Composition Tables · USDA FoodData Central · Open Food Facts</p>
        </div>
      </footer>
    </div>
  );
}
