import { notFound } from "next/navigation";
import { db } from "@/db";
import { showcaseItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { ShowcaseForm } from "@/components/admin/showcase-form";

export default async function EditShowcasePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [item] = await db.select().from(showcaseItems).where(eq(showcaseItems.id, id)).limit(1);
  if (!item) notFound();
  return <div><h1 className="font-display font-bold text-2xl">Edit showcase item</h1><div className="mt-6"><ShowcaseForm initial={{ ...item, semanticTags: item.semanticTags ?? undefined }} /></div></div>;
}
