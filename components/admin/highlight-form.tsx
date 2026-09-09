"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createHighlight, updateHighlight, archiveHighlight } from "@/actions/admin/highlights";
import { uploadAdminMedia } from "@/actions/upload";
import { ImageIcon } from "lucide-react";

const TYPES = [
  ["wisscano_launch", "Wisscano Launch"], ["new_platform", "New Platform"], ["new_service", "New Service"],
  ["new_technology", "New Technology"], ["procurement_update", "Procurement Update"],
  ["featured_solution", "Featured Solution"], ["company_announcement", "Company Announcement"],
  ["general_highlight", "General Highlight"],
] as const;

export interface HighlightFormValues {
  id?: string; type?: string; title: string; shortDescription?: string | null;
  imageMediaId?: string | null; ctaLabel?: string; ctaUrl: string;
  isExternal?: boolean; openInNewTab?: boolean; active?: boolean;
  startDate?: string | null; endDate?: string | null; displayOrder?: number; priority?: number;
}

/**
 * Admin form for a single Highlights/Announcements record (§11-14). Note
 * ctaUrl deliberately accepts anything — an internal anchor ("#services"),
 * an internal route, or a full external/subdomain URL (e.g.
 * https://forge.wisscano.co.ke) — the isExternal/openInNewTab toggles
 * control behaviour, not a hard-coded assumption about the URL shape.
 */
export function HighlightForm({ initial }: { initial?: HighlightFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<HighlightFormValues>(initial ?? { title: "", ctaUrl: "", ctaLabel: "Learn more", type: "general_highlight", active: true, isExternal: false, openInNewTab: false, displayOrder: 0, priority: 0 });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initial?.id);

  function set<K extends keyof HighlightFormValues>(k: K, v: HighlightFormValues[K]) { setValues((s) => ({ ...s, [k]: v })); }

  async function handleImagePick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await uploadAdminMedia(formData);
    setUploading(false);
    if (res.ok && res.mediaId) set("imageMediaId", res.mediaId);
  }

  async function handleSave() {
    setSaving(true); setErrors({});
    const res = isEdit ? await updateHighlight(initial!.id!, values) : await createHighlight(values);
    setSaving(false);
    if (!res.ok) { setErrors(res.errors ?? {}); return; }
    router.push("/admin/highlights"); router.refresh();
  }

  async function handleArchive() {
    if (!initial?.id) return;
    if (!confirm(`Deactivate "${values.title}"?`)) return;
    await archiveHighlight(initial.id);
    router.push("/admin/highlights"); router.refresh();
  }

  return (
    <div className="max-w-[640px]">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Type">
          <select value={values.type} onChange={(e) => set("type", e.target.value)}
            className="w-full bg-wc-panelAlt border border-wc-line rounded px-3 py-2.5 text-wc-text font-body text-[13.5px]">
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Priority (higher shows first)"><Input type="number" value={values.priority ?? 0} onChange={(e) => set("priority", Number(e.target.value))} /></Field>
      </div>

      <Field label="Title" error={errors.title}><Input value={values.title} onChange={(e) => set("title", e.target.value)} /></Field>
      <Field label="Short description" error={errors.shortDescription}><Textarea rows={2} value={values.shortDescription ?? ""} onChange={(e) => set("shortDescription", e.target.value)} /></Field>

      <Field label="Image (optional)">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleImagePick(e.target.files)} />
        <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <ImageIcon size={14} /> {uploading ? "Uploading…" : "Upload image"}
        </Button>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="CTA label" error={errors.ctaLabel}><Input value={values.ctaLabel ?? ""} onChange={(e) => set("ctaLabel", e.target.value)} /></Field>
        <Field label="Destination — anchor, route, or full URL" error={errors.ctaUrl}>
          <Input value={values.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} placeholder="#services or https://forge.wisscano.co.ke" />
        </Field>
      </div>

      <div className="flex gap-6 mt-1 mb-4">
        <label className="flex items-center gap-2 font-body text-[13px] text-wc-textSoft">
          <input type="checkbox" checked={values.isExternal ?? false} onChange={(e) => set("isExternal", e.target.checked)} /> External / subdomain destination
        </label>
        <label className="flex items-center gap-2 font-body text-[13px] text-wc-textSoft">
          <input type="checkbox" checked={values.openInNewTab ?? false} onChange={(e) => set("openInNewTab", e.target.checked)} /> Open in new tab
        </label>
        <label className="flex items-center gap-2 font-body text-[13px] text-wc-textSoft">
          <input type="checkbox" checked={values.active ?? true} onChange={(e) => set("active", e.target.checked)} /> Active
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date (optional)"><Input type="datetime-local" onChange={(e) => set("startDate", e.target.value ? new Date(e.target.value).toISOString() : null)} /></Field>
        <Field label="End date (optional)"><Input type="datetime-local" onChange={(e) => set("endDate", e.target.value ? new Date(e.target.value).toISOString() : null)} /></Field>
      </div>
      <Field label="Display order"><Input type="number" value={values.displayOrder ?? 0} onChange={(e) => set("displayOrder", Number(e.target.value))} /></Field>

      {errors._form && <p className="font-body text-[13px] text-red-400 mt-3">{errors._form[0]}</p>}
      <div className="flex gap-3 mt-7">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : isEdit ? "Save changes" : "Create highlight"}</Button>
        {isEdit && <Button variant="ghost" onClick={handleArchive}>Deactivate</Button>}
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
  return <div className="mb-4"><label className="font-mono text-[11px] text-wc-textMute">{label}</label><div className="mt-1.5">{children}</div>{error && <p className="font-body text-xs text-red-400 mt-1">{error[0]}</p>}</div>;
}
