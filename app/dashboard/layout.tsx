import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Nutrition & Calorie Dashboard",
  description:
    "Track daily meals, monitor remaining calories against your Mifflin-St Jeor TDEE target, log hydration, and keep macro splits on track.",
  alternates: { canonical: "/dashboard" },
  openGraph: {
    title: "Daily Nutrition & Calorie Dashboard · fod-track",
    description:
      "Track daily meals, monitor remaining calories against your Mifflin-St Jeor TDEE target, log hydration, and keep macro splits on track.",
    url: "https://fod-track.app/dashboard",
    type: "website",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
