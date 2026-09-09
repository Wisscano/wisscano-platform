import { pgEnum } from "drizzle-orm/pg-core";

export const adminRoleEnum = pgEnum("admin_role", [
  "super_admin",   // full access incl. user management
  "operations",    // procurement requests, documents, customers, suppliers
  "content_editor" // brands, categories, services, showcase, carousels, SEO
]);

export const publishStateEnum = pgEnum("publish_state", ["draft", "published", "archived"]);

export const carouselTypeEnum = pgEnum("carousel_type", ["brands", "what_we_source", "services"]);

export const carouselDirectionEnum = pgEnum("carousel_direction", ["left", "right"]);

export const procurementTypeEnum = pgEnum("procurement_type", [
  "single_purchase",
  "bulk_procurement",
  "project_procurement",
  "recurring_supply",
  "urgent_procurement",
]);

// Mirrors the status pipeline in the master spec (§10 / §51 Phase 7).
export const requestStatusEnum = pgEnum("request_status", [
  "new",
  "reviewing",
  "sourcing",
  "quotation_prepared",
  "awaiting_customer",
  "approved",
  "procurement",
  "delivered",
  "closed",
  "cancelled",
]);

export const selectedContextTypeEnum = pgEnum("selected_context_type", ["brand", "category", "service"]);

export const attachmentOwnerEnum = pgEnum("attachment_owner_type", ["procurement_request", "document", "media_library"]);

export const documentStatusEnum = pgEnum("document_status", ["draft", "issued", "sent", "accepted", "void"]);

export const notificationChannelEnum = pgEnum("notification_channel", ["whatsapp", "email", "sms", "crm"]);

export const notificationStatusEnum = pgEnum("notification_status", ["pending", "sent", "failed", "skipped"]);

export const highlightTypeEnum = pgEnum("highlight_type", [
  "wisscano_launch",
  "new_platform",
  "new_service",
  "new_technology",
  "procurement_update",
  "featured_solution",
  "company_announcement",
  "general_highlight",
]);

export const scanStatusEnum = pgEnum("scan_status", ["pending", "scanning", "clean", "infected", "error", "rejected"]);
