import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://wisscano.co.ke";
const SITE_NAME = "Wisscano Technologies";

/**
 * SEO helpers (§13/§17-20 of master spec). Every dynamic landing page
 * (brand/category/service) builds its <head> metadata and JSON-LD through
 * these — no page hand-rolls its own <title>/OG tags, so canonical URLs
 * and defaults stay consistent site-wide.
 */

export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string; // e.g. "/brands/cisco"
  imageUrl?: string | null;
  type?: "website" | "article";
}): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  return {
    title: `${opts.title} | ${SITE_NAME}`,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      type: opts.type ?? "website",
      images: opts.imageUrl ? [{ url: opts.imageUrl }] : undefined,
    },
    twitter: {
      card: opts.imageUrl ? "summary_large_image" : "summary",
      title: opts.title,
      description: opts.description,
      images: opts.imageUrl ? [opts.imageUrl] : undefined,
    },
  };
}

export function organizationJsonLd(settings: { companyName: string; contactEmail: string; whatsappNumber: string; address?: string | null; acronymExpansion?: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.companyName,
    url: SITE_URL,
    email: settings.contactEmail,
    address: settings.address || undefined,
    description:
      `${settings.companyName}${settings.acronymExpansion ? ` (${settings.acronymExpansion})` : ""} is a technology procurement and solutions company sourcing ICT, IoT, systems, software, cloud, AI and network technology for individuals, businesses and institutions across Kenya, East Africa and beyond.`,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/** Brand entity structured data for /brands/[slug]. */
export function brandJsonLd(brand: { name: string; slug: string; description?: string | null; websiteUrl?: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brand.name,
    description: brand.description || `Wisscano can source ${brand.name} technology on request.`,
    url: brand.websiteUrl || `${SITE_URL}/brands/${brand.slug}`,
  };
}

/** Service entity structured data for /services/[slug]. */
export function serviceJsonLd(service: { name: string; slug: string; description?: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.name,
    name: service.name,
    description: service.description || `${service.name} provided by Wisscano Technologies.`,
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    areaServed: "International",
    url: `${SITE_URL}/services/${service.slug}`,
  };
}

/**
 * ItemList structured data for a carousel section — gives search engines
 * an explicit, crawlable inventory of what a section contains, independent
 * of the animated marquee markup (§17 "strong internal linking").
 */
export function itemListJsonLd(name: string, items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: `${SITE_URL}${item.url}`,
    })),
  };
}

/** FAQPage structured data — only ever used where the content genuinely is Q&A (§17: "only where genuinely appropriate"). */
export function faqJsonLd(qa: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export { SITE_URL, SITE_NAME };
