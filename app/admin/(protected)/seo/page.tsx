import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { brands, procurementCategories, services, siteSettings, media } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * SEO health check + site-wide defaults overview. Per-item SEO title,
 * description, alt text and semantic tags are edited directly on each
 * Brand / What We Source / Service / Showcase record — this page reports
 * gaps and links straight to the offending item's edit form.
 */
export default async function AdminSeoPage() {
  await requireAdmin();
  const [b, c, s, [settings]] = await Promise.all([
    db.select({ id: brands.id, name: brands.name, seoTitle: brands.seoTitle, seoDescription: brands.seoDescription }).from(brands),
    db.select({ id: procurementCategories.id, name: procurementCategories.name, seoTitle: procurementCategories.seoTitle, seoDescription: procurementCategories.seoDescription }).from(procurementCategories),
    db.select({ id: services.id, name: services.name, seoTitle: services.seoTitle, seoDescription: services.seoDescription }).from(services),
    db.select().from(siteSettings).limit(1),
  ]);

  let ogImageUrl: string | null = null;
  if (settings?.ogImageMediaId) {
    const [row] = await db.select({ url: media.url }).from(media).where(eq(media.id, settings.ogImageMediaId)).limit(1);
    ogImageUrl = row?.url ?? null;
  }

  const flag = (row: { seoTitle: string | null; seoDescription: string | null }) => !row.seoTitle || !row.seoDescription;
  const missing = (row: { seoTitle: string | null; seoDescription: string | null }) =>
    [!row.seoTitle && "SEO title", !row.seoDescription && "SEO description"].filter(Boolean).join(", ");

  const gaps = [
    ...b.filter(flag).map((r) => ({ ...r, type: "Brand", editHref: `/admin/brands/${r.id}` })),
    ...c.filter(flag).map((r) => ({ ...r, type: "Category", editHref: `/admin/what-we-source/${r.id}` })),
    ...s.filter(flag).map((r) => ({ ...r, type: "Service", editHref: `/admin/services/${r.id}` })),
  ];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl">SEO</h1>
      <p className="font-body text-[13.5px] text-wc-textSoft mt-1.5 max-w-[560px]">
        Per-item SEO title, description, alt text and semantic tags are edited directly on each Brand / What We
        Source / Service / Showcase record — open any item to set them. Sitemap and robots.txt are generated
        automatically from published content.
      </p>

      <h2 className="font-mono text-xs text-wc-textMute mt-8 mb-3">SITE-WIDE DEFAULTS</h2>
      <div className="border border-wc-line rounded-md p-5 max-w-[560px]">
        <SeoRow label="Default SEO title" value={settings?.seoDefaultTitle} />
        <SeoRow label="Default SEO description" value={settings?.seoDefaultDescription} />
        <SeoRow label="Default social share image" value={ogImageUrl ? "Set" : "Not set"} />
        <SeoRow label="Sitemap" value="/sitemap.xml — generated automatically" />
        <SeoRow label="Robots" value="/robots.txt — generated automatically" />
        <Link href="/admin/site-settings" className="inline-block mt-3 font-body text-[13px] text-wc-cyan no-underline">
          Edit in Site Settings →
        </Link>
      </div>

      <h2 className="font-mono text-xs text-wc-textMute mt-8 mb-3">Missing SEO metadata ({gaps.length})</h2>
      {gaps.length === 0 ? (
        <p className="font-body text-[13.5px] text-wc-textMute">Everything published has SEO title and description set.</p>
      ) : (
        <ul className="list-none p-0 m-0 space-y-1.5">
          {gaps.map((g) => (
            <li key={`${g.type}-${g.id}`} className="font-body text-[13.5px]">
              <span className="font-mono text-xs text-wc-textMute mr-2">{g.type}</span>
              <Link href={g.editHref} className="text-wc-text no-underline hover:text-wc-cyan">{g.name}</Link>
              <span className="text-yellow-400 text-xs ml-2">missing {missing(g)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SeoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 font-body text-[13px]">
      <span className="text-wc-textMute shrink-0">{label}</span>
      <span className="text-wc-text text-right">{value || <span className="text-wc-textMute">Not set</span>}</span>
    </div>
  );
}
