import type { Metadata } from "next";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE.name}, a free word unscrambler and word-game finder.`,
  alternates: { canonical: canonical("/about") },
};

export default function AboutPage() {
  return (
    <article className="prose">
      <h1>About {SITE.name}</h1>
      <p>
        {SITE.name} is a free, fast word unscrambler and word-game helper. Drop
        in your letters and we instantly find every valid word you can make,
        scored for both Scrabble and Words With Friends and sorted so the best
        plays come first.
      </p>
      <h2>How it works</h2>
      <p>
        Every query is checked against the ENABLE word list — a public-domain
        dictionary of more than 170,000 words that is widely used by word-game
        tools. Our engine computes which words your tiles can form (including
        blank/wild tiles) in milliseconds and groups them by length.
      </p>
      <h2>Who it&apos;s for</h2>
      <p>
        Whether you&apos;re hunting a bingo in Scrabble, sneaking a high-value
        play in Words With Friends, cracking an anagram, or narrowing down a
        Wordle guess, {SITE.name} is built to give you the answer fast and
        without clutter.
      </p>
      <p className="muted">
        {SITE.name} is an independent study and entertainment tool. It is not
        affiliated with, sponsored by, or endorsed by the owners of the SCRABBLE
        or Words With Friends trademarks.
      </p>
    </article>
  );
}
