import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Footer() {
  const year = 2026;
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-col">
          <span className="brand-name">{SITE.name}</span>
          <p className="muted">
            Free word unscrambler &amp; finder for Scrabble, Words With Friends,
            and Wordle. Not affiliated with or endorsed by Hasbro, Mattel, Zynga,
            or the New York Times.
          </p>
        </div>
        <nav className="footer-col" aria-label="Footer">
          <strong>Tools</strong>
          <Link href="/">Word Unscrambler</Link>
          <Link href="/scrabble-word-finder">Scrabble Word Finder</Link>
          <Link href="/words-with-friends">Words With Friends Cheat</Link>
        </nav>
        <nav className="footer-col" aria-label="Company">
          <strong>Site</strong>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Use</Link>
        </nav>
      </div>
      <div className="container footer-legal">
        <p className="muted">© {year} {SITE.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
