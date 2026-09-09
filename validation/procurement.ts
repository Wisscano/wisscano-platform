import { z } from "zod";

export const requirementItemSchema = z.object({
  description: z.string().min(3, "Describe what's needed").max(4000),
  categoryId: z.string().uuid().optional(),
  brandPreference: z.string().max(200).optional(),
  knownModel: z.string().max(200).optional(),
  quantity: z.string().max(60).optional(),
  preferredAlternatives: z.string().max(1000).optional(),
});

export const assistedAnswersSchema = z.object({
  outcome: z.string().max(4000).optional(),
  scale: z.string().max(1000).optional(),
  deploymentLocation: z.string().max(1000).optional(),
  timeframe: z.string().max(1000).optional(),
  problem: z.string().max(4000).optional(),
});

export const selectedContextSchema = z.object({
  type: z.enum(["brand", "category", "service"]),
  id: z.string().uuid(),
  label: z.string().max(200),
});

/**
 * Server-side validation for a procurement request submission. Mirrors the
 * client form but is trusted independently — the client is never trusted
 * alone (§17). At least one of requirementText / items / isAssisted must
 * carry real content, enforced by the refine() below.
 */
export const createProcurementRequestSchema = z
  .object({
    customer: z.object({
      name: z.string().min(2, "Name is required").max(200),
      organization: z.string().max(200).optional(),
      email: z.string().email("Enter a valid email"),
      phone: z.string().max(40).optional(),
      countryCode: z.string().length(2).optional(),
      city: z.string().max(120).optional(),
    }),
    deliveryLocation: z.string().max(300).optional(),
    // Long procurement requirements are expected and supported — BOM-style lists, multi-paragraph
    // specifications, part numbers, etc. (§11: "do not impose an unnecessarily small character limit").
    // 20,000 chars (~3,000+ words) comfortably covers genuine procurement briefs while still bounding
    // request size for abuse/resource-protection purposes.
    requirementText: z.string().max(20000).optional(),
    procurementType: z.enum([
      "single_purchase",
      "bulk_procurement",
      "project_procurement",
      "recurring_supply",
      "urgent_procurement",
    ]).default("single_purchase"),
    budget: z.string().max(100).optional(),
    deliveryTimeframe: z.string().max(150).optional(),
    selectedContext: selectedContextSchema.optional(),
    isAssisted: z.boolean().default(false),
    assistedAnswers: assistedAnswersSchema.optional(),
    items: z.array(requirementItemSchema).max(30).default([]),
    attachmentMediaIds: z.array(z.string().uuid()).max(10).default([]),
  })
  .refine(
    (data) =>
      (data.requirementText && data.requirementText.trim().length > 0) ||
      data.items.length > 0 ||
      data.attachmentMediaIds.length > 0 ||
      (data.isAssisted && data.assistedAnswers && Object.values(data.assistedAnswers).some(Boolean)),
    { message: "Describe your requirement, add an item, attach a file, or use assisted procurement." }
  );

export type CreateProcurementRequestInput = z.infer<typeof createProcurementRequestSchema>;

export const updateRequestStatusSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum([
    "new", "reviewing", "sourcing", "quotation_prepared", "awaiting_customer",
    "approved", "procurement", "delivered", "closed", "cancelled",
  ]),
  note: z.string().max(1000).optional(),
});
