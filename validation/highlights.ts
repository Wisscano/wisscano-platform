import { z } from "zod";

export const highlightSchema = z.object({
  type: z.enum([
    "wisscano_launch", "new_platform", "new_service", "new_technology",
    "procurement_update", "featured_solution", "company_announcement", "general_highlight",
  ]).default("general_highlight"),
  title: z.string().min(2).max(200),
  shortDescription: z.string().max(300).optional(),
  imageMediaId: z.string().uuid().optional(),
  ctaLabel: z.string().min(1).max(80).default("Learn more"),
  ctaUrl: z.string().min(1, "A destination is required — internal anchor, route, or external URL").max(500),
  isExternal: z.boolean().default(false),
  openInNewTab: z.boolean().default(false),
  active: z.boolean().default(true),
  startDate: z.string().datetime().optional().or(z.literal("")),
  endDate: z.string().datetime().optional().or(z.literal("")),
  displayOrder: z.number().int().default(0),
  priority: z.number().int().default(0),
});
export type HighlightInput = z.infer<typeof highlightSchema>;
