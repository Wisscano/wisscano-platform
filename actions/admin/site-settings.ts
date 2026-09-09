"use server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  companyName: z.string().min(2).max(200),
  tagline: z.string().max(300),
  acronymExpansion: z.string().max(300).optional(),
  heroHeadline: z.string().max(200),
  heroSubheadline: z.string().max(500),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(40).optional(),
  whatsappNumber: z.string().max(40),
  address: z.string().max(500).optional(),
  defaultCountryCode: z.string().length(2),
  defaultCurrency: z.string().length(3),
  logoMediaId: z.string().uuid().optional(),
  faviconMediaId: z.string().uuid().optional(),
  ogImageMediaId: z.string().uuid().optional(),
  footerText: z.string().max(500).optional(),
  socialLinks: z.record(z.string()).optional(), // { "LinkedIn": "https://...", ... }
  navItems: z.array(z.object({ label: z.string().max(80), url: z.string().max(300), order: z.number().int() })).optional(),
  seoDefaultTitle: z.string().max(200).optional(),
  seoDefaultDescription: z.string().max(500).optional(),
});

export async function getSettingsForAdmin() {
  await requireAdmin();
  const [row] = await db.select().from(siteSettings).limit(1);
  return row ?? null;
}

export async function updateSiteSettings(id: string, input: unknown) {
  await requireAdmin("super_admin");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };
  await db.update(siteSettings).set(parsed.data).where(eq(siteSettings.id, id));
  revalidatePath("/");
  return { ok: true };
}
