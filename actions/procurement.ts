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
import { createProcurementRequestSchema, type CreateProcurementRequestInput } from "@/validation/procurement";
import { generateProcurementReference } from "@/lib/reference-number";
import { notifyProcurementSubmission } from "@/lib/notifications";
import { sanitizePlainText } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";
import { eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";

export interface SubmitProcurementResult {
  ok: boolean;
  referenceNumber?: string;
  whatsappDeepLink?: string;
  errors?: Record<string, string[]>;
}

/**
 * THE core procurement action (§5 of the master spec; §11-16 of the final
 * spec). Order of operations is deliberate and non-negotiable:
 *
 *   rate-limit -> validate -> sanitize text -> verify EVERY attachment is
 *   scan-clean -> persist to Neon -> THEN attempt WhatsApp handoff.
 *
 * A request is never handed off to WhatsApp with an attachment that
 * hasn't been confirmed "clean" by the security-scan gate in
 * lib/storage.ts — this check is repeated here (not just trusted from the
 * upload step) as defense in depth, because attachmentMediaIds arrives
 * from the client and could in principle reference any media row.
 */
export async function submitProcurementRequest(
  input: CreateProcurementRequestInput
): Promise<SubmitProcurementResult> {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = await checkRateLimit(`submit:${ip}`, 8, 60_000);
  if (!limited.ok) {
    return { ok: false, errors: { _form: ["Too many requests — please wait a moment and try again."] } };
  }

  const parsed = createProcurementRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;

  // Defense in depth: every referenced attachment must exist and be scan-clean.
  // A single unsafe/unscanned/unknown attachment blocks the ENTIRE submission
  // rather than silently dropping it — the customer needs to know and re-submit.
  if (data.attachmentMediaIds.length) {
    const rows = await db
      .select({ id: media.id, scanStatus: media.scanStatus })
      .from(media)
      .where(inArray(media.id, data.attachmentMediaIds));

    const byId = new Map(rows.map((r) => [r.id, r.scanStatus]));
    const unsafe = data.attachmentMediaIds.filter((id) => byId.get(id) !== "clean");
    if (unsafe.length) {
      return {
        ok: false,
        errors: { attachmentMediaIds: ["One or more attachments could not be verified as safe. Please remove and re-upload them."] },
      };
    }
  }

  const sanitizedRequirementText = data.requirementText ? sanitizePlainText(data.requirementText, 20000) : undefined;
  const sanitizedItems = data.items.map((item) => ({
    ...item,
    description: sanitizePlainText(item.description, 4000),
    preferredAlternatives: item.preferredAlternatives ? sanitizePlainText(item.preferredAlternatives, 1000) : undefined,
  }));
  const sanitizedAssistedAnswers = data.assistedAnswers
    ? {
        outcome: data.assistedAnswers.outcome ? sanitizePlainText(data.assistedAnswers.outcome, 4000) : undefined,
        scale: data.assistedAnswers.scale ? sanitizePlainText(data.assistedAnswers.scale, 1000) : undefined,
        deploymentLocation: data.assistedAnswers.deploymentLocation ? sanitizePlainText(data.assistedAnswers.deploymentLocation, 1000) : undefined,
        timeframe: data.assistedAnswers.timeframe ? sanitizePlainText(data.assistedAnswers.timeframe, 1000) : undefined,
        problem: data.assistedAnswers.problem ? sanitizePlainText(data.assistedAnswers.problem, 4000) : undefined,
      }
    : undefined;

  // Upsert-by-email customer record (kept intentionally simple for MVP —
  // no dedupe-by-phone/fuzzy-match yet; see Phase 7 customer records).
  const [existingCustomer] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, data.customer.email.toLowerCase()))
    .limit(1);

  const customerId = existingCustomer
    ? existingCustomer.id
    : (
        await db
          .insert(customers)
          .values({
            name: sanitizePlainText(data.customer.name, 200),
            organization: data.customer.organization ? sanitizePlainText(data.customer.organization, 200) : undefined,
            email: data.customer.email.toLowerCase(),
            phone: data.customer.phone,
            countryCode: data.customer.countryCode,
            city: data.customer.city,
          })
          .returning({ id: customers.id })
      )[0]!.id;

  const referenceNumber = await generateProcurementReference();

  const [request] = await db
    .insert(procurementRequests)
    .values({
      referenceNumber,
      customerId,
      deliveryLocation: data.deliveryLocation ? sanitizePlainText(data.deliveryLocation, 300) : undefined,
      requirementText: sanitizedRequirementText,
      procurementType: data.procurementType,
      budget: data.budget,
      deliveryTimeframe: data.deliveryTimeframe,
      selectedContextType: data.selectedContext?.type,
      selectedContextId: data.selectedContext?.id,
      selectedContextLabel: data.selectedContext?.label,
      isAssisted: data.isAssisted,
      assistedAnswers: sanitizedAssistedAnswers,
      status: "new",
    })
    .returning();

  if (!request) return { ok: false, errors: { _form: ["Could not save request. Please try again."] } };

  if (sanitizedItems.length) {
    await db.insert(procurementRequestItems).values(
      sanitizedItems.map((item, i) => ({
        requestId: request.id,
        description: item.description,
        categoryId: item.categoryId,
        brandPreference: item.brandPreference,
        knownModel: item.knownModel,
        quantity: item.quantity,
        preferredAlternatives: item.preferredAlternatives,
        displayOrder: i,
      }))
    );
  }

  if (data.attachmentMediaIds.length) {
    await db.insert(procurementRequestAttachments).values(
      data.attachmentMediaIds.map((mediaId) => ({ requestId: request.id, mediaId }))
    );
  }

  await db.insert(requestStatusHistory).values({
    requestId: request.id,
    fromStatus: null,
    toStatus: "new",
    note: "Request submitted by customer",
  });

  // Only scan-clean attachment filenames ever reach the WhatsApp message body —
  // already guaranteed by the gate above, re-selected here rather than trusted from input.
  const attachmentFilenames = data.attachmentMediaIds.length
    ? (await db.select({ filename: media.filename }).from(media).where(inArray(media.id, data.attachmentMediaIds))).map((m) => m.filename)
    : [];

  const { whatsappDeepLink } = await notifyProcurementSubmission(request.id, {
    referenceNumber,
    customerName: data.customer.name,
    organization: data.customer.organization,
    countryCode: data.customer.countryCode,
    deliveryLocation: data.deliveryLocation,
    selectedContextLabel: data.selectedContext?.label,
    requirementText: sanitizedRequirementText,
    items: sanitizedItems.map((i) => ({ description: i.description, quantity: i.quantity })),
    attachmentFilenames,
  });

  return { ok: true, referenceNumber, whatsappDeepLink };
}
