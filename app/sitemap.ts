import type { MetadataRoute } from "next";
import { getPublishedBrands, getPublishedCategories, getPublishedServices } from "@/lib/queries";
import { SITE_URL } from "@/lib/seo";

/** Fully dynamic sitemap — every published brand/category/service gets an entry automatically. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [brands, categories, services] = await Promise.all([
    getPublishedBrands(), getPublishedCategories(), getPublishedServices(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/procurement`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const brandEntries: MetadataRoute.Sitemap = brands.map((b) => ({
    url: `${SITE_URL}/brands/${b.slug}`, lastModified: b.updatedAt, changeFrequency: "monthly", priority: 0.7,
  }));
  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/procurement/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "monthly", priority: 0.8,
  }));
  const serviceEntries: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${SITE_URL}/services/${s.slug}`, lastModified: s.updatedAt, changeFrequency: "monthly", priority: 0.7,
  }));

  return [...staticEntries, ...brandEntries, ...categoryEntries, ...serviceEntries];
}
