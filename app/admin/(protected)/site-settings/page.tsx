import { getSettingsForAdmin } from "@/actions/admin/site-settings";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { db } from "@/db";
import { media } from "@/db/schema";
import { inArray } from "drizzle-orm";

export default async function AdminSiteSettingsPage() {
  const settings = await getSettingsForAdmin();

  let mediaUrls: { logo?: string | null; favicon?: string | null; og?: string | null } = {};
  if (settings) {
    const ids = [settings.logoMediaId, settings.faviconMediaId, settings.ogImageMediaId].filter((v): v is string => Boolean(v));
    if (ids.length) {
      const rows = await db.select({ id: media.id, url: media.url }).from(media).where(inArray(media.id, ids));
      const byId = new Map(rows.map((r) => [r.id, r.url]));
      mediaUrls = {
        logo: settings.logoMediaId ? byId.get(settings.logoMediaId) : null,
        favicon: settings.faviconMediaId ? byId.get(settings.faviconMediaId) : null,
        og: settings.ogImageMediaId ? byId.get(settings.ogImageMediaId) : null,
      };
    }
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl">Site Settings</h1>
      <p className="font-body text-[13.5px] text-wc-textSoft mt-1.5">Global configuration — nothing here is hard-coded into components.</p>
      <div className="mt-6">
        {settings ? <SiteSettingsForm initial={settings} mediaUrls={mediaUrls} /> : <p className="font-body text-[13.5px] text-wc-textMute">Run the seed script to create the initial settings row.</p>}
      </div>
    </div>
  );
}
