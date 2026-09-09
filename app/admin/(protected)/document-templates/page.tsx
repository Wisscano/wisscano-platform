import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { documentTemplates, documentTypes } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminDocumentTemplatesPage() {
  await requireAdmin();
  const rows = await db
    .select({ id: documentTemplates.id, name: documentTemplates.name, active: documentTemplates.active, typeName: documentTypes.name })
    .from(documentTemplates)
    .leftJoin(documentTypes, eq(documentTemplates.documentTypeId, documentTypes.id));

  return (
    <div>
      <h1 className="font-display font-bold text-2xl">Document Templates</h1>
      <p className="font-body text-[13.5px] text-wc-textSoft mt-1.5">Reusable layout/branding config per document type (§44).</p>
      <table className="w-full border-collapse mt-6">
        <thead><tr className="border-b border-wc-line">{["Template", "Document type", "Active"].map((h) => <th key={h} className="text-left font-mono text-[11px] text-wc-textMute font-normal py-2 pr-4">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-wc-line/60"><td className="py-2.5 pr-4 font-body text-[13.5px]">{t.name}</td><td className="py-2.5 pr-4 font-body text-[13.5px] text-wc-textSoft">{t.typeName}</td><td className="py-2.5 font-mono text-xs">{t.active ? "yes" : "no"}</td></tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={3} className="py-4 font-body text-[13.5px] text-wc-textMute">No templates yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
