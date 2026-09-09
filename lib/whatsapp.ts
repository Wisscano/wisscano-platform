/**
 * WHATSAPP INTEGRATION ABSTRACTION (§12 / §14 of master spec).
 *
 * Today this only builds a wa.me deep-link — the request has ALREADY been
 * persisted to Neon by the time this runs, so a failed/abandoned WhatsApp
 * handoff never loses data. When ready to upgrade to the WhatsApp Business
 * / Meta Cloud API (server-initiated messages instead of a user-clicked
 * link), implement `WhatsAppProvider` below and swap it in — nothing
 * upstream (server actions, UI) needs to change.
 */

export interface WhatsAppMessagePayload {
  referenceNumber: string;
  customerName: string;
  organization?: string;
  countryCode?: string;
  deliveryLocation?: string;
  selectedContextLabel?: string;
  requirementText?: string;
  items: { description: string; quantity?: string }[];
  attachmentFilenames: string[];
}

export interface WhatsAppProvider {
  send(payload: WhatsAppMessagePayload): Promise<{ ok: boolean; deepLink?: string; error?: string }>;
}

function buildMessageBody(p: WhatsAppMessagePayload): string {
  const lines = [
    "WISSCANO TECHNOLOGIES — PROCUREMENT REQUEST",
    "",
    `Reference: ${p.referenceNumber}`,
    "",
    `Customer: ${p.customerName}`,
    p.organization ? `Company: ${p.organization}` : null,
    p.countryCode ? `Country: ${p.countryCode}` : null,
    p.deliveryLocation ? `Location: ${p.deliveryLocation}` : null,
    "",
    p.selectedContextLabel ? `Context: ${p.selectedContextLabel}` : null,
    p.requirementText ? `Request: ${p.requirementText}` : null,
    "",
    ...(p.items.length
      ? ["Requirement items:", ...p.items.map((i) => `- ${i.description}${i.quantity ? ` (qty: ${i.quantity})` : ""}`)]
      : []),
    "",
    p.attachmentFilenames.length ? `Attachments: ${p.attachmentFilenames.join(", ")}` : null,
    "",
    "Submitted via: wisscano.co.ke",
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

/** Current default provider: deep-link handoff, no server-side send capability. */
class DeepLinkWhatsAppProvider implements WhatsAppProvider {
  constructor(private readonly businessNumber: string) {}

  async send(payload: WhatsAppMessagePayload) {
    const text = buildMessageBody(payload);
    const deepLink = `https://wa.me/${this.businessNumber}?text=${encodeURIComponent(text)}`;
    return { ok: true, deepLink };
  }
}

/**
 * Stub for the future WhatsApp Business / Meta Cloud API adapter.
 * Requires WHATSAPP_CLOUD_API_TOKEN + WHATSAPP_CLOUD_API_PHONE_ID.
 * Intentionally unimplemented — wire this up once those credentials exist.
 */
class CloudApiWhatsAppProvider implements WhatsAppProvider {
  async send(_payload: WhatsAppMessagePayload) {
    return { ok: false, error: "CloudApiWhatsAppProvider not implemented yet — set WHATSAPP_CLOUD_API_TOKEN and complete lib/whatsapp.ts" };
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  const businessNumber = process.env.WHATSAPP_BUSINESS_NUMBER || "254119834490";
  if (process.env.WHATSAPP_CLOUD_API_TOKEN) {
    return new CloudApiWhatsAppProvider();
  }
  return new DeepLinkWhatsAppProvider(businessNumber);
}
