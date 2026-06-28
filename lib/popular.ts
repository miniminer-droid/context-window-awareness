// High-intent letter combinations used for internal linking, the sitemap, and
// pre-rendered SSG landing pages. These long-tail "/unscramble/[letters]" pages
// are the core of the SEO + display-ad strategy.

export const POPULAR_LETTERS: string[] = [
  "listen", "silent", "stone", "ocean", "friend", "stream", "master",
  "garden", "planet", "ranges", "silver", "winter", "spring", "summer",
  "orange", "purple", "yellow", "castle", "dragon", "knight", "wizard",
  "rescue", "puzzle", "letter", "anagram", "scrabble", "racing", "danger",
  "gander", "teacher", "cheater", "thicker", "kitchen", "monster", "rooster",
  "creator", "reactor", "dearest", "diaster", "remains", "marines", "seminar",
  "noters", "tresno", "aeiou", "qwerty", "tablet", "phones", "guitar",
];

export const POPULAR_LABELS: { letters: string; label: string }[] =
  POPULAR_LETTERS.slice(0, 18).map((l) => ({ letters: l, label: l.toUpperCase() }));
