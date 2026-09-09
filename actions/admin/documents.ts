"use server";

import { db } from "@/db";
import { documents, documentLineItems, documentTypes, customers, procurementRequests, procurementRequestItems, auditLogs } from "@/db/schema";
import { documentSchema } from "@/validation/documents";
import { requireAdmin } from "@/lib/auth";
import { reserveDocumentNumber } from "@/lib/reference-number";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function computeTotals(lineItems: { quantity: number; unitPriceMinor: number; discountMinor: number; taxRateBasisPoints: number }[]) {
  let subtotalMinor = 0, taxMinor = 0, discountMinor = 0;
  for (const li of lineItems) {
    const lineSubtotal = li.quantity * li.unitPriceMinor - li.discountMinor;
    subtotalMinor += li.quantity * li.unitPriceMinor;
    discountMinor += li.discountMinor;
    taxMinor += Math.round((lineSubtotal * li.taxRateBasisPoints) / 10000);
  }
  return { subtotalMinor, taxMinor, discountMinor, totalMinor: subtotalMinor - discountMinor + taxMinor };
}

export async function listDocuments() {
  await requireAdmin();
  return db
    .select({
      id: documents.id, documentNumber: documents.documentNumber, status: documents.status,
      totalMinor: documents.totalMinor, currency: documents.currency, createdAt: documents.createdAt,
      typeName: documentTypes.name, customerName: customers.name,
    })
    .from(documents)
    .leftJoin(documentTypes, eq(documents.documentTypeId, documentTypes.id))
    .leftJoin(customers, eq(documents.customerId, customers.id))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentDetail(id: string) {
  await requireAdmin();
  const [document] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!document) return null;
  const lineItems = await db.select().from(documentLineItems).where(eq(documentLineItems.documentId, id)).orderBy(documentLineItems.displayOrder);
  const [type] = await db.select().from(documentTypes).where(eq(documentTypes.id, document.documentTypeId)).limit(1);
  let customer = null;
  if (document.customerId) {
    [customer] = await db.select().from(customers).where(eq(customers.id, document.customerId)).limit(1);
  }
  return { document, lineItems, type, customer };
}

/**
 * Pre-populates a new-document draft from an existing procurement request
 * (§48: "Procurement Request → Create Quotation"). Returns plain data for
 * the client form to seed itself with — does not write anything yet.
 */
export async function getRequestPrefillForDocument(requestId: string) {
  await requireAdmin();
  const [request] = await db.select().from(procurementRequests).where(eq(procurementRequests.id, requestId)).limit(1);
  if (!request) return null;
  const [customer] = await db.select().from(customers).where(eq(customers.id, request.customerId)).limit(1);
  const items = await db.select().from(procurementRequestItems).where(eq(procurementRequestItems.requestId, requestId));

  return {
    requestId: request.id,
    referenceNumber: request.referenceNumber,
    customerId: customer?.id,
    customerName: customer?.name,
    customerEmail: customer?.email,
    lineItems: items.length
      ? items.map((i) => ({ description: i.description, quantity: Number(i.quantity) || 1, unitPriceMinor: 0, discountMinor: 0, taxRateBasisPoints: 1600 }))
      : [{ description: request.requirementText?.slice(0, 500) || "Procurement requirement", quantity: 1, unitPriceMinor: 0, discountMinor: 0, taxRateBasisPoints: 1600 }],
  };
}

export async function createDocument(input: unknown) {
  const session = await requireAdmin();
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;

  const [type] = await db.select().from(documentTypes).where(eq(documentTypes.id, data.documentTypeId)).limit(1);
  if (!type) return { ok: false, errors: { documentTypeId: ["Document type not found"] } };

  const documentNumber = await reserveDocumentNumber(type.id, type.code);
  const totals = computeTotals(data.lineItems);

  // Resolve/create a customer record if only name/email were provided (document not linked to an existing customer)
  let customerId = data.customerId;
  if (!customerId && data.customerEmail) {
    const [existing] = await db.select().from(customers).where(eq(customers.email, data.customerEmail.toLowerCase())).limit(1);
    customerId = existing?.id ?? (await db.insert(customers).values({ name: data.customerName || "Unknown", email: data.customerEmail.toLowerCase() }).returning({ id: customers.id }))[0]?.id;
  }

  const [document] = await db
    .insert(documents)
    .values({
      documentTypeId: data.documentTypeId,
      documentNumber,
      requestId: data.requestId,
      customerId,
      currency: data.currency,
      status: data.status,
      subtotalMinor: totals.subtotalMinor,
      taxMinor: totals.taxMinor,
      discountMinor: totals.discountMinor,
      totalMinor: totals.totalMinor,
      paymentTerms: data.paymentTerms,
      deliveryTerms: data.deliveryTerms,
      notes: data.notes,
      validUntil: data.validUntil,
      createdByAdminId: session.adminId,
    })
    .returning();

  if (!document) return { ok: false, errors: { _form: ["Could not create document"] } };

  await db.insert(documentLineItems).values(
    data.lineItems.map((li, i) => ({
      documentId: document.id,
      description: li.description,
      quantity: li.quantity,
      unitPriceMinor: li.unitPriceMinor,
      discountMinor: li.discountMinor,
      taxRateBasisPoints: li.taxRateBasisPoints,
      displayOrder: i,
    }))
  );

  await db.insert(auditLogs).values({
    adminUserId: session.adminId, action: "document.create", entityType: "document", entityId: document.id,
    metadata: { documentNumber, totalMinor: totals.totalMinor },
  });

  revalidatePath("/admin/documents");
  return { ok: true, id: document.id, documentNumber };
}
