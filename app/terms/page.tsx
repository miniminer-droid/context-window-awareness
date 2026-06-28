import type { Metadata } from "next";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms of use for ${SITE.name}.`,
  alternates: { canonical: canonical("/terms") },
};

export default function TermsPage() {
  return (
    <article className="prose">
      <h1>Terms of Use</h1>
      <p className="muted">Last updated: June 28, 2026</p>

      <p>
        By accessing {SITE.name} ({SITE.domain}, the &ldquo;Site&rdquo;) you
        agree to these Terms of Use. If you do not agree, please do not use the
        Site.
      </p>

      <h2>Use of the Site</h2>
      <p>
        {SITE.name} is provided free of charge for personal, non-commercial use
        as a word-game study and entertainment aid. You agree not to misuse the
        Site, including attempting to disrupt it, scrape it at abusive rates, or
        access it through automated means that degrade service for others.
      </p>

      <h2>No warranty</h2>
      <p>
        The Site and its results are provided &ldquo;as is&rdquo; without
        warranties of any kind. Word lists and scoring are provided for
        convenience and may differ from the official dictionary used in any
        particular game or tournament. We do not guarantee accuracy,
        availability, or fitness for a particular purpose.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {SITE.name} and its operators
        shall not be liable for any indirect, incidental, or consequential
        damages arising from your use of the Site.
      </p>

      <h2>Trademarks</h2>
      <p>
        SCRABBLE, Words With Friends, Wordle, and other game names are trademarks
        of their respective owners. {SITE.name} is an independent tool and is not
        affiliated with, sponsored by, or endorsed by those trademark holders.
      </p>

      <h2>Changes</h2>
      <p>
        We may revise these Terms at any time. Continued use of the Site after
        changes are posted constitutes acceptance of the revised Terms.
      </p>
    </article>
  );
}
