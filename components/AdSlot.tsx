"use client";

import { useEffect, useRef } from "react";
import { SITE } from "@/lib/site";

type AdFormat = "auto" | "horizontal" | "rectangle" | "vertical";

interface AdSlotProps {
  /** AdSense ad unit slot id (data-ad-slot). */
  slot?: string;
  format?: AdFormat;
  /** Label shown above the unit (AdSense policy-friendly + good UX). */
  label?: string;
  className?: string;
  /** Min height reserves layout space to avoid CLS while the ad loads. */
  minHeight?: number;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Renders a Google AdSense unit when NEXT_PUBLIC_ADSENSE_CLIENT is configured.
 * Until then it shows a clearly-labelled placeholder so you can see and tune
 * ad positions during development without violating AdSense policy.
 */
export default function AdSlot({
  slot,
  format = "auto",
  label = "Advertisement",
  className,
  minHeight = 100,
}: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null);
  const client = SITE.adsenseClient;

  useEffect(() => {
    if (!client || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* AdSense not ready yet — it will retry on the next render. */
    }
  }, [client, slot]);

  if (!client || !slot) {
    return (
      <div
        className={`ad-slot ad-placeholder ${className ?? ""}`}
        style={{ minHeight }}
        aria-hidden="true"
      >
        <span>Ad space ({format})</span>
      </div>
    );
  }

  return (
    <div className={`ad-slot ${className ?? ""}`} style={{ minHeight }}>
      <span className="ad-label">{label}</span>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
