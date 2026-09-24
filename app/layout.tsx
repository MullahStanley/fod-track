import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeScript } from "@/components/theme";
import { GalaxyBackground } from "@/components/galaxy-background";

export const metadata: Metadata = {
  metadataBase: new URL("https://fod-track.app"),
  title: {
    default: "fod-track — AI Calorie & Nutrition Tracking for Kenya",
    template: "%s · fod-track",
  },
  description:
    "Track calories and macros with AI meal scanning, barcode lookup, and a built-in database of Kenyan and East African foods. Free, fast, and mobile-first.",
  keywords: [
    "calorie tracker Kenya",
    "Kenyan food nutrition",
    "calorie counting app Africa",
    "macro tracker",
    "AI meal scanner",
    "ugali calories",
    "nutrition tracker",
  ],
  openGraph: {
    title: "fod-track — AI Calorie & Nutrition Tracking for Kenya",
    description:
      "AI meal scanning, barcode lookup, and Kenyan local foods. Know what your plate costs you before you eat it.",
    type: "website",
    siteName: "fod-track",
  },
  twitter: {
    card: "summary",
    title: "fod-track — AI Calorie & Nutrition Tracking for Kenya",
    description:
      "AI meal scanning, barcode lookup, and Kenyan local foods. Know what your plate costs you before you eat it.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased text-ink relative selection:bg-emerald-500/30">
        <GalaxyBackground />
        <div className="relative z-10 flex min-h-dvh flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
