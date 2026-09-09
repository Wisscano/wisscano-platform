"use client";

import { useState, useRef, useMemo } from "react";
import {
  Paperclip, ImageIcon, FileText, Send, X, HelpCircle,
  CheckCircle2, ArrowUpRight, ChevronDown, Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { submitProcurementRequest } from "@/actions/procurement";
import { uploadProcurementAttachment } from "@/actions/upload";
import { cn } from "@/lib/utils";

export interface RequestBarContext {
  type: "brand" | "category" | "service";
  id: string;
  label: string;
}

interface UploadedFile {
  mediaId: string;
  filename: string;
}

/**
 * The core customer interaction (§3-5 of master spec). Works with zero
 * clicks required on any carousel. On submit: uploads any pending files,
 * calls submitProcurementRequest (which persists to Neon BEFORE anything
 * else happens), then hands off to the WhatsApp deep link returned by the
 * server. If that request fails, the reference number/confirmation is
 * still shown — the database write already succeeded.
 */
export function RequestBar({
  context,
  onClearContext,
  scrollTargetRef,
}: {
  context: RequestBarContext | null;
  onClearContext: () => void;
  scrollTargetRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [assist, setAssist] = useState<null | "unsure" | "help">(null);
  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails] = useState({ qty: "", brand: "", location: "", timeframe: "" });
  const [guided, setGuided] = useState({ outcome: "", scale: "", where: "", when: "" });
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", organization: "" });
  const [showCustomerFields, setShowCustomerFields] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ referenceNumber: string; whatsappDeepLink?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const hasContent = text.trim().length > 0 || files.length > 0 || assist !== null;

  async function handleFilePick(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadProcurementAttachment(formData);
        if (res.ok && res.mediaId && res.filename) {
          setFiles((prev) => [...prev, { mediaId: res.mediaId!, filename: res.filename! }]);
        } else {
          setError(res.error ?? "Upload failed");
        }
      }
    } finally {
      setUploading(false);
    }
  }

  function removeFile(mediaId: string) {
    setFiles((prev) => prev.filter((f) => f.mediaId !== mediaId));
  }

  async function handleSubmit() {
    if (!customer.name || !customer.email) {
      setShowCustomerFields(true);
      setError("Add your name and email so our team can reach you.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await submitProcurementRequest({
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || undefined,
        organization: customer.organization || undefined,
      },
      deliveryLocation: details.location || undefined,
      requirementText: text || undefined,
      procurementType: "single_purchase",
      budget: undefined,
      deliveryTimeframe: details.timeframe || undefined,
      selectedContext: context ? { type: context.type, id: context.id, label: context.label } : undefined,
      isAssisted: assist !== null,
      assistedAnswers: assist === "unsure" ? {
        outcome: guided.outcome, scale: guided.scale, deploymentLocation: guided.where, timeframe: guided.when,
      } : undefined,
      items: [],
      attachmentMediaIds: files.map((f) => f.mediaId),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError(res.errors?._form?.[0] ?? "Something went wrong. Please check the form and try again.");
      return;
    }

    setResult({ referenceNumber: res.referenceNumber!, whatsappDeepLink: res.whatsappDeepLink });
  }

  function reset() {
    setResult(null); setText(""); setFiles([]); setAssist(null); onClearContext();
    setCustomer({ name: "", email: "", phone: "", organization: "" });
  }

  if (result) {
    return (
      <div ref={scrollTargetRef} className="bg-wc-panel border border-wc-lineStrong rounded-md p-9">
        <div className="flex items-start gap-3.5">
          <CheckCircle2 size={26} className="text-wc-cyan shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-display font-bold text-xl text-wc-text">Request recorded</div>
            <div className="font-mono text-[13px] text-wc-cyan mt-1.5">{result.referenceNumber}</div>
            <p className="font-body text-wc-textSoft text-[14.5px] mt-3 leading-relaxed max-w-md">
              This has been saved to the Wisscano procurement system. Continue on WhatsApp to speak with our
              sourcing team directly, or wait for a response by email.
            </p>
            <div className="flex gap-3 mt-5 flex-wrap">
              {result.whatsappDeepLink && (
                <a href={result.whatsappDeepLink} target="_blank" rel="noopener noreferrer">
                  <Button>Continue on WhatsApp <ArrowUpRight size={16} /></Button>
                </a>
              )}
              <Button variant="ghost" onClick={reset}>Start a new request</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollTargetRef} className="bg-wc-panel border border-wc-lineStrong rounded-md overflow-hidden">
      <div className="p-7 pb-5">
        <div className="font-display font-bold text-[19px] text-wc-text">What technology do you need?</div>
        <p className="font-body text-[13.5px] text-wc-textSoft mt-1.5 max-w-md">
          Describe your requirement, paste specifications, or upload an image or document —
          our procurement team will help source it.
        </p>

        {context && (
          <div className="mt-3.5 inline-flex items-center gap-2 bg-wc-blue/10 border border-wc-blue rounded px-2.5 py-1.5">
            <span className="font-mono text-xs text-wc-cyan">{context.type}</span>
            <span className="font-body text-[13px] text-wc-text font-medium">{context.label} selected</span>
            <button onClick={onClearContext} aria-label="Remove selected context" className="flex p-0">
              <X size={13} className="text-wc-textSoft" />
            </button>
          </div>
        )}

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="mt-4"
          placeholder={context ? `Tell us what you need for ${context.label} — quantity, specification, timeline...` : `e.g. "I need 30 laptops for a school, preferably HP or Dell, with 16GB RAM."`}
        />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {files.map((f) => (
              <div key={f.mediaId} className="flex items-center gap-1.5 bg-wc-panelAlt border border-wc-line rounded px-2.5 py-1.5">
                <FileText size={13} className="text-wc-textSoft" />
                <span className="font-mono text-xs text-wc-textSoft max-w-[160px] truncate">{f.filename}</span>
                <button onClick={() => removeFile(f.mediaId)} aria-label={`Remove ${f.filename}`}>
                  <X size={12} className="text-wc-textMute" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="font-body text-[13px] text-red-400 mt-2.5">{error}</p>}

        <p className="font-body text-[11.5px] text-wc-textMute mt-2">
          Attachments are security-screened before your request is processed.
        </p>

        <div className="flex flex-wrap gap-2.5 mt-4 items-center">
          <input ref={fileInputRef} type="file" multiple hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
            onChange={(e) => handleFilePick(e.target.files)} />
          <input ref={imageInputRef} type="file" multiple hidden accept="image/*"
            onChange={(e) => handleFilePick(e.target.files)} />

          <Button variant="ghost" onClick={() => fileInputRef.current?.click()} className="px-3.5 py-2.5 text-[13.5px]" disabled={uploading}>
            <Paperclip size={14} /> Attach file
          </Button>
          <Button variant="ghost" onClick={() => imageInputRef.current?.click()} className="px-3.5 py-2.5 text-[13.5px]" disabled={uploading}>
            <ImageIcon size={14} /> Upload image
          </Button>
          <button
            onClick={() => setShowDetails((s) => !s)}
            className="bg-transparent border-none text-wc-textSoft font-body text-[13.5px] cursor-pointer flex items-center gap-1"
          >
            Add quantity, brand or delivery details
            <ChevronDown size={14} className={cn("transition-transform", showDetails && "rotate-180")} />
          </button>

          <div className="flex-1" />
          <Button onClick={handleSubmit} disabled={!hasContent || submitting} className={cn(!hasContent && "opacity-55")}>
            {submitting ? "Submitting…" : "Request Procurement"} <Send size={16} />
          </Button>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-wc-line grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {([["qty", "Quantity"], ["brand", "Preferred brand"], ["location", "Delivery location"], ["timeframe", "Timeframe"]] as const).map(([key, label]) => (
              <div key={key}>
                <label className="font-mono text-[11px] text-wc-textMute">{label}</label>
                <Input className="mt-1.5" value={details[key]} onChange={(e) => setDetails((d) => ({ ...d, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}

        {showCustomerFields && (
          <div className="mt-4 pt-4 border-t border-wc-line grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <div>
              <label className="font-mono text-[11px] text-wc-textMute">Your name *</label>
              <Input className="mt-1.5" value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} />
            </div>
            <div>
              <label className="font-mono text-[11px] text-wc-textMute">Email *</label>
              <Input type="email" className="mt-1.5" value={customer.email} onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))} />
            </div>
            <div>
              <label className="font-mono text-[11px] text-wc-textMute">Phone</label>
              <Input className="mt-1.5" value={customer.phone} onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))} />
            </div>
            <div>
              <label className="font-mono text-[11px] text-wc-textMute">Organization</label>
              <Input className="mt-1.5" value={customer.organization} onChange={(e) => setCustomer((c) => ({ ...c, organization: e.target.value }))} />
            </div>
          </div>
        )}
        {!showCustomerFields && (
          <button onClick={() => setShowCustomerFields(true)} className="mt-3 font-body text-[12.5px] text-wc-textMute bg-transparent border-none cursor-pointer underline decoration-dotted">
            Add your contact details
          </button>
        )}
      </div>

      <div className="h-px bg-wc-line w-full" />

      <div className="px-7 py-4 bg-wc-panelAlt flex flex-wrap gap-5">
        <button onClick={() => setAssist(assist === "unsure" ? null : "unsure")}
          className={cn("bg-transparent border-none cursor-pointer flex items-center gap-1.5 font-body text-[13.5px] font-medium", assist === "unsure" ? "text-wc-cyan" : "text-wc-textSoft")}>
          <Compass size={15} /> Don&apos;t know what you need?
        </button>
        <button onClick={() => setAssist(assist === "help" ? null : "help")}
          className={cn("bg-transparent border-none cursor-pointer flex items-center gap-1.5 font-body text-[13.5px] font-medium", assist === "help" ? "text-wc-cyan" : "text-wc-textSoft")}>
          <HelpCircle size={15} /> Need help understanding the requirements?
        </button>
      </div>

      {assist === "unsure" && (
        <div className="px-7 pt-5.5 pb-6.5 bg-wc-bg border-t border-wc-line">
          <div className="font-body text-[13.5px] text-wc-textSoft mb-4 leading-relaxed max-w-md">
            No problem. Tell us about the outcome you&apos;re after instead of the technical specification —
            our team will translate this into the right products.
          </div>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
            {([
              ["outcome", "What are you trying to achieve?"],
              ["scale", "Roughly how many users, devices or sites?"],
              ["where", "Where will this be deployed?"],
              ["when", "When do you need it in place?"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="font-body text-[12.5px] text-wc-textSoft">{label}</label>
                <Input className="mt-1.5" value={guided[key]} onChange={(e) => setGuided((g) => ({ ...g, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="mt-4.5"><Button onClick={handleSubmit} disabled={submitting}>Submit for review <Send size={16} /></Button></div>
        </div>
      )}

      {assist === "help" && (
        <div className="px-7 pt-5.5 pb-6.5 bg-wc-bg border-t border-wc-line">
          <div className="font-body text-[13.5px] text-wc-textSoft leading-relaxed max-w-md">
            You don&apos;t need to be a technology expert. Describe what you&apos;re trying to accomplish in the box
            above — in plain language — and our team will determine the appropriate specification before
            anything is sourced.
          </div>
          <div className="mt-4"><Button onClick={handleSubmit} disabled={submitting}>Submit as written <Send size={16} /></Button></div>
        </div>
      )}
    </div>
  );
}
