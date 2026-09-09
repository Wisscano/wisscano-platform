import { relations } from "drizzle-orm";
import { brands, procurementCategories, services, showcaseItems } from "./catalogue";
import { media } from "./core";
import {
  procurementRequests,
  procurementRequestItems,
  procurementRequestAttachments,
  requestStatusHistory,
  customers,
  suppliers,
  supplierQuotations,
} from "./procurement";
import { documents, documentLineItems, documentTypes, documentTemplates } from "./documents";

export const customersRelations = relations(customers, ({ many }) => ({
  requests: many(procurementRequests),
  documents: many(documents),
}));

export const procurementRequestsRelations = relations(procurementRequests, ({ one, many }) => ({
  customer: one(customers, { fields: [procurementRequests.customerId], references: [customers.id] }),
  items: many(procurementRequestItems),
  attachments: many(procurementRequestAttachments),
  statusHistory: many(requestStatusHistory),
  supplierQuotations: many(supplierQuotations),
  documents: many(documents),
}));

export const procurementRequestItemsRelations = relations(procurementRequestItems, ({ one }) => ({
  request: one(procurementRequests, { fields: [procurementRequestItems.requestId], references: [procurementRequests.id] }),
}));

export const procurementRequestAttachmentsRelations = relations(procurementRequestAttachments, ({ one }) => ({
  request: one(procurementRequests, { fields: [procurementRequestAttachments.requestId], references: [procurementRequests.id] }),
  media: one(media, { fields: [procurementRequestAttachments.mediaId], references: [media.id] }),
}));

export const requestStatusHistoryRelations = relations(requestStatusHistory, ({ one }) => ({
  request: one(procurementRequests, { fields: [requestStatusHistory.requestId], references: [procurementRequests.id] }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  quotations: many(supplierQuotations),
}));

export const supplierQuotationsRelations = relations(supplierQuotations, ({ one }) => ({
  supplier: one(suppliers, { fields: [supplierQuotations.supplierId], references: [suppliers.id] }),
  request: one(procurementRequests, { fields: [supplierQuotations.requestId], references: [procurementRequests.id] }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  type: one(documentTypes, { fields: [documents.documentTypeId], references: [documentTypes.id] }),
  template: one(documentTemplates, { fields: [documents.templateId], references: [documentTemplates.id] }),
  request: one(procurementRequests, { fields: [documents.requestId], references: [procurementRequests.id] }),
  customer: one(customers, { fields: [documents.customerId], references: [customers.id] }),
  lineItems: many(documentLineItems),
}));

export const documentLineItemsRelations = relations(documentLineItems, ({ one }) => ({
  document: one(documents, { fields: [documentLineItems.documentId], references: [documents.id] }),
}));

export const brandsRelations = relations(brands, ({ one }) => ({
  logo: one(media, { fields: [brands.logoMediaId], references: [media.id] }),
}));

export const categoriesRelations = relations(procurementCategories, ({ one }) => ({
  image: one(media, { fields: [procurementCategories.imageMediaId], references: [media.id] }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  image: one(media, { fields: [services.imageMediaId], references: [media.id] }),
}));

export const showcaseRelations = relations(showcaseItems, ({ one }) => ({
  desktopImage: one(media, { fields: [showcaseItems.desktopImageMediaId], references: [media.id] }),
  mobileImage: one(media, { fields: [showcaseItems.mobileImageMediaId], references: [media.id] }),
}));
