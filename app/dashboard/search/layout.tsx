import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kenyan Food Nutrition & Calorie Database",
  description:
    "Search verified calories, protein, carbs, and fats for 100+ Kenyan foods and East African staples: Ugali, Nyama Choma, Sukuma Wiki, Githeri, Rolex, Chapati, Dawa, and local packaged foods.",
  alternates: { canonical: "/dashboard/search" },
  openGraph: {
    title: "Kenyan Food Nutrition & Calorie Database · fod-track",
    description:
      "Search verified calories, protein, carbs, and fats for 100+ Kenyan foods and East African staples.",
    url: "https://fod-track.app/dashboard/search",
    type: "website",
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
