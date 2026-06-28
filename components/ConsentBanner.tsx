"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "wu-consent-v1";

/**
 * Lightweight cookie/ads consent notice. For EU/EEA & UK traffic (tier-1
 * targets), Google requires a CMP for personalized ads — swap this for a
 * certified CMP (e.g. Google's consent management) before going live there.
 * This component covers the baseline notice + dismiss behaviour.
 */
export default function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage blocked — skip the banner rather than break the page */
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="consent" role="dialog" aria-label="Cookie notice">
      <p>
        We use cookies and third-party advertising (Google AdSense) to keep this
        tool free. See our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
      <button type="button" onClick={dismiss} className="btn btn-sm">
        Got it
      </button>
    </div>
  );
}
