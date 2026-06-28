import Link from "next/link";
import RelatedLinks from "@/components/RelatedLinks";

export default function NotFound() {
  return (
    <>
      <section className="hero">
        <h1>Page not found</h1>
        <p className="lead">
          We couldn&apos;t find that page. Head back to the{" "}
          <Link href="/">word unscrambler</Link> or try a popular search below.
        </p>
      </section>
      <RelatedLinks />
    </>
  );
}
