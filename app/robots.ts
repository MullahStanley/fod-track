import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/how-it-works",
          "/dashboard",
          "/dashboard/search",
          "/dashboard/barcode",
          "/dashboard/scan",
          "/dashboard/profile",
        ],
        disallow: ["/api/", "/dashboard/review"],
      },
    ],
    sitemap: "https://fod-track.app/sitemap.xml",
  };
}
