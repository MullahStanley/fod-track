import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metabolic Profile & TDEE Macro Calculator",
  description:
    "Calculate your Mifflin-St Jeor basal metabolic rate (BMR), total daily energy expenditure (TDEE), and custom macro splits for fat loss, maintenance, or muscle gain.",
  alternates: { canonical: "/dashboard/profile" },
  openGraph: {
    title: "Metabolic Profile & TDEE Macro Calculator · fod-track",
    description:
      "Calculate your Mifflin-St Jeor basal metabolic rate (BMR), total daily energy expenditure (TDEE), and custom macro splits.",
    url: "https://fod-track.app/dashboard/profile",
    type: "website",
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
