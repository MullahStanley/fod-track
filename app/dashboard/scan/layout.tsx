import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Meal Photo Scanner — Zero-Calorie Guessing",
  description:
    "Snap a photo of your meal. On-device vision decomposes ingredients and portion weights without inventing calories, calibrated against Kenyan food composition tables.",
  alternates: { canonical: "/dashboard/scan" },
  openGraph: {
    title: "AI Meal Photo Scanner — Zero-Calorie Guessing · fod-track",
    description:
      "Snap a photo of your meal. On-device vision decomposes ingredients and portion weights without inventing calories.",
    url: "https://fod-track.app/dashboard/scan",
    type: "website",
  },
};

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
