import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ServiceCard({
  name, slug, icon, onSelect,
}: { name: string; slug: string; icon?: string | null; onSelect?: () => void }) {
  const Icon: LucideIcon = (icon && (Icons as unknown as Record<string, LucideIcon>)[icon]) || Icons.Settings2;
  return (
    <div className="wc-clickable border border-wc-line rounded px-3.5 py-2.5 bg-wc-panel whitespace-nowrap flex items-center gap-2.5">
      <Icon size={15} className="text-wc-textSoft" />
      <Link href={`/services/${slug}`} className="font-body text-[13.5px] text-wc-text no-underline hover:text-wc-cyan">
        {name}
      </Link>
      {onSelect && (
        <button onClick={onSelect} aria-label={`Select ${name} for a procurement request`}
          className="font-mono text-[10.5px] text-wc-textMute border border-wc-lineStrong rounded-full px-1.5 hover:border-wc-cyan hover:text-wc-cyan">
          +
        </button>
      )}
    </div>
  );
}
