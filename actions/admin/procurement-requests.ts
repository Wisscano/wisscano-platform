"use server";

import { db } from "@/db";
import {
  procurementRequests,
  procurementRequestItems,
  procurementRequestAttachments,
  requestStatusHistory,
  customers,
  media,
} from "@/db/schema";
import { updateRequestStatusSchema } from "@/validation/procurement";
import { requireAdmin } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/** Dashboard/list view — most recent first, with customer name joined in. */
export async function listProcurementRequests(statusFilter?: string) {
  await requireAdmin();

  const rows = await db
    .select({
      id: procurementRequests.id,
      referenceNumber: procurementRequests.referenceNumber,
      status: procurementRequests.status,
      procurementType: procurementRequests.procurementType,
      selectedContextLabel: procurementRequests.selectedContextLabel,
      createdAt: procurementRequests.createdAt,
      customerName: customers.name,
      customerOrganization: customers.organization,
    })
    .from(procurementRequests)
    .leftJoin(customers, eq(procurementRequests.customerId, customers.id))
    .orderBy(desc(procurementRequests.createdAt));

  return statusFilter ? rows.filter((r) => r.status === statusFilter) : rows;
}

/** Full detail view for the admin request page — items, attachments, history, customer. */
export async function getProcurementRequestDetail(id: string) {
  await requireAdmin();

  const [request] = await db.select().from(procurementRequests).where(eq(procurementRequests.id, id)).limit(1);
  if (!request) return null;

  const [customer] = await db.select().from(customers).where(eq(customers.id, request.customerId)).limit(1);
  const items = await db.select().from(procurementRequestItems).where(eq(procurementRequestItems.requestId, id)).orderBy(procurementRequestItems.displayOrder);

  const attachmentRows = await db
    .select({ id: procurementRequestAttachments.id, media })
    .from(procurementRequestAttachments)
    .leftJoin(media, eq(procurementRequestAttachments.mediaId, media.id))
    .where(eq(procurementRequestAttachments.requestId, id));

  const history = await db
    .select()
    .from(requestStatusHistory)
    .where(eq(requestStatusHistory.requestId, id))
    .orderBy(desc(requestStatusHistory.createdAt));

  return { request, customer, items, attachments: attachmentRows, history };
}

/** Status transition — the primary operational action in the Admin Centre (§9). */
export async function updateProcurementRequestStatus(input: unknown) {
  const session = await requireAdmin();
  const parsed = updateRequestStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const { requestId, status, note } = parsed.data;

  const [current] = await db.select({ status: procurementRequests.status }).from(procurementRequests).where(eq(procurementRequests.id, requestId)).limit(1);
  if (!current) return { ok: false, errors: { _form: ["Request not found"] } };

  await db.update(procurementRequests).set({ status, updatedAt: new Date() }).where(eq(procurementRequests.id, requestId));

  await db.insert(requestStatusHistory).values({
    requestId,
    fromStatus: current.status,
    toStatus: status,
    changedByAdminId: session.adminId,
    note,
  });

  revalidatePath(`/admin/procurement-requests/${requestId}`);
  revalidatePath("/admin/procurement-requests");
  return { ok: true };
}

export async function assignProcurementRequest(requestId: string, adminId: string) {
  const session = await requireAdmin();
  await db.update(procurementRequests).set({ assignedAdminId: adminId }).where(eq(procurementRequests.id, requestId));
  await db.insert(requestStatusHistory).values({
    requestId,
    toStatus: (await db.select({ s: procurementRequests.status }).from(procurementRequests).where(eq(procurementRequests.id, requestId)).limit(1))[0]!.s,
    changedByAdminId: session.adminId,
    note: `Assigned to admin ${adminId}`,
  });
  revalidatePath(`/admin/procurement-requests/${requestId}`);
  return { ok: true };
}

export async function addInternalNote(requestId: string, note: string) {
  await requireAdmin();
  await db.update(procurementRequests).set({ internalNotes: note }).where(eq(procurementRequests.id, requestId));
  revalidatePath(`/admin/procurement-requests/${requestId}`);
  return { ok: true };
}
