import { notFound } from "next/navigation";
import { db } from "@/db";
import { documentTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { DocumentTypeForm } from "@/components/admin/document-type-form";

export default async function EditDocumentTypePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [type] = await db.select().from(documentTypes).where(eq(documentTypes.id, id)).limit(1);
  if (!type) notFound();
  return <div><h1 className="font-display font-bold text-2xl">Edit document type</h1><div className="mt-6"><DocumentTypeForm initial={type} /></div></div>;
}
