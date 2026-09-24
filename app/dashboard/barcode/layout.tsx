import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Barcode Nutrition Scanner & Kenyan Packaged Goods",
  description:
    "Instant camera barcode scanner for Kenyan packaged foods, dairy, beverages, and pantry items with offline caching and Open Food Facts lookup.",
  alternates: { canonical: "/dashboard/barcode" },
  openGraph: {
    title: "Barcode Nutrition Scanner & Kenyan Packaged Goods · fod-track",
    description:
      "Instant camera barcode scanner for Kenyan packaged foods, dairy, beverages, and pantry items with offline caching.",
    url: "https://fod-track.app/dashboard/barcode",
    type: "website",
  },
};

export default function BarcodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
