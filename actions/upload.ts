"use server";

import { uploadFile, UnsupportedFileError, FileTooLargeError, FileRejectedError } from "@/lib/storage";
import { getAdminSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export interface UploadResult {
  ok: boolean;
  mediaId?: string;
  filename?: string;
  url?: string;
  error?: string;
}

/**
 * Public-facing upload action used by the Request Bar for procurement
 * attachments (images, BOMs, tenders). Every file passes through the
 * mandatory malware-screening gate in lib/storage.ts before this ever
 * returns a usable mediaId — a rejected/unsafe file never reaches this
 * point with `ok: true` (§12-16).
 */
export async function uploadProcurementAttachment(formData: FormData): Promise<UploadResult> {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = await checkRateLimit(`upload:${ip}`, 20, 60_000);
  if (!limited.ok) return { ok: false, error: "Too many uploads — please wait a moment and try again." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file provided" };

  try {
    const outcome = await uploadFile(file);
    if (!outcome.ok) return { ok: false, error: outcome.error ?? "Upload failed." };
    return { ok: true, mediaId: outcome.mediaId, filename: outcome.filename, url: outcome.url };
  } catch (err) {
    if (err instanceof UnsupportedFileError) return { ok: false, error: "That file type isn't supported. Use PDF, Word, Excel, CSV or an image." };
    if (err instanceof FileTooLargeError) return { ok: false, error: "File is too large (20MB limit)." };
    if (err instanceof FileRejectedError) return { ok: false, error: err.message };
    return { ok: false, error: "Upload failed. Please try again." };
  }
}

/** Admin-only variant — used for brand logos, showcase imagery, etc. Same mandatory scan gate applies. */
export async function uploadAdminMedia(formData: FormData): Promise<UploadResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Not authenticated" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file provided" };

  try {
    const outcome = await uploadFile(file, { uploadedByAdminId: session.adminId });
    if (!outcome.ok) return { ok: false, error: outcome.error ?? "Upload failed." };
    return { ok: true, mediaId: outcome.mediaId, filename: outcome.filename, url: outcome.url };
  } catch (err) {
    if (err instanceof UnsupportedFileError) return { ok: false, error: "Unsupported file type." };
    if (err instanceof FileTooLargeError) return { ok: false, error: "File exceeds 20MB limit." };
    if (err instanceof FileRejectedError) return { ok: false, error: err.message };
    return { ok: false, error: "Upload failed." };
  }
}
