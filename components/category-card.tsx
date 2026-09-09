import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function CategoryCard({
  name, slug, icon, blurb, onSelect,
}: { name: string; slug: string; icon?: string | null; blurb?: string | null; onSelect?: () => void }) {
  const Icon: LucideIcon = (icon && (Icons as unknown as Record<string, LucideIcon>)[icon]) || Icons.Boxes;
  return (
    <div className="wc-clickable border border-wc-line rounded-md p-4.5 bg-wc-panel w-[200px] flex flex-col">
      <Icon size={22} className="text-wc-cyan" strokeWidth={1.5} />
      <Link href={`/procurement/${slug}`} className="font-body font-semibold text-sm mt-3 text-wc-text no-underline hover:text-wc-cyan">
        {name}
      </Link>
      {blurb && <div className="font-body text-xs text-wc-textMute mt-1">{blurb}</div>}
      {onSelect && (
        <button
          onClick={onSelect}
          className="mt-3 self-start font-mono text-[11px] text-wc-textMute border border-wc-lineStrong rounded px-2 py-1 hover:border-wc-cyan hover:text-wc-cyan"
        >
          + Select for request
        </button>
      )}
    </div>
  );
}
