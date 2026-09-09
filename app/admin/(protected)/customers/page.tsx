import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { customers, procurementRequests } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export default async function AdminCustomersPage() {
  await requireAdmin();
  const rows = await db
    .select({
      id: customers.id, name: customers.name, organization: customers.organization,
      email: customers.email, phone: customers.phone, requestCount: sql<number>`count(${procurementRequests.id})::int`,
    })
    .from(customers)
    .leftJoin(procurementRequests, eq(procurementRequests.customerId, customers.id))
    .groupBy(customers.id)
    .orderBy(desc(customers.createdAt));

  return (
    <div>
      <h1 className="font-display font-bold text-2xl">Customers</h1>
      <p className="font-body text-[13.5px] text-wc-textSoft mt-1.5">Created automatically the first time someone submits a procurement request.</p>
      <table className="w-full border-collapse mt-6">
        <thead><tr className="border-b border-wc-line">{["Name", "Organization", "Email", "Phone", "Requests"].map((h) => <th key={h} className="text-left font-mono text-[11px] text-wc-textMute font-normal py-2 pr-4">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-b border-wc-line/60">
              <td className="py-2.5 pr-4 font-body text-[13.5px]">{c.name}</td>
              <td className="py-2.5 pr-4 font-body text-[13.5px] text-wc-textSoft">{c.organization ?? "—"}</td>
              <td className="py-2.5 pr-4 font-mono text-xs">{c.email}</td>
              <td className="py-2.5 pr-4 font-mono text-xs">{c.phone ?? "—"}</td>
              <td className="py-2.5 font-mono text-xs text-wc-cyan">{c.requestCount}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={5} className="py-4 font-body text-[13.5px] text-wc-textMute">No customers yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
