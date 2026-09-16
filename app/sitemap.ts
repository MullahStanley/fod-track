import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://fod-track.app";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/dashboard`, changeFrequency: "daily", priority: 0.9 },
  ];
}
