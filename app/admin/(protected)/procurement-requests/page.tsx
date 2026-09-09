import { notFound } from "next/navigation";
import Link from "next/link";
import { getProcurementRequestDetail } from "@/actions/admin/procurement-requests";
import { RequestStatusPanel } from "@/components/admin/request-status-panel";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default async function AdminProcurementRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getProcurementRequestDetail(id);
  if (!detail) notFound();

  const { request, customer, items, attachments, history } = detail;

  return (
    <div className="max-w-[820px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-xs text-wc-cyan">{request.referenceNumber}</p>
          <h1 className="font-display font-bold text-2xl mt-1">{customer?.name ?? "Unknown customer"}</h1>
          {customer?.organization && <p className="font-body text-[13.5px] text-wc-textSoft">{customer.organization}</p>}
        </div>
        <Link href={`/admin/documents/new?requestId=${request.id}`}>
          <Button variant="ghost"><FileText size={14} /> Create Quotation</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-7">
        <Section title="Customer">
          <Row label="Email" value={customer?.email} />
          <Row label="Phone" value={customer?.phone} />
          <Row label="Country" value={customer?.countryCode} />
          <Row label="City" value={customer?.city} />
          <Row label="Delivery location" value={request.deliveryLocation} />
        </Section>

        <Section title="Request">
          <Row label="Context" value={request.selectedContextLabel} />
          <Row label="Type" value={request.procurementType.replace("_", " ")} />
          <Row label="Budget" value={request.budget} />
          <Row label="Timeframe" value={request.deliveryTimeframe} />
          <Row label="Assisted" value={request.isAssisted ? "Yes" : "No"} />
        </Section>
      </div>

      {request.requirementText && (
        <Section title="Requirement (as written)">
          <p className="font-body text-[14px] text-wc-text leading-relaxed whitespace-pre-wrap">{request.requirementText}</p>
        </Section>
      )}

      {request.isAssisted && request.assistedAnswers && (
        <Section title="Assisted procurement answers">
          <Row label="Outcome" value={request.assistedAnswers.outcome} />
          <Row label="Scale" value={request.assistedAnswers.scale} />
          <Row label="Deployment location" value={request.assistedAnswers.deploymentLocation} />
          <Row label="Timeframe" value={request.assistedAnswers.timeframe} />
        </Section>
      )}

      {items.length > 0 && (
        <Section title="Requirement items">
          <ul className="list-none p-0 m-0 space-y-2">
            {items.map((item) => (
              <li key={item.id} className="border border-wc-line rounded p-3 font-body text-[13.5px]">
                {item.description} {item.quantity && <span className="text-wc-textSoft">— qty {item.quantity}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {attachments.length > 0 && (
        <Section title="Attachments">
          <ul className="list-none p-0 m-0 space-y-1.5">
            {attachments.map((a) => a.media && (
              <li key={a.id} className="flex items-center gap-2">
                {a.media.scanStatus === "clean" ? (
                  <a href={a.media.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[13px] text-wc-cyan no-underline">
                    {a.media.filename}
                  </a>
                ) : (
                  <span className="font-mono text-[13px] text-wc-textMute">{a.media.filename} — quarantined ({a.media.scanStatus})</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Status">
        <RequestStatusPanel requestId={request.id} currentStatus={request.status} />
      </Section>

      <Section title="History">
        <ul className="list-none p-0 m-0 space-y-2">
          {history.map((h) => (
            <li key={h.id} className="font-body text-[13px] text-wc-textSoft">
              <span className="font-mono text-wc-textMute">{new Date(h.createdAt).toLocaleString()}</span>
              {" — "}{h.fromStatus ? `${h.fromStatus} → ` : ""}{h.toStatus}
              {h.note && <span className="text-wc-textMute"> ({h.note})</span>}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 pt-6 border-t border-wc-line">
      <h2 className="font-mono text-xs text-wc-textMute mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 text-[13.5px] font-body">
      <span className="text-wc-textMute">{label}</span>
      <span className="text-wc-text">{value}</span>
    </div>
  );
}
