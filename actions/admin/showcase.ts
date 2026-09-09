"use server";

import { db } from "@/db";
import { showcaseItems, auditLogs } from "@/db/schema";
import { showcaseItemSchema } from "@/validation/catalogue";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function listShowcaseItems() {
  await requireAdmin();
  return db.select().from(showcaseItems).orderBy(showcaseItems.displayOrder);
}

export async function createShowcaseItem(input: unknown) {
  const session = await requireAdmin();
  const parsed = showcaseItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const [record] = await db.insert(showcaseItems).values(parsed.data).returning();
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "showcase.create", entityType: "showcase_item", entityId: record!.id });
  revalidatePath("/");
  return { ok: true, id: record!.id };
}

export async function updateShowcaseItem(id: string, input: unknown) {
  const session = await requireAdmin();
  const parsed = showcaseItemSchema.partial().safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  await db.update(showcaseItems).set(parsed.data).where(eq(showcaseItems.id, id));
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "showcase.update", entityType: "showcase_item", entityId: id });
  revalidatePath("/");
  return { ok: true };
}

export async function archiveShowcaseItem(id: string) {
  const session = await requireAdmin();
  await db.update(showcaseItems).set({ state: "archived" }).where(eq(showcaseItems.id, id));
  await db.insert(auditLogs).values({ adminUserId: session.adminId, action: "showcase.archive", entityType: "showcase_item", entityId: id });
  revalidatePath("/");
  return { ok: true };
}
