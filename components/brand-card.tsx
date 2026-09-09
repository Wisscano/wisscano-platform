import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";

/**
 * Every brand card carries a REAL <Link> to its /brands/[slug] landing
 * page (§13/§20: crawlable HTML, not JS-only carousel content) alongside
 * a separate "select" affordance that populates the Request Bar without
 * navigating — the two interactions are deliberately different controls
 * so neither compromises the other (a link that intercepts its own
 * navigation is an accessibility anti-pattern).
 */
export function BrandCard({
  name, slug, logoUrl, altText, onSelect,
}: { name: string; slug: string; logoUrl?: string | null; altText?: string | null; onSelect?: () => void }) {
  return (
    <div className="wc-clickable border border-wc-line rounded px-3 py-2 bg-wc-panel whitespace-nowrap flex items-center gap-2.5 group">
      {logoUrl ? (
        <Image src={logoUrl} alt={altText ?? `${name} logo`} width={20} height={20} className="object-contain" />
      ) : null}
      <Link href={`/brands/${slug}`} className="font-mono text-[13px] text-wc-metal tracking-wide no-underline hover:text-wc-cyan">
        {name}
      </Link>
      {onSelect && (
        <button
          onClick={onSelect}
          aria-label={`Select ${name} for a procurement request`}
          className="ml-1 flex items-center justify-center w-5 h-5 rounded-full border border-wc-lineStrong text-wc-textMute hover:border-wc-cyan hover:text-wc-cyan"
        >
          <Plus size={11} />
        </button>
      )}
    </div>
  );
}
