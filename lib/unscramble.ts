// Core unscrambling engine + tile scoring. Server-side (uses the dictionary).

import { getDictionary } from "./dictionary";

const A = 97;

// Standard Scrabble (TWL/SOWPODS) letter values.
export const SCRABBLE_POINTS: Record<string, number> = {
  a: 1, e: 1, i: 1, o: 1, u: 1, l: 1, n: 1, s: 1, t: 1, r: 1,
  d: 2, g: 2,
  b: 3, c: 3, m: 3, p: 3,
  f: 4, h: 4, v: 4, w: 4, y: 4,
  k: 5,
  j: 8, x: 8,
  q: 10, z: 10,
};

// Words With Friends letter values (differ from Scrabble).
export const WWF_POINTS: Record<string, number> = {
  a: 1, e: 1, i: 1, o: 1, t: 1, r: 1,
  d: 2, l: 2, n: 2, s: 2, u: 2,
  g: 3, h: 3, y: 3,
  b: 4, c: 4, f: 4, m: 4, p: 4, w: 4,
  k: 5, v: 5,
  x: 8,
  j: 10, q: 10, z: 10,
};

export function scrabbleScore(word: string): number {
  let s = 0;
  for (const ch of word) s += SCRABBLE_POINTS[ch] ?? 0;
  return s;
}

export function wwfScore(word: string): number {
  let s = 0;
  for (const ch of word) s += WWF_POINTS[ch] ?? 0;
  return s;
}

export interface UnscrambleResult {
  word: string;
  length: number;
  scrabble: number;
  wwf: number;
}

export interface UnscrambleOptions {
  /** Raw letters; `?` or `*` are treated as blank/wildcard tiles. */
  letters: string;
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  minLength?: number;
  maxLength?: number;
  /** Only return words that use every available tile. */
  useAllLetters?: boolean;
  /** Cap on results returned (engine still counts the full total). */
  limit?: number;
}

export interface UnscrambleResponse {
  query: string;
  total: number;
  results: UnscrambleResult[];
  byLength: { length: number; words: UnscrambleResult[] }[];
}

function sanitize(input: string): { counts: Int32Array; wild: number; tiles: number } {
  const counts = new Int32Array(26);
  let wild = 0;
  let tiles = 0;
  for (const raw of input.toLowerCase()) {
    if (raw === "?" || raw === "*" || raw === " ") {
      if (raw !== " ") {
        wild++;
        tiles++;
      }
      continue;
    }
    const code = raw.charCodeAt(0) - A;
    if (code >= 0 && code < 26) {
      counts[code]++;
      tiles++;
    }
  }
  return { counts, wild, tiles };
}

export async function unscramble(opts: UnscrambleOptions): Promise<UnscrambleResponse> {
  const dict = await getDictionary();
  const { counts: have, wild, tiles } = sanitize(opts.letters);

  const minLength = Math.max(1, opts.minLength ?? 1);
  const maxLength = Math.min(opts.maxLength ?? 15, 15);
  const startsWith = (opts.startsWith ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const endsWith = (opts.endsWith ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const contains = (opts.contains ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const limit = opts.limit ?? 1000;

  const { words, lengths, counts } = dict;
  const n = words.length;
  const out: UnscrambleResult[] = [];
  let total = 0;

  for (let i = 0; i < n; i++) {
    const len = lengths[i];
    if (len > tiles) continue;
    if (opts.useAllLetters && len !== tiles) continue;
    if (len < minLength || len > maxLength) continue;

    // Count how many letters we are short — these must be covered by blanks.
    const base = i * 26;
    let deficit = 0;
    for (let c = 0; c < 26; c++) {
      const need = counts[base + c] - have[c];
      if (need > 0) {
        deficit += need;
        if (deficit > wild) break;
      }
    }
    if (deficit > wild) continue;

    const w = words[i];
    if (startsWith && !w.startsWith(startsWith)) continue;
    if (endsWith && !w.endsWith(endsWith)) continue;
    if (contains && !w.includes(contains)) continue;

    total++;
    if (out.length < limit) {
      out.push({
        word: w,
        length: len,
        scrabble: scrabbleScore(w),
        wwf: wwfScore(w),
      });
    }
  }

  // Best plays first: longest, then highest Scrabble value, then alphabetical.
  out.sort(
    (a, b) =>
      b.length - a.length ||
      b.scrabble - a.scrabble ||
      (a.word < b.word ? -1 : a.word > b.word ? 1 : 0),
  );

  const groups = new Map<number, UnscrambleResult[]>();
  for (const r of out) {
    const g = groups.get(r.length) ?? [];
    g.push(r);
    groups.set(r.length, g);
  }
  const byLength = [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([length, words]) => ({ length, words }));

  return { query: opts.letters, total, results: out, byLength };
}

/** Normalize a slug like "List-en!" -> "listen" for /unscramble/[letters]. */
export function slugToLetters(slug: string): string {
  return decodeURIComponent(slug)
    .toLowerCase()
    .replace(/[^a-z?*]/g, "")
    .slice(0, 15);
}
