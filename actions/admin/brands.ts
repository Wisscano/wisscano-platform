"use server";

import { db } from "@/db";
import { brands, auditLogs } from "@/db/schema";
import { brandSchema } from "@/validation/catalogue";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Canonical CRUD pattern used identically across brands / categories /
 * services / showcase. Every mutation: (1) requires an authenticated admin
 * server-side — never trusts the client, (2) validates with Zod, (3) writes
 * an audit log row, (4) revalidates the public pages that read this data.
 */

export async function listBrands() {
  await requireAdmin();
  return db.select().from(brands).orderBy(brands.displayOrder);
}

export async function createBrand(input: unknown) {
  const session = await requireAdmin();
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const [record] = await db.insert(brands).values(parsed.data).returning();

  await db.insert(auditLogs).values({
    adminUserId: session.adminId,
    action: "brand.create",
    entityType: "brand",
    entityId: record!.id,
    metadata: { name: record!.name },
  });

  revalidatePath("/");
  revalidatePath(`/brands/${record!.slug}`);
  return { ok: true, id: record!.id };
}

export async function updateBrand(id: string, input: unknown) {
  const session = await requireAdmin();
  const parsed = brandSchema.partial().safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const [record] = await db.update(brands).set(parsed.data).where(eq(brands.id, id)).returning();
  if (!record) return { ok: false, errors: { _form: ["Brand not found"] } };

  await db.insert(auditLogs).values({
    adminUserId: session.adminId,
    action: "brand.update",
    entityType: "brand",
    entityId: id,
    metadata: parsed.data,
  });

  revalidatePath("/");
  revalidatePath(`/brands/${record.slug}`);
  return { ok: true };
}

/** Soft-delete via state='archived' — never a hard DELETE, so carousel/request history stays intact. */
export async function archiveBrand(id: string) {
  const session = await requireAdmin();
  await db.update(brands).set({ state: "archived" }).where(eq(brands.id, id));

  await db.insert(auditLogs).values({
    adminUserId: session.adminId,
    action: "brand.archive",
    entityType: "brand",
    entityId: id,
  });

  revalidatePath("/");
  return { ok: true };
}
