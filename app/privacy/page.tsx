import type { Metadata } from "next";
import Link from "next/link";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${SITE.name}, covering cookies and Google AdSense advertising.`,
  alternates: { canonical: canonical("/privacy") },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <article className="prose">
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: June 28, 2026</p>

      <p>
        This Privacy Policy explains how {SITE.name} (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;) handles information when you use {SITE.domain} (the
        &ldquo;Site&rdquo;). By using the Site you agree to this policy.
      </p>

      <h2>Information we collect</h2>
      <p>
        We do not require you to create an account, and the letters you enter
        into our tools are processed to return results and are not used to
        identify you. Like most websites, our servers and analytics may
        automatically record standard log data such as your browser type,
        device, approximate location, and pages visited.
      </p>

      <h2>Cookies</h2>
      <p>
        We and our partners use cookies and similar technologies to operate the
        Site, remember your preferences, measure traffic, and serve advertising.
        You can disable cookies in your browser settings, though some features
        may not work as intended.
      </p>

      <h2>Advertising &amp; Google AdSense</h2>
      <p>
        We use third-party advertising companies, including Google, to serve ads
        when you visit the Site.
      </p>
      <ul>
        <li>
          Third-party vendors, including Google, use cookies to serve ads based
          on your prior visits to this and other websites.
        </li>
        <li>
          Google&apos;s use of advertising cookies enables it and its partners to
          serve ads to you based on your visit to our Site and/or other sites on
          the Internet.
        </li>
        <li>
          You may opt out of personalized advertising by visiting{" "}
          <a href="https://www.google.com/settings/ads" rel="nofollow noopener" target="_blank">
            Google Ads Settings
          </a>
          . You can also opt out of third-party vendors&apos; use of cookies for
          personalized advertising at{" "}
          <a href="https://www.aboutads.info/choices/" rel="nofollow noopener" target="_blank">
            aboutads.info/choices
          </a>
          .
        </li>
      </ul>
      <p>
        For more information on how Google uses data, see{" "}
        <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener" target="_blank">
          How Google uses information from sites that use its services
        </a>
        .
      </p>

      <h2>Your rights (GDPR &amp; CCPA)</h2>
      <p>
        Visitors in the EEA, UK, and California have rights over their personal
        data, including the right to access, correct, or delete it, and to opt
        out of the sale or sharing of personal information for personalized ads.
        Where required, we request consent for advertising cookies through a
        consent banner before personalized ads are served. To exercise your
        rights, contact us via our{" "}
        <Link href="/contact">contact page</Link>.
      </p>

      <h2>Children&apos;s privacy</h2>
      <p>
        The Site is not directed at children under 13, and we do not knowingly
        collect personal information from them.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be
        reflected by the &ldquo;last updated&rdquo; date above.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Reach us at{" "}
        <a href={`mailto:privacy@${SITE.domain}`}>privacy@{SITE.domain}</a>.
      </p>
    </article>
  );
}
