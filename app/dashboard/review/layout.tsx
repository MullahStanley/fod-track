import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pre-Log Plate Calibration",
  description:
    "Review detected plate items, adjust weights in grams, account for hidden cooking oils, and approve meal macros before logging.",
  robots: { index: false, follow: false },
};

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
