import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { POPULAR_LETTERS } from "@/lib/popular";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date("2026-06-28");

  const staticPages = [
    "", "/scrabble-word-finder", "/words-with-friends",
    "/about", "/contact", "/privacy", "/terms",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.6,
  }));

  const letterPages = POPULAR_LETTERS.map((l) => ({
    url: `${base}/unscramble/${l}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...letterPages];
}
