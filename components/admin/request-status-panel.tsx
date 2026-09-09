"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProcurementRequestStatus } from "@/actions/admin/procurement-requests";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STATUSES = [
  "new", "reviewing", "sourcing", "quotation_prepared", "awaiting_customer",
  "approved", "procurement", "delivered", "closed", "cancelled",
] as const;

export function RequestStatusPanel({ requestId, currentStatus }: { requestId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleUpdate() {
    setSaving(true);
    await updateProcurementRequestStatus({ requestId, status, note: note || undefined });
    setSaving(false);
    setNote("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 max-w-[420px]">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="bg-wc-panelAlt border border-wc-line rounded px-3 py-2.5 text-wc-text font-body text-[13.5px]"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
      </select>
      <Textarea rows={2} placeholder="Internal note about this status change (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button onClick={handleUpdate} disabled={saving || status === currentStatus} className="self-start">
        {saving ? "Updating…" : "Update status"}
      </Button>
    </div>
  );
}
