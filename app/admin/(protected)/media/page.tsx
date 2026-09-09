import Image from "next/image";
import { db } from "@/db";
import { media } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { desc } from "drizzle-orm";

const STATUS_STYLE: Record<string, string> = {
  clean: "text-wc-cyan", pending: "text-wc-textMute", scanning: "text-yellow-400",
  infected: "text-red-400", error: "text-red-400", rejected: "text-red-400",
};

export default async function AdminMediaPage() {
  await requireAdmin();
  const files = await db.select().from(media).orderBy(desc(media.createdAt)).limit(100);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl">Media Library</h1>
      <p className="font-body text-[13.5px] text-wc-textSoft mt-1.5">
        Every uploaded logo, showcase image and procurement attachment lives here first (§30/§9 storage).
        Files are quarantined and security-screened before they become usable — see status below.
      </p>

      <div className="grid gap-4 mt-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {files.map((f) => (
          <div key={f.id} className="border border-wc-line rounded-md overflow-hidden bg-wc-panel">
            {f.scanStatus === "clean" && f.mimeType.startsWith("image/") ? (
              <div className="relative w-full h-[110px]"><Image src={f.url} alt={f.altText ?? f.filename} fill className="object-cover" /></div>
            ) : (
              <div className="h-[110px] flex items-center justify-center font-mono text-[11px] text-wc-textMute text-center px-2">
                {f.scanStatus === "clean" ? f.mimeType : "Quarantined — not previewable"}
              </div>
            )}
            <div className="p-2.5">
              <p className="font-body text-[12px] text-wc-text truncate">{f.filename}</p>
              <p className="font-mono text-[10.5px] text-wc-textMute mt-0.5">{(f.sizeBytes / 1024).toFixed(0)} KB</p>
              <p className={`font-mono text-[10.5px] mt-1 ${STATUS_STYLE[f.scanStatus] ?? ""}`}>
                {f.scanStatus}{f.scanProvider ? ` · ${f.scanProvider}` : ""}
              </p>
            </div>
          </div>
        ))}
        {files.length === 0 && <p className="font-body text-[13.5px] text-wc-textMute">No uploads yet.</p>}
      </div>
    </div>
  );
}
