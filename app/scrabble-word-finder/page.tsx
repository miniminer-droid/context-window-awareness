import type { Metadata } from "next";
import Unscrambler from "@/components/Unscrambler";
import AdSlot from "@/components/AdSlot";
import RelatedLinks from "@/components/RelatedLinks";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Scrabble Word Finder — Find High-Scoring Words From Your Tiles",
  description:
    "Free Scrabble Word Finder. Enter your rack and blanks to find every playable word with its Scrabble point value, sorted highest first.",
  alternates: { canonical: canonical("/scrabble-word-finder") },
};

export default function ScrabblePage() {
  return (
    <>
      <section className="hero">
        <h1>Scrabble Word Finder</h1>
        <p className="lead">
          Enter the tiles on your rack (use <code>?</code> for blanks) to find
          every legal Scrabble word, ranked by points so you always play the
          highest-scoring move.
        </p>
      </section>

      <div className="card">
        <Unscrambler scoring="scrabble" />
      </div>

      <AdSlot slot="" format="horizontal" minHeight={120} />
      <RelatedLinks />

      <article className="prose">
        <h2>Win more Scrabble games</h2>
        <p>
          Our Scrabble Word Finder checks your letters against a tournament-style
          word list and ranks every result by its Scrabble value, so the biggest
          plays float to the top. Blanks are fully supported — add a{" "}
          <code>?</code> for each blank tile on your rack — and you can filter by
          length or by the letters a word must start with, contain, or end with
          to fit the board.
        </p>
        <h2>Scrabble letter values</h2>
        <ul>
          <li>1 point: E, A, I, O, N, R, T, L, S, U</li>
          <li>2 points: D, G</li>
          <li>3 points: B, C, M, P</li>
          <li>4 points: F, H, V, W, Y</li>
          <li>5 points: K</li>
          <li>8 points: J, X</li>
          <li>10 points: Q, Z</li>
        </ul>
        <p className="muted">
          SCRABBLE is a registered trademark. This tool is for entertainment and
          study, and is not affiliated with or endorsed by the trademark owners.
        </p>
      </article>
      <AdSlot slot="" format="rectangle" minHeight={250} />
    </>
  );
}
