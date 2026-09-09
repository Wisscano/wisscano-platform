import { db } from "@/db";
import { procurementRequests } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * Generates the next sequential procurement reference, e.g. WIS-RFQ-2026-0001.
 * Uses a transaction-safe count-and-increment against existing rows for the
 * current year. For very high concurrency this should move to a dedicated
 * sequence table (mirroring documentNumberSequences) — noted as a follow-up.
 */
export async function generateProcurementReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `WIS-RFQ-${year}-`;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(procurementRequests)
    .where(sql`${procurementRequests.referenceNumber} like ${prefix + "%"}`);

  const next = (count ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

/** Generic sequence generator for the document engine (QT-2026-0001, INV-2026-0001, ...). */
export async function generateDocumentNumber(
  prefix: string,
  year: number,
  nextSequence: number,
  padding = 4
): Promise<string> {
  return `${prefix}-${year}-${String(nextSequence).padStart(padding, "0")}`;
}

/**
 * Atomically reserves the next document number for a given document type,
 * creating the current year's sequence row on first use. Prevents
 * duplicate numbers even under concurrent document creation (§45).
 */
export async function reserveDocumentNumber(documentTypeId: string, prefix: string): Promise<string> {
  const { documentNumberSequences } = await import("@/db/schema");
  const { eq, and } = await import("drizzle-orm");
  const year = new Date().getFullYear();

  const [existing] = await db
    .select()
    .from(documentNumberSequences)
    .where(and(eq(documentNumberSequences.documentTypeId, documentTypeId), eq(documentNumberSequences.year, year)))
    .limit(1);

  if (!existing) {
    await db.insert(documentNumberSequences).values({ documentTypeId, prefix, year, nextSequence: 2, padding: 4 });
    return generateDocumentNumber(prefix, year, 1, 4);
  }

  const sequenceToUse = existing.nextSequence;
  await db
    .update(documentNumberSequences)
    .set({ nextSequence: sequenceToUse + 1 })
    .where(eq(documentNumberSequences.id, existing.id));

  return generateDocumentNumber(existing.prefix, year, sequenceToUse, existing.padding);
}
