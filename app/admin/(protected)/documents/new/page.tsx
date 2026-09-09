import { db } from "@/db";
import { documentTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getRequestPrefillForDocument } from "@/actions/admin/documents";
import { DocumentForm } from "@/components/admin/document-form";

export default async function NewDocumentPage({ searchParams }: { searchParams: Promise<{ requestId?: string }> }) {
  await requireAdmin();
  const { requestId } = await searchParams;

  const [types, prefill] = await Promise.all([
    db.select().from(documentTypes).where(eq(documentTypes.active, true)),
    requestId ? getRequestPrefillForDocument(requestId) : Promise.resolve(null),
  ]);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl">New document</h1>
      <div className="mt-6">
        {types.length === 0 ? (
          <p className="font-body text-[13.5px] text-wc-textMute">No active document types. Create one under Document Types first.</p>
        ) : (
          <DocumentForm documentTypes={types} prefill={prefill} />
        )}
      </div>
    </div>
  );
}
