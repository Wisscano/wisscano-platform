"use server";

import { db } from "@/db";
import { services, auditLogs } from "@/db/schema";
import { serviceSchema } from "@/validation/catalogue";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function listServices() {
  await requireAdmin();
  return db.select().from(services).orderBy(services.displayOrder);
}

export async function createService(input: unknown) {
  const session = await requireAdmin();
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const [record] = await db.insert(services).values(parsed.data).returning();
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "service.create", entityType: "service", entityId: record!.id });

  revalidatePath("/");
  revalidatePath(`/services/${record!.slug}`);
  return { ok: true, id: record!.id };
}

export async function updateService(id: string, input: unknown) {
  const session = await requireAdmin();
  const parsed = serviceSchema.partial().safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const [record] = await db.update(services).set(parsed.data).where(eq(services.id, id)).returning();
  if (!record) return { ok: false, errors: { _form: ["Service not found"] } };

  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "service.update", entityType: "service", entityId: id });
  revalidatePath("/");
  revalidatePath(`/services/${record.slug}`);
  return { ok: true };
}

export async function archiveService(id: string) {
  const session = await requireAdmin();
  await db.update(services).set({ state: "archived" }).where(eq(services.id, id));
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "service.archive", entityType: "service", entityId: id });
  revalidatePath("/");
  return { ok: true };
}
