import { notFound } from "next/navigation";
import { db } from "@/db";
import { highlights } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { HighlightForm } from "@/components/admin/highlight-form";

export default async function EditHighlightPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [item] = await db.select().from(highlights).where(eq(highlights.id, id)).limit(1);
  if (!item) notFound();
  return (
    <div>
      <h1 className="font-display font-bold text-2xl">Edit highlight</h1>
      <div className="mt-6">
        <HighlightForm initial={{ ...item, startDate: item.startDate?.toISOString() ?? null, endDate: item.endDate?.toISOString() ?? null }} />
      </div>
    </div>
  );
}
