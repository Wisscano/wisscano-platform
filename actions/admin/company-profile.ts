"use server";

import { db } from "@/db";
import { companyProfile, auditLogs } from "@/db/schema";
import { companyProfileSchema } from "@/validation/documents";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/** Singleton row — the legal/commercial identity printed on every generated document (§44). */
export async function getCompanyProfile() {
  await requireAdmin();
  const [row] = await db.select().from(companyProfile).limit(1);
  return row ?? null;
}

export async function updateCompanyProfile(id: string, input: unknown) {
  const session = await requireAdmin();
  const parsed = companyProfileSchema.partial().safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  await db.update(companyProfile).set(parsed.data).where(eq(companyProfile.id, id));
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "company_profile.update", entityType: "company_profile", entityId: id });
  revalidatePath("/admin/documents");
  return { ok: true };
}
