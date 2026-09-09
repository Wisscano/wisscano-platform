"use client";

import { useState, useEffect } from "react";
import { Rocket, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";

export interface HighlightItem {
  id: string;
  type: string;
  title: string;
  shortDescription: string | null;
  ctaLabel: string;
  ctaUrl: string;
  isExternal: boolean;
  openInNewTab: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  wisscano_launch: "Wisscano Launch", new_platform: "New Platform", new_service: "New Service",
  new_technology: "New Technology", procurement_update: "Procurement Update",
  featured_solution: "Featured Solution", company_announcement: "Announcement", general_highlight: "Highlight",
};

const ROTATE_MS = 5200;

/**
 * Slender, auto-rotating announcements strip (§11-14 of the enhancement
 * brief). Data comes entirely from the `highlights` table via
 * getActiveHighlights() — nothing here is hard-coded, including the
 * Forge-style external/subdomain destination handling (isExternal /
 * openInNewTab are admin-set fields, not assumptions the component makes).
 */
export function HighlightsStrip({ items }: { items: HighlightItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, items.length]);

  if (!items.length) return null;
  const item = items[index]!;

  return (
    <div
      className="border-b border-wc-line bg-wc-panelAlt/60 backdrop-blur-sm relative"
      style={{ zIndex: 10 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-[1180px] mx-auto px-6 py-2.5 flex items-center gap-3.5">
        <Rocket size={13} className="text-wc-cyan shrink-0" />
        <div className="flex-1 flex items-baseline gap-2.5 flex-wrap min-w-0">
          <span className="font-mono text-[10.5px] text-wc-cyan tracking-wide shrink-0">{(TYPE_LABELS[item.type] ?? item.type).toUpperCase()}</span>
          <span className="font-display font-bold text-[13px] text-wc-text shrink-0">{item.title}</span>
          {item.shortDescription && (
            <span className="font-body text-[12.5px] text-wc-textSoft overflow-hidden text-ellipsis whitespace-nowrap">{item.shortDescription}</span>
          )}
        </div>
        <a
          href={item.ctaUrl}
          target={item.openInNewTab ? "_blank" : undefined}
          rel={item.openInNewTab ? "noopener noreferrer" : undefined}
          className="font-body text-[12.5px] text-wc-blue font-semibold no-underline whitespace-nowrap shrink-0 flex items-center gap-1"
        >
          {item.ctaLabel} <ArrowUpRight size={12} />
        </a>
        {items.length > 1 && (
          <>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)} aria-label="Previous highlight"
                className="bg-transparent border border-wc-lineStrong rounded text-wc-textSoft w-5 h-5 flex items-center justify-center">
                <ChevronLeft size={12} />
              </button>
              <button onClick={() => setIndex((i) => (i + 1) % items.length)} aria-label="Next highlight"
                className="bg-transparent border border-wc-lineStrong rounded text-wc-textSoft w-5 h-5 flex items-center justify-center">
                <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex gap-1 shrink-0">
              {items.map((_, i) => (
                <button key={i} onClick={() => setIndex(i)} aria-label={`Go to highlight ${i + 1}`}
                  className="w-[5px] h-[5px] rounded-full border-none p-0"
                  style={{ background: i === index ? "#48D8E8" : "rgba(148,163,184,0.28)" }} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
