import { pgTable, uuid, varchar, text, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { timestamps } from "./core";
import { adminUsers, media } from "./core";
import {
  procurementTypeEnum,
  requestStatusEnum,
  selectedContextTypeEnum,
  notificationChannelEnum,
  notificationStatusEnum,
} from "./enums";

/**
 * CUSTOMERS — every procurement request is tied to a customer record.
 * Deliberately thin for the MVP (no login/portal yet, §Phase 8), but
 * modeling it as its own table now means repeat/recurring customers and
 * a future customer portal don't require a schema rewrite.
 */
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  organization: varchar("organization", { length: 200 }),
  email: varchar("email", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  countryCode: varchar("country_code", { length: 2 }),
  city: varchar("city", { length: 120 }),
  notes: text("notes"),
  ...timestamps,
});

/**
 * PROCUREMENT REQUESTS — the system of record. WhatsApp is only ever a
 * notification channel layered on top of this row (§14 / §51 Phase 5).
 */
export const procurementRequests = pgTable("procurement_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceNumber: varchar("reference_number", { length: 40 }).notNull().unique(), // WIS-RFQ-2026-0001

  customerId: uuid("customer_id").notNull().references(() => customers.id),
  deliveryLocation: text("delivery_location"),

  // free-text primary requirement, always populated even for assisted flows
  requirementText: text("requirement_text"),

  procurementType: procurementTypeEnum("procurement_type").notNull().default("single_purchase"),
  budget: varchar("budget", { length: 100 }), // free text: exact figures are rarely known upfront
  deliveryTimeframe: varchar("delivery_timeframe", { length: 150 }),

  // Selected carousel context at time of submission (§5 of master spec)
  selectedContextType: selectedContextTypeEnum("selected_context_type"),
  selectedContextId: uuid("selected_context_id"),
  selectedContextLabel: varchar("selected_context_label", { length: 200 }),

  // Assisted-procurement capture, kept structured for the ops team
  isAssisted: boolean("is_assisted").notNull().default(false),
  assistedAnswers: jsonb("assisted_answers").$type<{
    outcome?: string;
    scale?: string;
    deploymentLocation?: string;
    timeframe?: string;
    problem?: string;
  }>(),

  status: requestStatusEnum("status").notNull().default("new"),
  assignedAdminId: uuid("assigned_admin_id").references(() => adminUsers.id),
  internalNotes: text("internal_notes"),

  ...timestamps,
});

/**
 * REQUIREMENT ITEMS — one procurement request can bundle multiple distinct
 * requirements ("20 laptops" + "5 switches" + "15 access points"). These
 * are explicitly named Requirement Items, never "cart items" (§6).
 */
export const procurementRequestItems = pgTable("procurement_request_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => procurementRequests.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  categoryId: uuid("category_id"), // loose ref to procurement_categories.id
  brandPreference: varchar("brand_preference", { length: 200 }),
  knownModel: varchar("known_model", { length: 200 }),
  quantity: varchar("quantity", { length: 60 }), // free text: "20", "~15", "TBD"
  preferredAlternatives: text("preferred_alternatives"),
  displayOrder: integer("display_order").notNull().default(0),
  ...timestamps,
});

/** Attachments belonging to a procurement request (images, BOMs, tenders, specs). */
export const procurementRequestAttachments = pgTable("procurement_request_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => procurementRequests.id, { onDelete: "cascade" }),
  mediaId: uuid("media_id").notNull().references(() => media.id),
  ...timestamps,
});

/** Full audit trail of every status transition on a request (§9). */
export const requestStatusHistory = pgTable("request_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => procurementRequests.id, { onDelete: "cascade" }),
  fromStatus: requestStatusEnum("from_status"),
  toStatus: requestStatusEnum("to_status").notNull(),
  changedByAdminId: uuid("changed_by_admin_id").references(() => adminUsers.id),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * SUPPLIERS + SUPPLIER QUOTATIONS — internal-only sourcing data (§11).
 * Never exposed on the public site; purely for the ops workflow that
 * turns a request into a customer quotation.
 */
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  contactName: varchar("contact_name", { length: 150 }),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 40 }),
  countryCode: varchar("country_code", { length: 2 }),
  brandsSupplied: jsonb("brands_supplied").$type<string[]>().default([]),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const supplierQuotations = pgTable("supplier_quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => procurementRequests.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
  costPrice: integer("cost_price_minor"), // minor units (cents) to avoid float rounding
  currency: varchar("currency", { length: 3 }).default("KES"),
  leadTimeDays: integer("lead_time_days"),
  notes: text("notes"),
  ...timestamps,
});

/**
 * NOTIFICATIONS LOG — every WhatsApp/email/SMS/CRM dispatch attempt for a
 * request is recorded here, decoupled from the request itself, so the
 * notification layer (§12) can be swapped without touching procurement logic.
 */
export const notificationLog = pgTable("notification_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").references(() => procurementRequests.id, { onDelete: "cascade" }),
  channel: notificationChannelEnum("channel").notNull(),
  status: notificationStatusEnum("status").notNull().default("pending"),
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
