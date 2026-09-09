import { notFound } from "next/navigation";
import Link from "next/link";
import { getDocumentDetail } from "@/actions/admin/documents";

function money(minor: number, currency: string) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 2 }).format(minor / 100);
}

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getDocumentDetail(id);
  if (!detail) notFound();
  const { document, lineItems, type, customer } = detail;

  return (
    <div className="max-w-[640px]">
      <Link href="/admin/documents" className="font-body text-[12.5px] text-wc-textSoft no-underline">← Back to documents</Link>

      <p className="font-mono text-xs text-wc-cyan mt-4">{document.documentNumber} · {type?.name}</p>
      <h1 className="font-display font-bold text-2xl text-wc-text mt-1">{customer?.name ?? "Unknown customer"}</h1>
      <p className="font-body text-[13px] text-wc-textSoft mt-1">{customer?.email}</p>
      <p className="font-mono text-xs text-wc-textMute mt-2">Status: {document.status}</p>

      <div className="mt-6">
        {lineItems.map((li) => (
          <div key={li.id} className="flex justify-between py-2 border-b border-wc-line font-body text-[13.5px]">
            <span>{li.description} <span className="text-wc-textMute">× {li.quantity}</span></span>
            <span>{money(li.quantity * li.unitPriceMinor, document.currency)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1">
        <div className="flex justify-between font-body text-[13px]"><span className="text-wc-textMute">Subtotal</span><span>{money(document.subtotalMinor, document.currency)}</span></div>
        <div className="flex justify-between font-body text-[13px]"><span className="text-wc-textMute">Tax</span><span>{money(document.taxMinor, document.currency)}</span></div>
        <div className="flex justify-between font-display font-bold text-sm pt-2 border-t border-wc-line"><span>Total</span><span className="text-wc-cyan">{money(document.totalMinor, document.currency)}</span></div>
      </div>

      {document.notes && <p className="font-body text-[13px] text-wc-textSoft mt-6">{document.notes}</p>}
    </div>
  );
}
