import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { getBrandBySlug, getPublishedBrands, getSiteSettings, getPublishedCategories } from "@/lib/queries";
import { buildMetadata, brandJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { ArrowUpRight } from "lucide-react";

/**
 * SEO landing page for a single brand (§13/§17/§20). Real, crawlable HTML —
 * not dependent on the homepage carousel — with genuine answers to the
 * procurement questions a visitor or search engine would actually have
 * (§31 content strategy: "can Wisscano source X in bulk?" etc).
 */

export async function generateStaticParams() {
  const brands = await getPublishedBrands();
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return {};
  return buildMetadata({
    title: brand.seoTitle || `${brand.name} Procurement — Sourced by Wisscano`,
    description: brand.seoDescription || brand.description || `Wisscano can source ${brand.name} technology and equipment internationally, available for procurement on request.`,
    path: `/brands/${brand.slug}`,
  });
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [brand, settings, categories] = await Promise.all([getBrandBySlug(slug), getSiteSettings(), getPublishedCategories()]);
  if (!brand) notFound();

  const relatedCategories = categories.filter((c) => (brand.categoryIds ?? []).includes(c.id)).slice(0, 4);
  const ld = brandJsonLd(brand);
  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Brands", path: "/#brands" },
    { name: brand.name, path: `/brands/${brand.slug}` },
  ]);

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <Nav />
      <nav aria-label="Breadcrumb" className="max-w-[1180px] mx-auto px-6 pt-8 font-mono text-xs text-wc-textMute">
        <Link href="/" className="hover:text-wc-cyan">Home</Link> / <Link href="/#brands" className="hover:text-wc-cyan">Brands</Link> / <span className="text-wc-textSoft">{brand.name}</span>
      </nav>

      <main className="max-w-[1180px] mx-auto px-6 py-10">
        <p className="font-mono text-xs text-wc-textMute">Brand we source</p>
        <h1 className="font-display font-extrabold text-4xl mt-3">{brand.name}</h1>
        <p className="font-body text-[16px] text-wc-textSoft mt-4 max-w-[640px] leading-relaxed">
          {brand.description || `Wisscano can source ${brand.name} technology and equipment on request. As a procurement agency rather than a retailer, availability is subject to supplier stock and lead time — request a quotation and our sourcing team will confirm.`}
        </p>

        <div className="mt-8 flex gap-3 flex-wrap">
          <Link href={`/#request`}><Button>Request {brand.name} Procurement <ArrowUpRight size={16} /></Button></Link>
          {brand.websiteUrl && (
            <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer nofollow">
              <Button variant="ghost">Visit {brand.name} <ArrowUpRight size={16} /></Button>
            </a>
          )}
        </div>

        {relatedCategories.length > 0 && (
          <div className="mt-12">
            <h2 className="font-mono text-xs text-wc-textMute">Related sourcing categories</h2>
            <ul className="flex flex-wrap gap-2.5 mt-3 p-0 list-none">
              {relatedCategories.map((c) => (
                <li key={c.id}>
                  <Link href={`/procurement/${c.slug}`} className="border border-wc-line rounded px-3 py-1.5 font-body text-[13px] text-wc-text no-underline hover:border-wc-blue">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-12 border-t border-wc-line pt-8">
          <h2 className="font-display font-bold text-lg">Can Wisscano source {brand.name} in bulk?</h2>
          <p className="font-body text-[14.5px] text-wc-textSoft mt-2.5 max-w-[640px] leading-relaxed">
            Yes. Wisscano handles single purchases, bulk procurement, project-based rollouts and recurring
            supply agreements. Submit a procurement request with your quantity and timeline and our team
            will confirm sourcing options and lead time.
          </p>
        </div>
      </main>

      <Footer whatsappNumber={settings?.whatsappNumber || "254119834490"} companyName={settings?.companyName || "Wisscano Technologies"} />
    </div>
  );
}
