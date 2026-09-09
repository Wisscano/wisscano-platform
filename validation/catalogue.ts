import { z } from "zod";

const baseSeo = {
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  altText: z.string().max(300).optional(),
  semanticTags: z.array(z.string()).default([]),
};

export const brandSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().min(2).max(160).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  logoMediaId: z.string().uuid().optional(),
  description: z.string().max(2000).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  categoryIds: z.array(z.string().uuid()).default([]),
  displayOrder: z.number().int().default(0),
  state: z.enum(["draft", "published", "archived"]).default("published"),
  ...baseSeo,
});
export type BrandInput = z.infer<typeof brandSchema>;

export const categorySchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().min(2).max(160).regex(/^[a-z0-9-]+$/),
  group: z.string().max(100).optional(),
  icon: z.string().max(60).optional(),
  imageMediaId: z.string().uuid().optional(),
  shortBlurb: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  procurementInformation: z.string().max(4000).optional(),
  relatedBrandIds: z.array(z.string().uuid()).default([]),
  displayOrder: z.number().int().default(0),
  state: z.enum(["draft", "published", "archived"]).default("published"),
  ...baseSeo,
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const serviceSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().min(2).max(160).regex(/^[a-z0-9-]+$/),
  icon: z.string().max(60).optional(),
  imageMediaId: z.string().uuid().optional(),
  shortBlurb: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  detailedContent: z.string().max(4000).optional(),
  relatedCategoryIds: z.array(z.string().uuid()).default([]),
  displayOrder: z.number().int().default(0),
  state: z.enum(["draft", "published", "archived"]).default("published"),
  ...baseSeo,
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const showcaseItemSchema = z.object({
  title: z.string().min(2).max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  desktopImageMediaId: z.string().uuid().optional(),
  mobileImageMediaId: z.string().uuid().optional(),
  ctaLabel: z.string().max(80).optional(),
  ctaUrl: z.string().max(500).optional(),
  category: z.string().max(120).optional(),
  displayOrder: z.number().int().default(0),
  state: z.enum(["draft", "published", "archived"]).default("published"),
  ...baseSeo,
});
export type ShowcaseItemInput = z.infer<typeof showcaseItemSchema>;
