"use server";

import { db } from "@/db";
import { procurementCategories, auditLogs } from "@/db/schema";
import { categorySchema } from "@/validation/catalogue";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function listCategories() {
  await requireAdmin();
  return db.select().from(procurementCategories).orderBy(procurementCategories.displayOrder);
}

export async function createCategory(input: unknown) {
  const session = await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const [record] = await db.insert(procurementCategories).values(parsed.data).returning();
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "category.create", entityType: "procurement_category", entityId: record!.id });

  revalidatePath("/");
  revalidatePath(`/procurement/${record!.slug}`);
  return { ok: true, id: record!.id };
}

export async function updateCategory(id: string, input: unknown) {
  const session = await requireAdmin();
  const parsed = categorySchema.partial().safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const [record] = await db.update(procurementCategories).set(parsed.data).where(eq(procurementCategories.id, id)).returning();
  if (!record) return { ok: false, errors: { _form: ["Category not found"] } };

  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "category.update", entityType: "procurement_category", entityId: id });
  revalidatePath("/");
  revalidatePath(`/procurement/${record.slug}`);
  return { ok: true };
}

export async function archiveCategory(id: string) {
  const session = await requireAdmin();
  await db.update(procurementCategories).set({ state: "archived" }).where(eq(procurementCategories.id, id));
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "category.archive", entityType: "procurement_category", entityId: id });
  revalidatePath("/");
  return { ok: true };
}
