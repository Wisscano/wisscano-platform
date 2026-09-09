import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { getCategoryBySlug, getPublishedCategories, getSiteSettings, getPublishedBrands, getPublishedCategoriesGrouped } from "@/lib/queries";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { ArrowUpRight } from "lucide-react";

export async function generateStaticParams() {
  const categories = await getPublishedCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return buildMetadata({
    title: category.seoTitle || `${category.name} Procurement`,
    description: category.seoDescription || category.description || `Wisscano can source ${category.name} on request — request a quotation for your project.`,
    path: `/procurement/${category.slug}`,
  });
}

export default async function ProcurementCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, settings, brands, groupedCategories] = await Promise.all([
    getCategoryBySlug(slug), getSiteSettings(), getPublishedBrands(), getPublishedCategoriesGrouped(),
  ]);
  if (!category) notFound();

  const siblingItems = groupedCategories.find((g) => g.group === category.group)?.items.filter((i) => i.id !== category.id) ?? [];
  const relatedBrands = brands.filter((b) => (category.relatedBrandIds ?? []).includes(b.id)).slice(0, 6);
  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "What We Source", path: "/procurement" },
    { name: category.name, path: `/procurement/${category.slug}` },
  ]);
  const faq = faqJsonLd([
    { question: `Can Wisscano source ${category.name.toLowerCase()} in bulk?`, answer: "Yes — Wisscano supports single purchases, bulk procurement, project rollouts and recurring supply." },
    { question: "Can Wisscano work from a specification document or BOM?", answer: "Yes — upload a bill of materials, tender document or spec sheet directly in the procurement request, and our team will source against it." },
    { question: "What if I don't know the exact specification?", answer: "Choose \"I don't know what I need\" in the procurement request — describe the outcome you want and our team will determine the right specification." },
  ]);

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <Nav />
      <nav aria-label="Breadcrumb" className="max-w-[1180px] mx-auto px-6 pt-8 font-mono text-xs text-wc-textMute">
        <Link href="/" className="hover:text-wc-cyan">Home</Link> / <Link href="/procurement" className="hover:text-wc-cyan">What We Source</Link> / <span className="text-wc-textSoft">{category.name}</span>
      </nav>

      <main className="max-w-[1180px] mx-auto px-6 py-10">
        <p className="font-mono text-xs text-wc-textMute">Sourcing category</p>
        <h1 className="font-display font-extrabold text-4xl mt-3">{category.name}</h1>
        <p className="font-body text-[16px] text-wc-textSoft mt-4 max-w-[640px] leading-relaxed">
          {category.description || `Wisscano can source ${category.name.toLowerCase()} from a broad ecosystem of manufacturers and suppliers.`}
        </p>
        {category.procurementInformation && (
          <p className="font-body text-[14.5px] text-wc-textSoft mt-4 max-w-[640px] leading-relaxed">{category.procurementInformation}</p>
        )}

        <div className="mt-8"><Link href="/#request"><Button>Request {category.name} <ArrowUpRight size={16} /></Button></Link></div>

        {siblingItems.length > 0 && (
          <div className="mt-12">
            <h2 className="font-mono text-xs text-wc-textMute">More in {category.group}</h2>
            <ul className="flex flex-wrap gap-2.5 mt-3 p-0 list-none">
              {siblingItems.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <Link href={`/procurement/${item.slug}`} className="border border-wc-line rounded px-3 py-1.5 font-body text-[13px] text-wc-text no-underline hover:border-wc-blue block">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {relatedBrands.length > 0 && (
          <div className="mt-12">
            <h2 className="font-mono text-xs text-wc-textMute">Brands available in this category</h2>
            <ul className="flex flex-wrap gap-2.5 mt-3 p-0 list-none">
              {relatedBrands.map((b) => (
                <li key={b.id}>
                  <Link href={`/brands/${b.slug}`} className="border border-wc-line rounded px-3 py-1.5 font-mono text-[13px] text-wc-metal no-underline hover:border-wc-blue">
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-12 border-t border-wc-line pt-8 space-y-6">
          <div>
            <h2 className="font-display font-bold text-lg">Can Wisscano source {category.name.toLowerCase()} in bulk?</h2>
            <p className="font-body text-[14.5px] text-wc-textSoft mt-2 max-w-[640px] leading-relaxed">Yes — Wisscano supports single purchases, bulk procurement, project rollouts and recurring supply.</p>
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Can Wisscano work from a specification document or BOM?</h2>
            <p className="font-body text-[14.5px] text-wc-textSoft mt-2 max-w-[640px] leading-relaxed">Yes — upload a bill of materials, tender document or spec sheet directly in the procurement request.</p>
          </div>
        </div>
      </main>

      <Footer whatsappNumber={settings?.whatsappNumber || "254119834490"} companyName={settings?.companyName || "Wisscano Technologies"} />
    </div>
  );
}
