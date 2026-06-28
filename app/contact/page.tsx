import type { Metadata } from "next";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with the ${SITE.name} team.`,
  alternates: { canonical: canonical("/contact") },
};

export default function ContactPage() {
  return (
    <article className="prose">
      <h1>Contact Us</h1>
      <p>
        Questions, feedback, a word you think is missing, or a bug to report?
        We&apos;d love to hear from you.
      </p>
      <p>
        Email:{" "}
        <a href={`mailto:hello@${SITE.domain}`}>hello@{SITE.domain}</a>
      </p>
      <p className="muted">
        Replace this address with your real support inbox before launch (set the
        domain via <code>NEXT_PUBLIC_SITE_URL</code> and update{" "}
        <code>lib/site.ts</code>).
      </p>
    </article>
  );
}
