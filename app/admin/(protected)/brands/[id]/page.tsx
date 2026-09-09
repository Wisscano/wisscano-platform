import { notFound } from "next/navigation";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { BrandForm } from "@/components/admin/brand-form";

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [brand] = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
  if (!brand) notFound();

  return (
    <div>
      <h1 className="font-display font-bold text-2xl">Edit brand</h1>
      <div className="mt-6"><BrandForm initial={brand} /></div>
    </div>
  );
}
