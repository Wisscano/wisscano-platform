"use server";

import { db } from "@/db";
import { highlights, auditLogs } from "@/db/schema";
import { highlightSchema } from "@/validation/highlights";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function listHighlights() {
  await requireAdmin();
  return db.select().from(highlights).orderBy(highlights.displayOrder);
}

function normalizeDates(data: any) {
  return {
    ...data,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
  };
}

export async function createHighlight(input: unknown) {
  const session = await requireAdmin();
  const parsed = highlightSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const [record] = await db.insert(highlights).values(normalizeDates(parsed.data)).returning();
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "highlight.create", entityType: "highlight", entityId: record!.id });

  revalidatePath("/");
  return { ok: true, id: record!.id };
}

export async function updateHighlight(id: string, input: unknown) {
  const session = await requireAdmin();
  const parsed = highlightSchema.partial().safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  await db.update(highlights).set(normalizeDates(parsed.data)).where(eq(highlights.id, id));
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "highlight.update", entityType: "highlight", entityId: id });

  revalidatePath("/");
  return { ok: true };
}

export async function archiveHighlight(id: string) {
  const session = await requireAdmin();
  await db.update(highlights).set({ active: false }).where(eq(highlights.id, id));
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "highlight.archive", entityType: "highlight", entityId: id });
  revalidatePath("/");
  return { ok: true };
}
