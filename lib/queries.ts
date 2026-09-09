import { db } from "@/db";
import { brands, procurementCategories, services, showcaseItems, carouselConfigs, siteSettings } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

/**
 * PUBLIC READ QUERIES — every homepage/SEO-page data need funnels through
 * here. Server Components call these directly (no API round-trip); the
 * `getFallback*` seed constants below exist only so the app renders sanely
 * against an empty database before `db:seed` has been run.
 */

export async function getSiteSettings() {
  const [settings] = await db.select().from(siteSettings).limit(1);
  return settings ?? null;
}

export async function getPublishedBrands() {
  return db.select().from(brands).where(eq(brands.state, "published")).orderBy(asc(brands.displayOrder));
}

/** Brands joined with their logo media row — what the homepage carousel actually needs. */
export async function getPublishedBrandsForHomepage() {
  const { media } = await import("@/db/schema");
  const rows = await db
    .select({
      id: brands.id, name: brands.name, slug: brands.slug,
      logoUrl: media.url, altText: brands.altText,
    })
    .from(brands)
    .leftJoin(media, eq(brands.logoMediaId, media.id))
    .where(eq(brands.state, "published"))
    .orderBy(asc(brands.displayOrder));
  return rows;
}

export async function getBrandBySlug(slug: string) {
  const [row] = await db.select().from(brands).where(eq(brands.slug, slug)).limit(1);
  return row ?? null;
}

export async function getPublishedCategories() {
  return db.select().from(procurementCategories).where(eq(procurementCategories.state, "published")).orderBy(asc(procurementCategories.displayOrder));
}

export async function getPublishedCategoriesForHomepage() {
  return db
    .select({
      id: procurementCategories.id, name: procurementCategories.name, slug: procurementCategories.slug,
      icon: procurementCategories.icon, blurb: procurementCategories.shortBlurb,
    })
    .from(procurementCategories)
    .where(eq(procurementCategories.state, "published"))
    .orderBy(asc(procurementCategories.displayOrder));
}

/** Grouped by technology domain for the /procurement index page (internal linking, §7/§10). */
export async function getPublishedCategoriesGrouped() {
  const rows = await db
    .select({
      id: procurementCategories.id, name: procurementCategories.name, slug: procurementCategories.slug,
      group: procurementCategories.group, shortBlurb: procurementCategories.shortBlurb,
    })
    .from(procurementCategories)
    .where(eq(procurementCategories.state, "published"))
    .orderBy(asc(procurementCategories.displayOrder));

  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.group ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return Array.from(groups.entries()).map(([group, items]) => ({ group, items }));
}

export async function getCategoryBySlug(slug: string) {
  const [row] = await db.select().from(procurementCategories).where(eq(procurementCategories.slug, slug)).limit(1);
  return row ?? null;
}

export async function getPublishedServices() {
  return db.select().from(services).where(eq(services.state, "published")).orderBy(asc(services.displayOrder));
}

export async function getPublishedServicesForHomepage() {
  return db
    .select({ id: services.id, name: services.name, slug: services.slug, icon: services.icon })
    .from(services)
    .where(eq(services.state, "published"))
    .orderBy(asc(services.displayOrder));
}

export async function getServiceBySlug(slug: string) {
  const [row] = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
  return row ?? null;
}

export async function getPublishedShowcaseItems() {
  return db.select().from(showcaseItems).where(eq(showcaseItems.state, "published")).orderBy(asc(showcaseItems.displayOrder));
}

/**
 * Showcase items with their resolved desktop image + full SEO/alt metadata.
 * Every "environment canvas" image is enriched at the DB level (§18 image
 * SEO: meaningful filename, alt text, contextual description, semantic
 * tags) — this query is what surfaces that enrichment to the page.
 */
export async function getPublishedShowcaseItemsWithMedia() {
  const { media } = await import("@/db/schema");
  return db
    .select({
      id: showcaseItems.id,
      title: showcaseItems.title,
      subtitle: showcaseItems.subtitle,
      description: showcaseItems.description,
      altText: showcaseItems.altText,
      category: showcaseItems.category,
      semanticTags: showcaseItems.semanticTags,
      imageUrl: media.url,
    })
    .from(showcaseItems)
    .leftJoin(media, eq(showcaseItems.desktopImageMediaId, media.id))
    .where(eq(showcaseItems.state, "published"))
    .orderBy(asc(showcaseItems.displayOrder));
}

export async function getCarouselConfig(type: "brands" | "what_we_source" | "services") {
  const [row] = await db.select().from(carouselConfigs).where(eq(carouselConfigs.type, type)).limit(1);
  return row ?? { type, direction: "left" as const, speedPxPerSec: 30, active: true, pauseOnHover: true };
}

/**
 * Active, in-schedule highlights for the homepage strip (§11-14 of the
 * enhancement brief). "In-schedule" means: no startDate or it's already
 * passed, AND no endDate or it hasn't passed yet. Ordered by priority
 * (admin-settable) then displayOrder.
 */
export async function getActiveHighlights() {
  const { highlights, media } = await import("@/db/schema");
  const { desc } = await import("drizzle-orm");
  const now = new Date();

  const rows = await db
    .select({
      id: highlights.id, type: highlights.type, title: highlights.title,
      shortDescription: highlights.shortDescription, ctaLabel: highlights.ctaLabel,
      ctaUrl: highlights.ctaUrl, isExternal: highlights.isExternal, openInNewTab: highlights.openInNewTab,
      startDate: highlights.startDate, endDate: highlights.endDate, priority: highlights.priority,
      displayOrder: highlights.displayOrder, imageUrl: media.url,
    })
    .from(highlights)
    .leftJoin(media, eq(highlights.imageMediaId, media.id))
    .where(eq(highlights.active, true))
    .orderBy(desc(highlights.priority), asc(highlights.displayOrder));

  return rows.filter((h) => (!h.startDate || h.startDate <= now) && (!h.endDate || h.endDate >= now));
}
