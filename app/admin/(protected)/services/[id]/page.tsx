import { notFound } from "next/navigation";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { ServiceForm } from "@/components/admin/service-form";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  if (!service) notFound();
  return <div><h1 className="font-display font-bold text-2xl">Edit service</h1><div className="mt-6"><ServiceForm initial={service} /></div></div>;
}
