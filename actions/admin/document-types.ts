"use server";

import { db } from "@/db";
import { documentTypes, auditLogs } from "@/db/schema";
import { documentTypeSchema } from "@/validation/documents";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function listDocumentTypes() {
  await requireAdmin();
  return db.select().from(documentTypes);
}

export async function createDocumentType(input: unknown) {
  const session = await requireAdmin();
  const parsed = documentTypeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const [record] = await db.insert(documentTypes).values(parsed.data).returning();
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "document_type.create", entityType: "document_type", entityId: record!.id });
  revalidatePath("/admin/document-types");
  return { ok: true, id: record!.id };
}

export async function updateDocumentType(id: string, input: unknown) {
  const session = await requireAdmin();
  const parsed = documentTypeSchema.partial().safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  await db.update(documentTypes).set(parsed.data).where(eq(documentTypes.id, id));
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "document_type.update", entityType: "document_type", entityId: id });
  revalidatePath("/admin/document-types");
  return { ok: true };
}

export async function archiveDocumentType(id: string) {
  const session = await requireAdmin();
  await db.update(documentTypes).set({ active: false }).where(eq(documentTypes.id, id));
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "document_type.archive", entityType: "document_type", entityId: id });
  revalidatePath("/admin/document-types");
  return { ok: true };
}
