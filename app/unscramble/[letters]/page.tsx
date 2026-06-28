import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Results from "@/components/Results";
import AdSlot from "@/components/AdSlot";
import RelatedLinks from "@/components/RelatedLinks";
import Unscrambler from "@/components/Unscrambler";
import { unscramble, slugToLetters } from "@/lib/unscramble";
import { POPULAR_LETTERS } from "@/lib/popular";
import { SITE, canonical } from "@/lib/site";

// Pre-render the popular letter sets at build time; render the rest on demand
// and cache them (ISR) for a day.
export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return POPULAR_LETTERS.map((letters) => ({ letters }));
}

type Params = { params: Promise<{ letters: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { letters: raw } = await params;
  const letters = slugToLetters(raw);
  if (!letters) return { title: "Word Unscrambler" };
  const up = letters.toUpperCase();
  const title = `Unscramble ${up} — Words Made From These Letters`;
  const description = `All words you can make by unscrambling the letters ${up}, with Scrabble and Words With Friends point values. Free word finder and anagram solver.`;
  return {
    title,
    description,
    alternates: { canonical: canonical(`/unscramble/${letters}`) },
    openGraph: { title, description, url: canonical(`/unscramble/${letters}`) },
  };
}

export default async function UnscramblePage({ params }: Params) {
  const { letters: raw } = await params;
  const letters = slugToLetters(raw);
  if (!letters) notFound();

  const data = await unscramble({ letters, limit: 500 });
  const up = letters.toUpperCase();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Word Unscrambler", item: canonical("/") },
      { "@type": "ListItem", position: 2, name: `Unscramble ${up}`, item: canonical(`/unscramble/${letters}`) },
    ],
  };

  const top = data.results.slice(0, 5).map((r) => r.word).join(", ");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Word Unscrambler</Link> &rsaquo; Unscramble {up}
      </nav>

      <section className="hero" style={{ textAlign: "left", marginBottom: 14 }}>
        <h1>Unscramble {up}</h1>
        <p className="lead" style={{ margin: 0 }}>
          {data.total > 0 ? (
            <>
              We found <strong>{data.total.toLocaleString()}</strong> words you
              can make from the letters <strong>{up}</strong>
              {top ? <>, including {top}.</> : "."}
            </>
          ) : (
            <>No dictionary words can be made from the letters {up}.</>
          )}
        </p>
      </section>

      <div className="card">
        <Unscrambler initialLetters={letters} />
      </div>

      <AdSlot slot="" format="horizontal" minHeight={120} />

      <div className="card section-gap">
        <h2>Words made from {up}</h2>
        <Results data={data} />
      </div>

      <AdSlot slot="" format="rectangle" minHeight={250} />

      <RelatedLinks exclude={letters} />

      <article className="prose">
        <h2>How many words can you make from {up}?</h2>
        <p>
          The letters <strong>{up}</strong> can be rearranged into{" "}
          {data.total.toLocaleString()}{" "}
          {data.total === 1 ? "valid word" : "valid words"} from our{" "}
          {SITE.name} dictionary. Results are grouped by length and scored for
          both Scrabble and Words With Friends, so you can quickly spot the
          highest-value play for your next turn. Try the box above to add blank
          tiles or filter by starting and ending letters.
        </p>
      </article>
    </>
  );
}
