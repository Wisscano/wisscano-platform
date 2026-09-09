import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs, adminUsers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function AdminAuditLogPage() {
  await requireAdmin("super_admin");
  const rows = await db
    .select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, createdAt: auditLogs.createdAt, adminName: adminUsers.name })
    .from(auditLogs)
    .leftJoin(adminUsers, eq(auditLogs.adminUserId, adminUsers.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl">Audit Log</h1>
      <p className="font-body text-[13.5px] text-wc-textSoft mt-1.5">Every admin mutation, written automatically by each server action (§17).</p>
      <table className="w-full border-collapse mt-6">
        <thead><tr className="border-b border-wc-line">{["When", "Admin", "Action", "Entity"].map((h) => <th key={h} className="text-left font-mono text-[11px] text-wc-textMute font-normal py-2 pr-4">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-wc-line/60">
              <td className="py-2.5 pr-4 font-mono text-xs text-wc-textMute">{new Date(r.createdAt).toLocaleString()}</td>
              <td className="py-2.5 pr-4 font-body text-[13.5px]">{r.adminName ?? "—"}</td>
              <td className="py-2.5 pr-4 font-mono text-xs text-wc-cyan">{r.action}</td>
              <td className="py-2.5 font-body text-[13px] text-wc-textSoft">{r.entityType} {r.entityId?.slice(0, 8)}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={4} className="py-4 font-body text-[13.5px] text-wc-textMute">No admin activity recorded yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
