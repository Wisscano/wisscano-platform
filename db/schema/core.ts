import { pgTable, uuid, varchar, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { adminRoleEnum, scanStatusEnum } from "./enums";

/** Common timestamp columns reused by every table. */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

/**
 * SITE SETTINGS — singleton row (id is always fixed) holding global,
 * admin-editable configuration. Nothing about the company identity is
 * hard-coded into components; everything reads from here.
 */
export const siteSettings = pgTable("site_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 200 }).notNull().default("Wisscano Technologies"),
  tagline: varchar("tagline", { length: 300 }).notNull().default("One hub. Infinite Tech Solutions."),
  // Factual, admin-editable expansion of the WISSCANO name — never hard-coded into components (§1 of final spec).
  acronymExpansion: varchar("acronym_expansion", { length: 300 }).notNull().default(
    "Wildcard ICT & IoT Systems, Software, Cloud, AI & Network Operations"
  ),
  heroHeadline: varchar("hero_headline", { length: 200 }).notNull().default("SOURCE. PROCURE. DEPLOY."),
  heroSubheadline: text("hero_subheadline").notNull().default(
    "Technology procurement and digital solutions without borders."
  ),
  logoMediaId: uuid("logo_media_id"),
  faviconMediaId: uuid("favicon_media_id"),
  contactEmail: varchar("contact_email", { length: 200 }).notNull().default("info@wisscano.co.ke"),
  contactPhone: varchar("contact_phone", { length: 40 }),
  whatsappNumber: varchar("whatsapp_number", { length: 40 }).notNull().default("254119834490"),
  address: text("address"),
  defaultCountryCode: varchar("default_country_code", { length: 2 }).notNull().default("KE"),
  defaultCurrency: varchar("default_currency", { length: 3 }).notNull().default("KES"),
  socialLinks: jsonb("social_links").$type<Record<string, string>>().default({}),
  footerText: text("footer_text"),
  navItems: jsonb("nav_items").$type<{ label: string; url: string; order: number }[]>().default([]),
  ogImageMediaId: uuid("og_image_media_id"), // default social-share image, used when a page doesn't set its own
  seoDefaultTitle: varchar("seo_default_title", { length: 200 }),
  seoDefaultDescription: text("seo_default_description"),
  ...timestamps,
});

/** Countries Wisscano can serve. International-first: Kenya is a row, not a code path. */
export const countries = pgTable("countries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  isoCode: varchar("iso_code", { length: 2 }).notNull().unique(),
  currency: varchar("currency", { length: 3 }).notNull(),
  locale: varchar("locale", { length: 10 }).notNull().default("en"),
  callingCode: varchar("calling_code", { length: 8 }),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

/** Regions/markets within a country — supports localized delivery + content. */
export const markets = pgTable("markets", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryId: uuid("country_id").notNull().references(() => countries.id, { onDelete: "cascade" }),
  regionName: varchar("region_name", { length: 120 }).notNull(),
  cityName: varchar("city_name", { length: 120 }),
  procurementAvailable: boolean("procurement_available").notNull().default(true),
  deliveryAvailable: boolean("delivery_available").notNull().default(true),
  localizedNotes: text("localized_notes"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

/** Admin users. Passwords are bcrypt hashes; never store plaintext. */
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: adminRoleEnum("role").notNull().default("content_editor"),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

/**
 * MEDIA LIBRARY — every uploaded asset (brand logo, showcase image,
 * procurement attachment) is a row here first. Other tables reference
 * media by id rather than storing raw URLs, so replacing an asset or
 * viewing "where is this used" is a query, not a migration.
 */
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: varchar("filename", { length: 300 }).notNull(),
  storageKey: text("storage_key").notNull(), // Vercel Blob pathname
  url: text("url").notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  altText: varchar("alt_text", { length: 300 }),
  caption: text("caption"),
  contextualDescription: text("contextual_description"),
  semanticTags: jsonb("semantic_tags").$type<string[]>().default([]),
  uploadedByAdminId: uuid("uploaded_by_admin_id").references(() => adminUsers.id),
  /**
   * MANDATORY malware-screening gate (never optional — see lib/security-scan.ts).
   * Every uploaded file starts "pending" in a quarantine storage path and is
   * only usable (visible to admins, includable in a WhatsApp handoff, or
   * publicly served) once scanStatus is "clean". "error" is treated as
   * unsafe, not safe-by-default — a scanner failure blocks the file rather
   * than silently passing it through.
   */
  scanStatus: scanStatusEnum("scan_status").notNull().default("pending"),
  scanProvider: varchar("scan_provider", { length: 60 }),
  scanDetails: text("scan_details"),
  scannedAt: timestamp("scanned_at", { withTimezone: true }),
  quarantined: boolean("quarantined").notNull().default(true),
  ...timestamps,
});

/** Generic audit trail for admin mutations (§17 security requirement). */
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminUserId: uuid("admin_user_id").references(() => adminUsers.id),
  action: varchar("action", { length: 100 }).notNull(), // e.g. "brand.create", "request.status_change"
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
