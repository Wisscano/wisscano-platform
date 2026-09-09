import { notFound } from "next/navigation";
import { db } from "@/db";
import { procurementCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { CategoryForm } from "@/components/admin/category-form";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [category] = await db.select().from(procurementCategories).where(eq(procurementCategories.id, id)).limit(1);
  if (!category) notFound();
  return <div><h1 className="font-display font-bold text-2xl">Edit category</h1><div className="mt-6"><CategoryForm initial={category} /></div></div>;
}
