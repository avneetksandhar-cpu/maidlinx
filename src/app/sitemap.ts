import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/config/env";

/**
 * Indexable marketing URLs only.
 * Do not list booking funnel steps, auth, dashboards, admin, or dynamic booking IDs.
 * Location/service landing pages are intentionally omitted until Product scopes them.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().replace(/\/$/, "");
  const lastModified = new Date();

  return [
    {
      url: `${base}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/for-business`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/earn`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
