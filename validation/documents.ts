import { z } from "zod";

export const documentTypeSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20).regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only, e.g. QT, INV, LPO"),
  description: z.string().max(500).optional(),
  active: z.boolean().default(true),
});
export type DocumentTypeInput = z.infer<typeof documentTypeSchema>;

export const documentLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().int().min(1).default(1),
  unitPriceMinor: z.number().int().min(0).default(0), // minor units (cents) — avoids float rounding
  discountMinor: z.number().int().min(0).default(0),
  taxRateBasisPoints: z.number().int().min(0).max(10000).default(0), // 1600 = 16%
});

export const documentSchema = z.object({
  documentTypeId: z.string().uuid(),
  requestId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  // Fallback customer fields for a document not linked to an existing customer record
  customerName: z.string().max(200).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  currency: z.string().length(3).default("KES"),
  status: z.enum(["draft", "issued", "sent", "accepted", "void"]).default("draft"),
  paymentTerms: z.string().max(500).optional(),
  deliveryTerms: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  validUntil: z.string().max(40).optional(),
  lineItems: z.array(documentLineItemSchema).min(1, "Add at least one line item"),
});
export type DocumentInput = z.infer<typeof documentSchema>;

export const companyProfileSchema = z.object({
  legalName: z.string().min(2).max(200),
  registrationNumber: z.string().max(100).optional(),
  taxNumber: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional(),
  website: z.string().max(200).optional(),
  bankDetails: z.string().max(1000).optional(),
  authorizedSignatoryName: z.string().max(150).optional(),
  authorizedSignatoryTitle: z.string().max(150).optional(),
});
export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
