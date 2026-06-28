import Link from "next/link";
import { POPULAR_LABELS } from "@/lib/popular";

export default function RelatedLinks({
  exclude,
  title = "Popular unscrambles",
}: {
  exclude?: string;
  title?: string;
}) {
  const items = POPULAR_LABELS.filter((p) => p.letters !== exclude).slice(0, 14);
  return (
    <section className="related" aria-label={title}>
      <h2>{title}</h2>
      <ul>
        {items.map((p) => (
          <li key={p.letters}>
            <Link href={`/unscramble/${p.letters}`}>Unscramble {p.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
