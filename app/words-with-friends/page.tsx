import type { Metadata } from "next";
import Unscrambler from "@/components/Unscrambler";
import AdSlot from "@/components/AdSlot";
import RelatedLinks from "@/components/RelatedLinks";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Words With Friends Cheat — Word Finder With WWF Scoring",
  description:
    "Free Words With Friends cheat and word finder. Enter your tiles and blanks to see every playable word with its Words With Friends point value.",
  alternates: { canonical: canonical("/words-with-friends") },
};

export default function WwfPage() {
  return (
    <>
      <section className="hero">
        <h1>Words With Friends Cheat</h1>
        <p className="lead">
          Enter your letters (use <code>?</code> for blanks) and get every
          playable word scored with Words With Friends tile values — sorted so
          the biggest plays come first.
        </p>
      </section>

      <div className="card">
        <Unscrambler scoring="wwf" />
      </div>

      <AdSlot slot="" format="horizontal" minHeight={120} />
      <RelatedLinks />

      <article className="prose">
        <h2>Find your best Words With Friends play</h2>
        <p>
          Words With Friends uses different tile values than Scrabble, so the
          best word isn&apos;t always the same. This finder scores every result
          with the official Words With Friends point values and ranks them so you
          can pocket the most points each turn. Blanks and start/end/contains
          filters are fully supported.
        </p>
        <h2>Words With Friends letter values</h2>
        <ul>
          <li>1 point: A, E, I, O, R, T</li>
          <li>2 points: D, L, N, S, U</li>
          <li>3 points: G, H, Y</li>
          <li>4 points: B, C, F, M, P, W</li>
          <li>5 points: K, V</li>
          <li>8 points: X</li>
          <li>10 points: J, Q, Z</li>
        </ul>
        <p className="muted">
          Words With Friends is a trademark of its respective owner. This tool is
          an independent study aid and is not affiliated or endorsed.
        </p>
      </article>
      <AdSlot slot="" format="rectangle" minHeight={250} />
    </>
  );
}
