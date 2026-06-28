// Server-only dictionary loader and index.
//
// The ENABLE word list (~173k words, public domain) is read once from disk and
// turned into a compact, fast-to-query in-memory index. The index is cached in
// module scope so warm serverless invocations reuse it.

import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

const A = 97; // char code for 'a'

export interface DictIndex {
  /** All words, lowercase, sorted by length then alpha. */
  words: string[];
  /** Word length for words[i]. */
  lengths: Uint8Array;
  /** Flat 26-slot letter-count vectors: counts[i*26 + (c-97)]. */
  counts: Uint8Array;
  /** Set for O(1) "is this a valid word" lookups. */
  set: Set<string>;
}

let cache: DictIndex | null = null;
let loading: Promise<DictIndex> | null = null;

async function build(): Promise<DictIndex> {
  const file = path.join(process.cwd(), "data", "enable1.txt");
  const raw = await fs.readFile(file, "utf8");

  const words = raw
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0 && /^[a-z]+$/.test(w));

  // Sort longest first (best Scrabble plays bubble to the top by default).
  words.sort((a, b) => b.length - a.length || (a < b ? -1 : a > b ? 1 : 0));

  const n = words.length;
  const lengths = new Uint8Array(n);
  const counts = new Uint8Array(n * 26);
  const set = new Set<string>();

  for (let i = 0; i < n; i++) {
    const w = words[i];
    lengths[i] = w.length;
    set.add(w);
    const base = i * 26;
    for (let j = 0; j < w.length; j++) {
      counts[base + (w.charCodeAt(j) - A)]++;
    }
  }

  return { words, lengths, counts, set };
}

export async function getDictionary(): Promise<DictIndex> {
  if (cache) return cache;
  if (!loading) loading = build().then((d) => (cache = d));
  return loading;
}
