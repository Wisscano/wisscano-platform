/**
 * Untrusted-text handling (§15). Every piece of free text a visitor
 * submits — requirement text, assisted-procurement answers — is stripped
 * of HTML/script markup and length-capped server-side before it is
 * stored or forwarded to WhatsApp, regardless of what the client sent.
 * This is defense in depth on top of Zod's length limits: Zod rejects
 * input that's too long, this strips dangerous markup from what remains.
 */
export function sanitizePlainText(input: string, maxLength = 20000): string {
  const stripped = input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "") // strip all remaining tags
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, ""); // inline event handlers

  return stripped.slice(0, maxLength).trim();
}
