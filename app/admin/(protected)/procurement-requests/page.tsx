import Link from "next/link";
import { listProcurementRequests } from "@/actions/admin/procurement-requests";

export default async function AdminProcurementRequestsPage() {
  const requests = await listProcurementRequests();

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl">Procurement Requests</h1>
      </div>

      {requests.length === 0 ? (
        <p className="font-body text-[13.5px] text-wc-textSoft mt-6">No procurement requests yet.</p>
      ) : (
        <div className="mt-6 border border-wc-line rounded overflow-hidden">
          <table className="w-full text-[13.5px] font-body">
            <thead>
              <tr className="bg-wc-bg border-b border-wc-line text-left">
                <th className="p-3 font-mono text-xs text-wc-textMute">Reference</th>
                <th className="p-3 font-mono text-xs text-wc-textMute">Customer</th>
                <th className="p-3 font-mono text-xs text-wc-textMute">Type</th>
                <th className="p-3 font-mono text-xs text-wc-textMute">Status</th>
                <th className="p-3 font-mono text-xs text-wc-textMute">Created</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-wc-line last:border-b-0 hover:bg-wc-bg">
                  <td className="p-3">
                    <Link href={`/admin/procurement-requests/${r.id}`} className="font-mono text-wc-cyan no-underline">
                      {r.referenceNumber}
                    </Link>
                  </td>
                  <td className="p-3">
                    {r.customerName ?? "—"}
                    {r.customerOrganization && (
                      <span className="text-wc-textSoft"> ({r.customerOrganization})</span>
                    )}
                  </td>
                  <td className="p-3 text-wc-textSoft">{r.procurementType?.replace("_", " ")}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-xs border border-wc-line">{r.status}</span>
                  </td>
                  <td className="p-3 text-wc-textMute font-mono text-xs">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}