import { pgTable, uuid, varchar, text, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { timestamps } from "./core";
import { adminUsers } from "./core";
import { procurementRequests, customers } from "./procurement";
import { documentStatusEnum } from "./enums";

/**
 * DOCUMENT ENGINE (§10 / §43-50 of master spec). Entirely internal/admin —
 * never rendered on the public site, never wired to a checkout. Pricing
 * here is commercial/internal data, distinct from public-site content.
 */

export const documentTypes = pgTable("document_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(), // "Quotation", "Invoice", "LPO"...
  code: varchar("code", { length: 20 }).notNull().unique(), // "QT", "INV", "LPO", "PO", "DN", "RCT", "RFQ"
  description: text("description"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

/** Configurable numbering sequence per document type, e.g. QT-2026-0001. */
export const documentNumberSequences = pgTable("document_number_sequences", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentTypeId: uuid("document_type_id").notNull().references(() => documentTypes.id, { onDelete: "cascade" }),
  prefix: varchar("prefix", { length: 20 }).notNull(),
  year: integer("year").notNull(),
  nextSequence: integer("next_sequence").notNull().default(1),
  padding: integer("padding").notNull().default(4), // 0001 vs 00001
  ...timestamps,
});

/** Reusable layout/branding for a document type — admin can duplicate & tweak. */
export const documentTemplates = pgTable("document_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentTypeId: uuid("document_type_id").notNull().references(() => documentTypes.id),
  name: varchar("name", { length: 150 }).notNull(),
  fieldConfig: jsonb("field_config").$type<{
    showTax?: boolean;
    showDiscount?: boolean;
    paymentTermsDefault?: string;
    deliveryTermsDefault?: string;
    termsAndConditions?: string;
    bankDetails?: string;
    signatoryName?: string;
    signatoryTitle?: string;
  }>().default({}),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

/** Company legal/commercial identity used across generated documents. Never hard-coded into PDFs. */
export const companyProfile = pgTable("company_profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  legalName: varchar("legal_name", { length: 200 }).notNull().default("Wisscano Technologies"),
  registrationNumber: varchar("registration_number", { length: 100 }),
  taxNumber: varchar("tax_number", { length: 100 }),
  address: text("address"),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 40 }),
  website: varchar("website", { length: 200 }),
  bankDetails: text("bank_details"),
  logoMediaId: uuid("logo_media_id"),
  authorizedSignatoryName: varchar("authorized_signatory_name", { length: 150 }),
  authorizedSignatoryTitle: varchar("authorized_signatory_title", { length: 150 }),
  ...timestamps,
});

/** A generated commercial document, optionally linked back to the originating request. */
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentTypeId: uuid("document_type_id").notNull().references(() => documentTypes.id),
  templateId: uuid("template_id").references(() => documentTemplates.id),
  documentNumber: varchar("document_number", { length: 60 }).notNull().unique(),
  requestId: uuid("request_id").references(() => procurementRequests.id),
  customerId: uuid("customer_id").references(() => customers.id),
  currency: varchar("currency", { length: 3 }).notNull().default("KES"),
  status: documentStatusEnum("status").notNull().default("draft"),
  subtotalMinor: integer("subtotal_minor").notNull().default(0),
  taxMinor: integer("tax_minor").notNull().default(0),
  discountMinor: integer("discount_minor").notNull().default(0),
  totalMinor: integer("total_minor").notNull().default(0),
  paymentTerms: text("payment_terms"),
  deliveryTerms: text("delivery_terms"),
  notes: text("notes"),
  validUntil: varchar("valid_until", { length: 40 }),
  createdByAdminId: uuid("created_by_admin_id").references(() => adminUsers.id),
  pdfMediaId: uuid("pdf_media_id"), // generated PDF stored in media library, access-controlled
  ...timestamps,
});

/** Line items on a document — deliberately separate table from procurement request items. */
export const documentLineItems = pgTable("document_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceMinor: integer("unit_price_minor").notNull().default(0),
  discountMinor: integer("discount_minor").notNull().default(0),
  taxRateBasisPoints: integer("tax_rate_basis_points").notNull().default(0), // 1600 = 16%
  displayOrder: integer("display_order").notNull().default(0),
  ...timestamps,
});
