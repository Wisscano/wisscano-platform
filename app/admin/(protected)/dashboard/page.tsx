import Link from "next/link";
import { getDashboardStats } from "@/actions/admin/dashboard";
import { ClipboardList, Tags, PackageSearch, Wrench } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  new: "New", reviewing: "Reviewing", sourcing: "Sourcing",
  quotation_prepared: "Quotation Prepared", awaiting_customer: "Awaiting Customer",
  approved: "Approved", procurement: "Procurement", delivered: "Delivered",
  closed: "Closed", cancelled: "Cancelled",
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="font-display font-bold text-2xl">Dashboard</h1>
      <p className="font-body text-[13.5px] text-wc-textSoft mt-1.5">Overview of procurement activity and site content.</p>

      <div className="grid gap-4 mt-7" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <StatCard icon={ClipboardList} label="New requests" value={stats.newRequestsCount} href="/admin/procurement-requests" />
        <StatCard icon={Tags} label="Brands" value={stats.brandCount} href="/admin/brands" />
        <StatCard icon={PackageSearch} label="Sourcing categories" value={stats.categoryCount} href="/admin/what-we-source" />
        <StatCard icon={Wrench} label="Services" value={stats.serviceCount} href="/admin/services" />
      </div>

      <div className="mt-10">
        <h2 className="font-mono text-xs text-wc-textMute">Requests by status</h2>
        <div className="flex flex-wrap gap-2.5 mt-3">
          {stats.statusCounts.map((s) => (
            <div key={s.status} className="border border-wc-line rounded px-3 py-2 bg-wc-panel">
              <span className="font-mono text-xs text-wc-cyan">{s.count}</span>
              <span className="font-body text-[13px] text-wc-textSoft ml-2">{STATUS_LABELS[s.status] ?? s.status}</span>
            </div>
          ))}
          {stats.statusCounts.length === 0 && <p className="font-body text-[13.5px] text-wc-textMute">No procurement requests yet.</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, href }: { icon: any; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="border border-wc-line rounded-md p-5 bg-wc-panel no-underline hover:border-wc-blue block">
      <Icon size={18} className="text-wc-cyan" />
      <div className="font-display font-bold text-2xl mt-3 text-wc-text">{value}</div>
      <div className="font-body text-[13px] text-wc-textSoft mt-1">{label}</div>
    </Link>
  );
}
