import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { countries, markets } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminMarketsPage() {
  await requireAdmin();
  const countryRows = await db.select().from(countries);
  const marketRows = await db.select().from(markets);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl">Markets</h1>
      <p className="font-body text-[13.5px] text-wc-textSoft mt-1.5">International-first: countries and regional markets, not hard-coded (§16/§22).</p>

      <h2 className="font-mono text-xs text-wc-textMute mt-8 mb-3">Countries</h2>
      <table className="w-full border-collapse">
        <thead><tr className="border-b border-wc-line">{["Name", "ISO", "Currency", "Active"].map((h) => <th key={h} className="text-left font-mono text-[11px] text-wc-textMute font-normal py-2 pr-4">{h}</th>)}</tr></thead>
        <tbody>
          {countryRows.map((c) => (
            <tr key={c.id} className="border-b border-wc-line/60"><td className="py-2.5 pr-4 font-body text-[13.5px]">{c.name}</td><td className="py-2.5 pr-4 font-mono text-xs">{c.isoCode}</td><td className="py-2.5 pr-4 font-mono text-xs">{c.currency}</td><td className="py-2.5 font-mono text-xs text-wc-cyan">{c.active ? "yes" : "no"}</td></tr>
          ))}
          {countryRows.length === 0 && <tr><td colSpan={4} className="py-4 font-body text-[13.5px] text-wc-textMute">Run the seed script to add Kenya as the default market.</td></tr>}
        </tbody>
      </table>

      <h2 className="font-mono text-xs text-wc-textMute mt-8 mb-3">Regions</h2>
      <table className="w-full border-collapse">
        <thead><tr className="border-b border-wc-line">{["Region", "City", "Procurement available", "Delivery available"].map((h) => <th key={h} className="text-left font-mono text-[11px] text-wc-textMute font-normal py-2 pr-4">{h}</th>)}</tr></thead>
        <tbody>
          {marketRows.map((m) => (
            <tr key={m.id} className="border-b border-wc-line/60"><td className="py-2.5 pr-4 font-body text-[13.5px]">{m.regionName}</td><td className="py-2.5 pr-4 font-body text-[13.5px]">{m.cityName ?? "—"}</td><td className="py-2.5 pr-4 font-mono text-xs text-wc-cyan">{m.procurementAvailable ? "yes" : "no"}</td><td className="py-2.5 font-mono text-xs text-wc-cyan">{m.deliveryAvailable ? "yes" : "no"}</td></tr>
          ))}
          {marketRows.length === 0 && <tr><td colSpan={4} className="py-4 font-body text-[13.5px] text-wc-textMute">No regions configured yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
