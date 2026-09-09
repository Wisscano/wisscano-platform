"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createDocument } from "@/actions/admin/documents";
import { Plus, X } from "lucide-react";

interface DocType { id: string; name: string; code: string }
interface LineItemDraft { description: string; quantity: number; unitPrice: number; taxPercent: number }

function money(minor: number, currency: string) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 2 }).format(minor / 100);
}

/**
 * The document creator (§43-48). Prices are entered in whole currency
 * units for admin convenience and converted to minor units (cents) only
 * on submit, matching the schema's integer-minor-unit columns (avoids
 * float rounding). If `prefill` is provided (arrived via a "Create
 * Quotation" action from a procurement request), the form seeds itself
 * from the request's customer and requirement items.
 */
export function DocumentForm({
  documentTypes,
  prefill,
}: {
  documentTypes: DocType[];
  prefill?: {
    requestId: string; referenceNumber: string; customerId?: string; customerName?: string; customerEmail?: string;
    lineItems: { description: string; quantity: number; unitPriceMinor: number; discountMinor: number; taxRateBasisPoints: number }[];
  } | null;
}) {
  const router = useRouter();
  const [documentTypeId, setDocumentTypeId] = useState(documentTypes[0]?.id ?? "");
  const [currency, setCurrency] = useState("KES");
  const [customerName, setCustomerName] = useState(prefill?.customerName ?? "");
  const [customerEmail, setCustomerEmail] = useState(prefill?.customerEmail ?? "");
  const [notes, setNotes] = useState("Valid for 14 days from issue.");
  const [lineItems, setLineItems] = useState<LineItemDraft[]>(
    prefill?.lineItems.length
      ? prefill.lineItems.map((li) => ({ description: li.description, quantity: li.quantity, unitPrice: li.unitPriceMinor / 100, taxPercent: li.taxRateBasisPoints / 100 }))
      : [{ description: "", quantity: 1, unitPrice: 0, taxPercent: 16 }]
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  function updateLine(i: number, patch: Partial<LineItemDraft>) {
    setLineItems((prev) => prev.map((li, idx) => (idx === i ? { ...li, ...patch } : li)));
  }
  function addLine() { setLineItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, taxPercent: 16 }]); }
  function removeLine(i: number) { setLineItems((prev) => prev.filter((_, idx) => idx !== i)); }

  const totals = useMemo(() => {
    let subtotal = 0, tax = 0;
    for (const li of lineItems) {
      const lineSubtotal = li.quantity * li.unitPrice;
      subtotal += lineSubtotal;
      tax += lineSubtotal * (li.taxPercent / 100);
    }
    return { subtotal, tax, total: subtotal + tax };
  }, [lineItems]);

  async function handleSave(status: "draft" | "issued") {
    setSaving(true); setErrors({});
    const res = await createDocument({
      documentTypeId,
      requestId: prefill?.requestId,
      customerId: prefill?.customerId,
      customerName,
      customerEmail,
      currency,
      status,
      notes,
      lineItems: lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPriceMinor: Math.round(li.unitPrice * 100),
        discountMinor: 0,
        taxRateBasisPoints: Math.round(li.taxPercent * 100),
      })),
    });
    setSaving(false);
    if (!res.ok) { setErrors(res.errors ?? {}); return; }
    router.push(`/admin/documents/${res.id}`);
  }

  return (
    <div className="max-w-[720px]">
      {prefill && (
        <p className="font-mono text-xs text-wc-cyan mb-4">Pre-populated from procurement request {prefill.referenceNumber}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-mono text-[11px] text-wc-textMute">Document type</label>
          <select value={documentTypeId} onChange={(e) => setDocumentTypeId(e.target.value)}
            className="w-full mt-1.5 bg-wc-panelAlt border border-wc-line rounded px-3 py-2.5 text-wc-text font-body text-[13.5px]">
            {documentTypes.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
          </select>
        </div>
        <div>
          <label className="font-mono text-[11px] text-wc-textMute">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="w-full mt-1.5 bg-wc-panelAlt border border-wc-line rounded px-3 py-2.5 text-wc-text font-body text-[13.5px]">
            {["KES", "USD", "EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="font-mono text-[11px] text-wc-textMute">Customer name</label>
          <Input className="mt-1.5" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div>
          <label className="font-mono text-[11px] text-wc-textMute">Customer email</label>
          <Input className="mt-1.5" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
        </div>
      </div>

      <h2 className="font-mono text-xs text-wc-textMute mt-6 mb-3">LINE ITEMS</h2>
      {lineItems.map((li, i) => (
        <div key={i} className="grid gap-2 mb-2 items-center" style={{ gridTemplateColumns: "1fr 70px 110px 80px auto" }}>
          <Input value={li.description} onChange={(e) => updateLine(i, { description: e.target.value })} placeholder="Description" />
          <Input type="number" value={li.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} />
          <Input type="number" value={li.unitPrice} onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })} placeholder="Unit price" />
          <Input type="number" value={li.taxPercent} onChange={(e) => updateLine(i, { taxPercent: Number(e.target.value) })} placeholder="Tax %" />
          <button onClick={() => removeLine(i)} className="bg-transparent border-none cursor-pointer"><X size={14} className="text-wc-textMute" /></button>
        </div>
      ))}
      <Button variant="ghost" onClick={addLine} className="mt-2"><Plus size={13} /> Add line item</Button>
      {errors.lineItems && <p className="font-body text-xs text-red-400 mt-2">{errors.lineItems[0]}</p>}

      <div className="mt-6 pt-4 border-t border-wc-line max-w-[280px] ml-auto">
        <Row label="Subtotal" value={money(totals.subtotal * 100, currency)} />
        <Row label="Tax" value={money(totals.tax * 100, currency)} />
        <div className="flex justify-between py-2 border-t border-wc-line mt-1">
          <span className="font-display font-bold text-sm text-wc-text">Total</span>
          <span className="font-display font-bold text-sm text-wc-cyan">{money(totals.total * 100, currency)}</span>
        </div>
      </div>

      <div className="mt-4">
        <label className="font-mono text-[11px] text-wc-textMute">Notes / terms</label>
        <Textarea className="mt-1.5" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {errors._form && <p className="font-body text-[13px] text-red-400 mt-3">{errors._form[0]}</p>}
      <div className="flex gap-3 mt-6">
        <Button onClick={() => handleSave("draft")} disabled={saving}>{saving ? "Saving…" : "Save as draft"}</Button>
        <Button variant="ghost" onClick={() => handleSave("issued")} disabled={saving}>Save & issue</Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between py-1.5 font-body text-[13px]"><span className="text-wc-textMute">{label}</span><span className="text-wc-text">{value}</span></div>;
}
