import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://fod-track.app";
  return [
    { url: base, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/how-it-works`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/dashboard`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/dashboard/search`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/dashboard/barcode`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/dashboard/scan`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/dashboard/profile`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
