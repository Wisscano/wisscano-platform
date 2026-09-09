import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { suppliers } from "@/db/schema";

/** §11: internal-only sourcing data, never exposed on the public site. List-only for MVP; full CRUD follows the brand/category pattern. */
export default async function AdminSuppliersPage() {
  await requireAdmin();
  const rows = await db.select().from(suppliers);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl">Suppliers</h1>
      <p className="font-body text-[13.5px] text-wc-textSoft mt-1.5">Internal sourcing partners — feeds Supplier Quotations on a procurement request. Never shown publicly.</p>
      <table className="w-full border-collapse mt-6">
        <thead><tr className="border-b border-wc-line">{["Name", "Contact", "Email", "Brands supplied", "Active"].map((h) => <th key={h} className="text-left font-mono text-[11px] text-wc-textMute font-normal py-2 pr-4">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-b border-wc-line/60">
              <td className="py-2.5 pr-4 font-body text-[13.5px]">{s.name}</td>
              <td className="py-2.5 pr-4 font-body text-[13.5px] text-wc-textSoft">{s.contactName ?? "—"}</td>
              <td className="py-2.5 pr-4 font-mono text-xs">{s.email ?? "—"}</td>
              <td className="py-2.5 pr-4 font-body text-[13px] text-wc-textSoft">{(s.brandsSupplied ?? []).join(", ") || "—"}</td>
              <td className="py-2.5 font-mono text-xs text-wc-cyan">{s.active ? "yes" : "no"}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={5} className="py-4 font-body text-[13.5px] text-wc-textMute">No suppliers added yet. Add these via drizzle studio or extend this page with a create form using the Brand form pattern.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
