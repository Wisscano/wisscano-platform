import { pgTable, uuid, varchar, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { timestamps } from "./core";
import { media } from "./core";
import { highlightTypeEnum } from "./enums";

/**
 * WISSCANO HIGHLIGHTS / ANNOUNCEMENTS — the slender, auto-rotating CMS
 * strip near the top of the homepage (launches, new services, procurement
 * updates, partnerships, etc). Deliberately generic on destination: a
 * record can point at an internal anchor/route, an external URL, or a
 * Wisscano subdomain (e.g. forge.wisscano.co.ke) — `isExternal` controls
 * whether the link opens in a new tab, not whether it's "allowed".
 * Never hard-code an announcement into a component; every record here is
 * fully admin-managed and can be scheduled on/off with start/end dates.
 */
export const highlights = pgTable("highlights", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: highlightTypeEnum("type").notNull().default("general_highlight"),
  title: varchar("title", { length: 200 }).notNull(),
  shortDescription: varchar("short_description", { length: 300 }),
  imageMediaId: uuid("image_media_id").references(() => media.id),
  ctaLabel: varchar("cta_label", { length: 80 }).notNull().default("Learn more"),
  ctaUrl: text("cta_url").notNull(), // internal anchor ("#services"), internal route ("/services/x"), or external/subdomain URL
  isExternal: boolean("is_external").notNull().default(false),
  openInNewTab: boolean("open_in_new_tab").notNull().default(false),
  active: boolean("active").notNull().default(true),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  displayOrder: integer("display_order").notNull().default(0),
  priority: integer("priority").notNull().default(0), // higher = shown first when multiple are eligible
  ...timestamps,
});
