import Link from "next/link";
import { SITE } from "@/lib/site";

const NAV = [
  { href: "/", label: "Unscrambler" },
  { href: "/scrabble-word-finder", label: "Scrabble" },
  { href: "/words-with-friends", label: "Words With Friends" },
  { href: "/about", label: "About" },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label={`${SITE.name} home`}>
          <span className="brand-mark">W</span>
          <span className="brand-name">{SITE.name}</span>
        </Link>
        <nav aria-label="Primary">
          <ul className="nav">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
