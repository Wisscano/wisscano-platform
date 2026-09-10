import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { RoutingDiagram } from "@/components/routing-diagram";
import { ShowcasePanel } from "@/components/showcase-panel";
import { HomeInteractive } from "@/components/home-interactive";
import { HighlightsStrip } from "@/components/highlights-strip";
import { Button } from "@/components/ui/button";
import {
  getSiteSettings, getPublishedBrandsForHomepage, getPublishedCategoriesForHomepage,
  getPublishedServicesForHomepage, getPublishedShowcaseItemsWithMedia, getCarouselConfig,
  getActiveHighlights,
} from "@/lib/queries";
import { itemListJsonLd } from "@/lib/seo";
import { ArrowUpRight, Globe2, MapPin, Building2, ClipboardList, Compass } from "lucide-react";

export default async function HomePage() {
  const [settings, brands, categories, services, showcase, brandsCfg, sourceCfg, servicesCfg, highlights] = await Promise.all([
    getSiteSettings(),
    getPublishedBrandsForHomepage(),
    getPublishedCategoriesForHomepage(),
    getPublishedServicesForHomepage(),
    getPublishedShowcaseItemsWithMedia(),
    getCarouselConfig("brands"),
    getCarouselConfig("what_we_source"),
    getCarouselConfig("services"),
    getActiveHighlights(),
  ]);

  const heroHeadline = settings?.heroHeadline || "SOURCE. PROCURE. DEPLOY.";
  const heroSub = settings?.heroSubheadline || "Technology procurement and digital solutions without borders.";
  const whatsapp = settings?.whatsappNumber || "254119834490";
  const companyName = settings?.companyName || "Wisscano Technologies";

  // Crawlable ItemList structured data — independent of the animated marquee markup (§17/§20).
  const brandsLd = itemListJsonLd("Brands Wisscano can source", brands.map((b) => ({ name: b.name, url: `/brands/${b.slug}` })));
  const categoriesLd = itemListJsonLd("Technology Wisscano can source", categories.map((c) => ({ name: c.name, url: `/procurement/${c.slug}` })));
  const servicesLd = itemListJsonLd("Wisscano services", services.map((s) => ({ name: s.name, url: `/services/${s.slug}` })));

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandsLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoriesLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesLd) }} />

      <Nav />
      <HighlightsStrip items={highlights.map((h) => ({
        id: h.id, type: h.type, title: h.title, shortDescription: h.shortDescription,
        ctaLabel: h.ctaLabel, ctaUrl: h.ctaUrl, isExternal: h.isExternal, openInNewTab: h.openInNewTab,
      }))} />

      {/* HERO */}
      <div className="max-w-[1180px] mx-auto px-6 pt-16 pb-10">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <p className="font-mono text-xs text-wc-textMute">International ICT procurement &amp; technology solutions</p>
            <h1 className="font-display font-extrabold leading-none tracking-tight mt-4" style={{ fontSize: "clamp(34px, 5vw, 54px)" }}>
              {heroHeadline}
            </h1>
            <p className="font-body text-[17px] text-wc-textSoft mt-4.5 max-w-[460px] leading-relaxed">
              {heroSub} Tell us what you need — we handle the sourcing, across any brand, category or geography.
            </p>
            <div className="flex gap-3.5 mt-7 flex-wrap">
              <a href="#request"><Button>Start a Procurement Request <ArrowUpRight size={16} /></Button></a>
              <a href="#what-we-source"><Button variant="ghost">Explore What We Source</Button></a>
            </div>
          </div>
          <div className="flex justify-center">
            <RoutingDiagram brandLabels={brands.slice(0, 4).map((b) => b.name)} />
          </div>
        </div>
      </div>

      {/* Shared client interactivity: Request Bar + all 3 carousels */}
      <div className="max-w-[1180px] mx-auto px-6">
        <HomeInteractive
          brands={brands} categories={categories} services={services}
          brandsCfg={brandsCfg} sourceCfg={sourceCfg} servicesCfg={servicesCfg}
        />
      </div>

      {/* ICT SHOWCASE — environment canvas imagery, enriched with real alt text + captions per item (§18) */}
      <section aria-labelledby="showcase-heading" className="max-w-[1180px] mx-auto px-6 py-14">
        <h2 id="showcase-heading" className="font-mono text-xs text-wc-textMute">
          Technology environments Wisscano works across
        </h2>
        <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {showcase.map((item, i) => (
            <figure key={item.id} className="m-0">
              <ShowcasePanel title={item.title} subtitle={item.subtitle} imageUrl={item.imageUrl} altText={item.altText} index={i} />
              {item.description && <figcaption className="sr-only">{item.description}</figcaption>}
            </figure>
          ))}
        </div>
      </section>

      {/* HOW PROCUREMENT WORKS */}
      <section aria-labelledby="how-heading" className="max-w-[1180px] mx-auto px-6 py-14 border-t border-wc-line">
        <h2 id="how-heading" className="font-mono text-xs text-wc-textMute">How procurement works</h2>
        <ol className="grid mt-5 border border-wc-line rounded-md overflow-hidden list-none p-0" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {["Tell us what you need", "We source", "We compare", "We quote", "You approve", "We procure & deliver"].map((step, i) => (
            <li key={step} className={`p-5.5 ${i < 5 ? "border-r border-wc-line" : ""} ${i % 2 === 0 ? "bg-wc-panel" : "bg-wc-panelAlt"}`}>
              <span className="font-mono text-xs text-wc-cyan">{String(i + 1).padStart(2, "0")}</span>
              <div className="font-body font-medium text-sm mt-2 leading-snug">{step}</div>
            </li>
          ))}
        </ol>
      </section>

      {/* ASSISTED PROCUREMENT */}
      <section aria-labelledby="assist-heading" className="max-w-[1180px] mx-auto px-6 py-14 border-t border-wc-line">
        <h2 id="assist-heading" className="font-mono text-xs text-wc-textMute">Need help?</h2>
        <p className="font-display font-bold text-[28px] mt-3 max-w-[520px]">You don&apos;t need to know the exact product.</p>
        <div className="grid gap-4 mt-7" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <a href="#request" className="wc-clickable border border-wc-line rounded-md p-6 bg-wc-panel block no-underline">
            <ClipboardList size={20} className="text-wc-cyan" />
            <div className="font-display font-bold text-base mt-3 text-wc-text">I know what I need</div>
            <p className="font-body text-[13.5px] text-wc-textSoft mt-2 leading-snug">
              Describe the product, spec or model — or upload a BOM, tender document or spreadsheet directly.
            </p>
          </a>
          <a href="#request" className="wc-clickable border border-wc-line rounded-md p-6 bg-wc-panel block no-underline">
            <Compass size={20} className="text-wc-cyan" />
            <div className="font-display font-bold text-base mt-3 text-wc-text">I don&apos;t know what I need</div>
            <p className="font-body text-[13.5px] text-wc-textSoft mt-2 leading-snug">
              Tell us what you&apos;re trying to achieve. Our team will translate that into the right technology.
            </p>
          </a>
        </div>
      </section>

      {/* GLOBAL PROCUREMENT */}
      <section aria-labelledby="global-heading" className="max-w-[1180px] mx-auto px-6 py-14 border-t border-wc-line">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 id="global-heading" className="font-mono text-xs text-wc-textMute">Kenya. East Africa. Africa. Beyond.</h2>
            <p className="font-display font-bold text-[28px] mt-3">Sourced widely. Delivered locally.</p>
            <p className="font-body text-[14.5px] text-wc-textSoft mt-3.5 leading-relaxed max-w-[440px]">
              {companyName} sources across a broad network of manufacturers and suppliers, with procurement
              operations coordinated from Nairobi, Kenya. The platform is built to extend across East Africa,
              the wider African market and international sourcing as a requirement calls for it — technology
              procurement isn&apos;t limited to one market.
            </p>
          </div>
          <div className="border border-wc-line rounded-md p-6 bg-wc-panel">
            <div className="flex gap-2.5 items-center"><Globe2 size={18} className="text-wc-cyan" /><span className="font-body text-[13.5px] text-wc-textSoft">Coordinated from</span></div>
            <div className="flex gap-2 items-center mt-2.5"><MapPin size={15} className="text-wc-metal" /><span className="font-mono text-sm text-wc-text">Nairobi, Kenya — default market</span></div>
            <div className="h-px bg-wc-line w-full my-3.5" />
            <div className="flex gap-2 items-center"><Building2 size={15} className="text-wc-metal" /><span className="font-body text-[13.5px] text-wc-textSoft">Additional markets and currencies configured on request.</span></div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <div className="border-t border-wc-line bg-wc-panel">
        <div className="max-w-[1180px] mx-auto px-6 py-16">
          <h2 className="font-display font-extrabold max-w-[620px] leading-tight" style={{ fontSize: "clamp(26px, 4vw, 38px)" }}>Have a technology requirement?</h2>
          <p className="font-body text-base text-wc-textSoft mt-3.5">Send us the requirement. We&apos;ll handle the sourcing.</p>
          <div className="mt-6"><a href="#request"><Button>Request Procurement <ArrowUpRight size={16} /></Button></a></div>
        </div>
      </div>

      <Footer whatsappNumber={whatsapp} companyName={companyName} />
    </div>
  );
}