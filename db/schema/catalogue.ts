import { pgTable, uuid, varchar, text, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { timestamps } from "./core";
import { publishStateEnum } from "./enums";
import { media } from "./core";

/**
 * These three tables back the three homepage carousels (Brands We Source /
 * What We Source / Our Services) AND the SEO landing pages at
 * /brands/[slug], /procurement/[slug], /services/[slug]. They are NOT a
 * product catalogue — there is deliberately no price, stock or SKU column.
 * See §41–§42 of the master spec: these represent sourcing CAPABILITY.
 */

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  logoMediaId: uuid("logo_media_id").references(() => media.id),
  description: text("description"),
  websiteUrl: text("website_url"),
  categoryIds: jsonb("category_ids").$type<string[]>().default([]), // FK to procurement_categories.id, loosely typed for simple many-to-many without join table overhead
  altText: varchar("alt_text", { length: 300 }),
  seoTitle: varchar("seo_title", { length: 200 }),
  seoDescription: text("seo_description"),
  semanticTags: jsonb("semantic_tags").$type<string[]>().default([]),
  displayOrder: integer("display_order").notNull().default(0),
  state: publishStateEnum("state").notNull().default("published"),
  ...timestamps,
});

export const procurementCategories = pgTable("procurement_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  group: varchar("group", { length: 100 }), // domain grouping e.g. "Networking", "Security & Surveillance" — for /procurement index + internal linking (§7/§10)
  icon: varchar("icon", { length: 60 }), // lucide-react icon name, resolved client-side
  imageMediaId: uuid("image_media_id").references(() => media.id),
  shortBlurb: varchar("short_blurb", { length: 200 }),
  description: text("description"),
  procurementInformation: text("procurement_information"), // "Can Wisscano source X in bulk?" style content, §31
  relatedBrandIds: jsonb("related_brand_ids").$type<string[]>().default([]),
  altText: varchar("alt_text", { length: 300 }),
  seoTitle: varchar("seo_title", { length: 200 }),
  seoDescription: text("seo_description"),
  semanticTags: jsonb("semantic_tags").$type<string[]>().default([]),
  displayOrder: integer("display_order").notNull().default(0),
  state: publishStateEnum("state").notNull().default("published"),
  ...timestamps,
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  icon: varchar("icon", { length: 60 }),
  imageMediaId: uuid("image_media_id").references(() => media.id),
  shortBlurb: varchar("short_blurb", { length: 200 }),
  description: text("description"),
  detailedContent: text("detailed_content"),
  relatedCategoryIds: jsonb("related_category_ids").$type<string[]>().default([]),
  altText: varchar("alt_text", { length: 300 }),
  seoTitle: varchar("seo_title", { length: 200 }),
  seoDescription: text("seo_description"),
  semanticTags: jsonb("semantic_tags").$type<string[]>().default([]),
  displayOrder: integer("display_order").notNull().default(0),
  state: publishStateEnum("state").notNull().default("published"),
  ...timestamps,
});

/**
 * ICT VISUAL SHOWCASE — storytelling imagery, deliberately separate from
 * the three carousels (§9 of the master spec).
 */
export const showcaseItems = pgTable("showcase_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  subtitle: varchar("subtitle", { length: 300 }),
  description: text("description"),
  desktopImageMediaId: uuid("desktop_image_media_id").references(() => media.id),
  mobileImageMediaId: uuid("mobile_image_media_id").references(() => media.id),
  ctaLabel: varchar("cta_label", { length: 80 }),
  ctaUrl: text("cta_url"),
  category: varchar("category", { length: 120 }),
  altText: varchar("alt_text", { length: 300 }),
  seoTitle: varchar("seo_title", { length: 200 }),
  seoDescription: text("seo_description"),
  semanticTags: jsonb("semantic_tags").$type<string[]>().default([]),
  displayOrder: integer("display_order").notNull().default(0),
  state: publishStateEnum("state").notNull().default("published"),
  ...timestamps,
});
