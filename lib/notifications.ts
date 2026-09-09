import { db } from "@/db";
import { notificationLog } from "@/db/schema";
import { getWhatsAppProvider, type WhatsAppMessagePayload } from "./whatsapp";

export type NotificationChannel = "whatsapp" | "email" | "sms" | "crm";

export interface NotificationProvider {
  channel: NotificationChannel;
  send(requestId: string, payload: WhatsAppMessagePayload): Promise<{ ok: boolean; error?: string; meta?: Record<string, unknown> }>;
}

/**
 * NOTIFICATION SERVICE (§14). Central place a procurement submission fans
 * out to every configured channel. Each send attempt — success or failure
 * — is logged to notification_log so nothing is silently lost. Adding a
 * new channel means writing one NotificationProvider and registering it
 * in `getActiveProviders`, not touching the procurement server action.
 */
class WhatsAppNotificationProvider implements NotificationProvider {
  channel: NotificationChannel = "whatsapp";
  async send(_requestId: string, payload: WhatsAppMessagePayload) {
    const provider = getWhatsAppProvider();
    const result = await provider.send(payload);
    return { ok: result.ok, error: result.error, meta: { deepLink: result.deepLink } };
  }
}

/** Placeholder — implement once RESEND_API_KEY / EMAIL_FROM are configured. */
class EmailNotificationProvider implements NotificationProvider {
  channel: NotificationChannel = "email";
  async send(_requestId: string, _payload: WhatsAppMessagePayload) {
    if (!process.env.RESEND_API_KEY) {
      return { ok: false, error: "Email provider not configured (RESEND_API_KEY missing) — skipped" };
    }
    return { ok: false, error: "EmailNotificationProvider not implemented yet" };
  }
}

function getActiveProviders(): NotificationProvider[] {
  const providers: NotificationProvider[] = [new WhatsAppNotificationProvider()];
  if (process.env.RESEND_API_KEY) providers.push(new EmailNotificationProvider());
  return providers;
}

/**
 * Dispatches a procurement submission across all active channels and
 * returns the WhatsApp deep link (if available) so the UI can hand the
 * customer off immediately. Never throws — a failed channel is logged,
 * not fatal, because the request is already safely persisted.
 */
export async function notifyProcurementSubmission(requestId: string, payload: WhatsAppMessagePayload) {
  let whatsappDeepLink: string | undefined;

  for (const provider of getActiveProviders()) {
    try {
      const result = await provider.send(requestId, payload);
      await db.insert(notificationLog).values({
        requestId,
        channel: provider.channel,
        status: result.ok ? "sent" : "failed",
        payload: payload as unknown as Record<string, unknown>,
        errorMessage: result.error,
      });
      if (provider.channel === "whatsapp" && result.meta?.deepLink) {
        whatsappDeepLink = result.meta.deepLink as string;
      }
    } catch (err) {
      await db.insert(notificationLog).values({
        requestId,
        channel: provider.channel,
        status: "failed",
        payload: payload as unknown as Record<string, unknown>,
        errorMessage: err instanceof Error ? err.message : "Unknown notification error",
      });
    }
  }

  return { whatsappDeepLink };
}
