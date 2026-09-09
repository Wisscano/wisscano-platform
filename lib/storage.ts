import { put, del } from "@vercel/blob";
import { db } from "@/db";
import { media, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scanFile } from "./security-scan";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB — covers scanned tenders/BOMs
const MAX_ATTACHMENTS_PER_REQUEST = 10;

export class UnsupportedFileError extends Error {}
export class FileTooLargeError extends Error {}
export class FileRejectedError extends Error {}

export interface UploadOutcome {
  ok: boolean;
  mediaId?: string;
  filename?: string;
  url?: string;
  error?: string;
  quarantined?: boolean;
}

/**
 * Object-storage + MANDATORY SECURITY GATE (§9 storage architecture, §12-16
 * malware screening). Sequence, non-negotiable:
 *
 *   validate (type/size/name) -> store to quarantine path -> scan ->
 *     clean   -> promote (mark usable, keep blob)
 *     unsafe  -> delete blob immediately, mark media row rejected
 *
 * The returned media row's `url` must NEVER be surfaced to a caller (or
 * included in a WhatsApp message) unless scanStatus === "clean". Callers
 * (actions/upload.ts, actions/procurement.ts) enforce this too — this is
 * defense in depth, not the only check.
 */
export async function uploadFile(
  file: File,
  opts: { uploadedByAdminId?: string; altText?: string } = {}
): Promise<UploadOutcome> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new UnsupportedFileError(`File type not allowed: ${file.type}`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new FileTooLargeError(`File exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit`);
  }

  const sanitizedName = sanitizeFilename(file.name);
  // Randomized, non-guessable key under a dedicated quarantine prefix — never a directly
  // executable web path, never derived from the user-supplied filename alone (§13).
  const quarantineKey = `quarantine/${crypto.randomUUID()}-${sanitizedName}`;

  const bytes = new Uint8Array(await file.arrayBuffer());

  const blob = await put(quarantineKey, file, { access: "public", addRandomSuffix: false });

  // Media row is created in "pending"/quarantined state — it is NOT usable yet.
  const [record] = await db
    .insert(media)
    .values({
      filename: file.name,
      storageKey: blob.pathname,
      url: blob.url,
      mimeType: file.type,
      sizeBytes: file.size,
      altText: opts.altText,
      uploadedByAdminId: opts.uploadedByAdminId,
      scanStatus: "scanning",
      quarantined: true,
    })
    .returning();

  if (!record) return { ok: false, error: "Could not create media record" };

  const result = await scanFile(bytes, file.type, file.name);

  await db.insert(auditLogs).values({
    adminUserId: opts.uploadedByAdminId,
    action: "media.scan",
    entityType: "media",
    entityId: record.id,
    metadata: { verdict: result.verdict, provider: result.provider, details: result.details },
  });

  if (result.verdict !== "clean") {
    // Fail closed: delete the blob immediately, mark the row, never return a usable URL.
    await deleteFile(blob.pathname).catch(() => {});
    await db
      .update(media)
      .set({ scanStatus: result.verdict, scanProvider: result.provider, scanDetails: result.details, scannedAt: new Date(), quarantined: true })
      .where(eq(media.id, record.id));

    if (result.verdict === "error") {
      throw new FileRejectedError("We couldn't verify this file is safe right now. Please try again shortly.");
    }
    throw new FileRejectedError("This file couldn't be accepted — it failed our security screening.");
  }

  await db
    .update(media)
    .set({ scanStatus: "clean", scanProvider: result.provider, scanDetails: result.details, scannedAt: new Date(), quarantined: false })
    .where(eq(media.id, record.id));

  return { ok: true, mediaId: record.id, filename: record.filename, url: record.url };
}

export async function deleteFile(storageKey: string) {
  await del(storageKey);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export { MAX_ATTACHMENTS_PER_REQUEST };
