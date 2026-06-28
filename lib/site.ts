// Central site configuration. Override via environment variables at deploy time.

export const SITE = {
  name: "WordUnscramble",
  domain: "wordunscramble.example", // set NEXT_PUBLIC_SITE_URL in production
  tagline: "Word Unscrambler & Scrabble Word Finder",
  description:
    "Free word unscrambler that turns your jumbled letters into winning words for Scrabble, Words With Friends, and Wordle. Supports blank tiles, length filters, and point scoring.",
  // Google AdSense publisher id, e.g. "ca-pub-XXXXXXXXXXXXXXXX".
  // Leave empty during development to render labelled ad placeholders.
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "",
};

export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return `https://${SITE.domain}`;
}

export function canonical(path = "/"): string {
  const base = siteUrl();
  return path === "/" ? base : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
