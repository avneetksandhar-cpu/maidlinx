import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/config/env";

/**
 * Crawl rules for public marketing surfaces only.
 * Private apps, auth, APIs, and booking funnel steps stay out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl().replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/cleaner",
          "/cleaner/",
          "/pro",
          "/pro/",
          "/api/",
          "/book",
          "/book/",
          "/booking",
          "/booking/",
          "/sign-in",
          "/sign-up",
          "/onboarding",
          "/auth/",
          "/profile",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
