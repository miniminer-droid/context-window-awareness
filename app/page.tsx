import Unscrambler from "@/components/Unscrambler";
import AdSlot from "@/components/AdSlot";
import RelatedLinks from "@/components/RelatedLinks";
import { SITE } from "@/lib/site";

const FAQ = [
  {
    q: "What is a word unscrambler?",
    a: "A word unscrambler takes a set of jumbled or mixed-up letters and instantly finds every valid dictionary word you can make from them. It's the fastest way to solve anagrams and find high-scoring plays in word games.",
  },
  {
    q: "How do I use blank tiles?",
    a: "Type a ? or * anywhere in your letters to represent a blank or wild tile. Each blank can stand in for any single letter, just like in Scrabble and Words With Friends.",
  },
  {
    q: "Does it work for Scrabble and Words With Friends?",
    a: "Yes. Every result shows both its Scrabble and Words With Friends point value so you can pick the highest-scoring word for whichever game you're playing.",
  },
  {
    q: "Is this word finder free?",
    a: "Completely free, with no sign-up. The tool runs in your browser and returns results in milliseconds.",
  },
];

export default function HomePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="hero">
        <h1>Word Unscrambler</h1>
        <p className="lead">
          Enter your letters and instantly unscramble them into every winning
          word for Scrabble, Words With Friends, Wordle, and anagram puzzles.
        </p>
      </section>

      <div className="card">
        <Unscrambler />
      </div>

      <AdSlot slot="" format="horizontal" minHeight={120} />

      <RelatedLinks />

      <article className="prose">
        <h2>The fastest way to unscramble words</h2>
        <p>
          Stuck on a rack of letters? Paste them into the box above and{" "}
          {SITE.name} checks them against a dictionary of more than 170,000
          words in milliseconds, then sorts the matches so the longest,
          highest-scoring plays appear first. Add a blank tile with{" "}
          <code>?</code> or <code>*</code>, or use the advanced filters to find
          words that start with, end with, or contain specific letters.
        </p>

        <h2>Built for word-game players</h2>
        <ul>
          <li><strong>Scrabble &amp; Words With Friends:</strong> every result is scored for both games so you can grab the most points.</li>
          <li><strong>Anagram solver:</strong> rearrange all of your letters to crack any anagram or jumble.</li>
          <li><strong>Wordle helper:</strong> filter by length and known letters to narrow down the answer.</li>
          <li><strong>Blank tiles:</strong> wildcards let you model the real tiles on your rack.</li>
        </ul>

        <h2>Frequently asked questions</h2>
        <dl className="faq">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt>{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
      </article>

      <AdSlot slot="" format="rectangle" minHeight={250} />
    </>
  );
}
