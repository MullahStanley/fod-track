import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/dashboard"],
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://fod-track.app/sitemap.xml",
  };
}
