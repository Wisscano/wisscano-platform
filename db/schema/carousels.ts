import { pgTable, uuid, varchar, integer, boolean, text } from "drizzle-orm/pg-core";
import { timestamps } from "./core";
import { carouselTypeEnum, carouselDirectionEnum } from "./enums";

/**
 * One config row per carousel (brands / what_we_source / services) so an
 * admin can independently tune direction, speed, and active state per
 * §6-8 and §15 of the master spec — without touching code.
 *
 * speedPxPerSec drives the requestAnimationFrame-based marquee (not CSS
 * keyframes), which is what makes the carousel bidirectionally draggable
 * while still autoplaying in its configured direction — see
 * components/marquee.tsx.
 */
export const carouselConfigs = pgTable("carousel_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: carouselTypeEnum("type").notNull().unique(),
  direction: carouselDirectionEnum("direction").notNull(),
  speedPxPerSec: integer("speed_px_per_sec").notNull().default(30),
  active: boolean("active").notNull().default(true),
  pauseOnHover: boolean("pause_on_hover").notNull().default(true),
  ...timestamps,
});

/**
 * Carousel items reference an underlying entity (brand/category/service)
 * by id + type, rather than duplicating content, so editing a brand once
 * updates it everywhere it's surfaced. `entityId` is intentionally not a
 * typed FK because it can point at three different tables.
 */
export const carouselItems = pgTable("carousel_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  carouselType: carouselTypeEnum("carousel_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  overrideLabel: varchar("override_label", { length: 200 }),
  overrideUrl: text("override_url"),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});
