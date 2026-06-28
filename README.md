# Word Unscrambler

A fast, SEO-first **Word Unscrambler & Scrabble word finder** built with Next.js
— a Google-Display-ad-focused utility site in the spirit of wordunscrambler.me
and calculator.net. Targeted at the USA and tier-1 English-speaking markets.

> Looking for the original `context-window-awareness` Claude Code plugin that
> used to live here? It's preserved in [`README-plugin.md`](./README-plugin.md)
> and the `plugins/` directory.

## Why this niche

- **Evergreen, high-volume search** — "unscramble", "scrabble word finder",
  "words with friends cheat" are searched millions of times a month.
- **Endless long-tail** — every letter combination is its own indexable page
  (`/unscramble/listen`, `/unscramble/qwerty`, …), so ad inventory scales with
  crawl depth.
- **Cheap to serve** — results are computed from a bundled dictionary; no paid
  APIs, great Core Web Vitals (which lifts both ranking and RPM).

## Features

- ⚡ Unscramble up to 15 letters against the **172k-word ENABLE** dictionary
  (public domain) in milliseconds.
- 🃏 Blank/wild tiles (`?` or `*`), plus starts-with / ends-with / contains and
  length filters.
- 🎯 Dual **Scrabble** and **Words With Friends** scoring on every result.
- 🔎 SEO engine: SSG/ISR `/unscramble/[letters]` landing pages, JSON-LD
  (WebSite, FAQ, Breadcrumb), `sitemap.xml`, `robots.txt`, canonical URLs, Open
  Graph.
- 💰 `AdSlot` component wired for **Google AdSense** (leaderboard, in-content,
  rectangle) with policy-friendly labels and CLS-safe reserved space. Renders
  visible placeholders until you add your publisher id.
- 🍪 Cookie/ads consent banner + GDPR/CCPA-aware privacy policy and terms (the
  pages AdSense requires for approval).

## Tech stack

- **Next.js 15** (App Router, React 19, TypeScript)
- Server-side unscrambling via a Node API route + ISR pages
- Zero CSS framework — hand-written CSS for minimal payload and top Lighthouse
  scores

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: set site URL + AdSense id
npm run dev                  # http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

## Configuration

Set these environment variables (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used for SEO, sitemap, robots, OG tags. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Your `ca-pub-…` id. Empty = labelled ad placeholders. |

Also update the brand name, domain, and contact emails in `lib/site.ts`. To turn
real ads on, add your AdSense publisher id **and** each unit's `data-ad-slot`
value (pass it to `<AdSlot slot="...">`).

## Project layout

```
app/
  page.tsx                     Homepage + interactive tool + FAQ
  unscramble/[letters]/        SEO landing pages (one per letter set)
  scrabble-word-finder/        Scrabble-scored variant
  words-with-friends/          WWF-scored variant
  about | contact | privacy | terms
  api/unscramble/route.ts      JSON unscramble endpoint
  sitemap.ts | robots.ts | icon.svg
components/                    Unscrambler, Results, AdSlot, Header, Footer, …
lib/                           dictionary loader, unscramble engine, site config
data/enable1.txt               172k-word public-domain dictionary
```

## Deploying

Deploys cleanly to **Vercel** (zero config) or any Node host. The dictionary is
included in the serverless bundle via `outputFileTracingIncludes`. Landing pages
use ISR (`revalidate = 86400`) so they're cached at the edge after first render.

After launch: submit `sitemap.xml` in Google Search Console, then apply for
AdSense once you have original content + traffic.

## Legal

Dictionary: ENABLE word list (public domain). SCRABBLE, Words With Friends, and
Wordle are trademarks of their respective owners; this project is an independent
study/entertainment tool and is not affiliated or endorsed.
