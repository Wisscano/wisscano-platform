"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createShowcaseItem, updateShowcaseItem, archiveShowcaseItem } from "@/actions/admin/showcase";
import { uploadAdminMedia } from "@/actions/upload";
import { ImageIcon } from "lucide-react";

export interface ShowcaseFormValues {
  id?: string; title: string; subtitle?: string | null; description?: string | null;
  desktopImageMediaId?: string | null; ctaLabel?: string | null; ctaUrl?: string | null;
  category?: string | null; altText?: string | null; seoTitle?: string | null; seoDescription?: string | null;
  semanticTags?: string[]; displayOrder?: number; state?: "draft" | "published" | "archived";
}

/**
 * The "environment canvas" imagery form. altText and seoDescription are
 * REQUIRED-by-convention fields (§18 image SEO) — enforced with inline
 * guidance rather than a hard block, since a launch-day upload without
 * perfect copy shouldn't be blocked outright.
 */
export function ShowcaseForm({ initial }: { initial?: ShowcaseFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<ShowcaseFormValues>(initial ?? { title: "", state: "published", displayOrder: 0 });
  const [tagsInput, setTagsInput] = useState((initial?.semanticTags ?? []).join(", "));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initial?.id);

  function set<K extends keyof ShowcaseFormValues>(k: K, v: ShowcaseFormValues[K]) { setValues((s) => ({ ...s, [k]: v })); }

  async function handleImagePick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await uploadAdminMedia(formData);
    setUploading(false);
    if (res.ok && res.mediaId) set("desktopImageMediaId", res.mediaId);
    else setErrors({ desktopImageMediaId: [res.error ?? "Upload failed"] });
  }

  async function handleSave() {
    setSaving(true); setErrors({});
    const payload = { ...values, semanticTags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean) };
    const res = isEdit ? await updateShowcaseItem(initial!.id!, payload) : await createShowcaseItem(payload);
    setSaving(false);
    if (!res.ok) { setErrors(res.errors ?? {}); return; }
    router.push("/admin/showcase"); router.refresh();
  }

  async function handleArchive() {
    if (!initial?.id) return;
    if (!confirm(`Archive "${values.title}"?`)) return;
    await archiveShowcaseItem(initial.id);
    router.push("/admin/showcase"); router.refresh();
  }

  return (
    <div className="max-w-[640px]">
      <Field label="Title" error={errors.title}><Input value={values.title} onChange={(e) => set("title", e.target.value)} /></Field>
      <Field label="Subtitle" error={errors.subtitle}><Input value={values.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} /></Field>
      <Field label="Description (used as a screen-reader caption)" error={errors.description}>
        <Textarea rows={3} value={values.description ?? ""} onChange={(e) => set("description", e.target.value)} />
      </Field>

      <Field label="Desktop image" error={errors.desktopImageMediaId}>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleImagePick(e.target.files)} />
        <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <ImageIcon size={14} /> {uploading ? "Uploading…" : values.desktopImageMediaId ? "Replace image" : "Upload image"}
        </Button>
      </Field>

      <Field label="Alt text (required for image SEO)" error={errors.altText}>
        <Input value={values.altText ?? ""} onChange={(e) => set("altText", e.target.value)} placeholder="Describe what's shown, plainly" />
      </Field>
      <Field label="Category tag" error={errors.category}><Input value={values.category ?? ""} onChange={(e) => set("category", e.target.value)} /></Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="CTA label" error={errors.ctaLabel}><Input value={values.ctaLabel ?? ""} onChange={(e) => set("ctaLabel", e.target.value)} /></Field>
        <Field label="CTA URL" error={errors.ctaUrl}><Input value={values.ctaUrl ?? ""} onChange={(e) => set("ctaUrl", e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Display order"><Input type="number" value={values.displayOrder ?? 0} onChange={(e) => set("displayOrder", Number(e.target.value))} /></Field>
        <Field label="Status">
          <select value={values.state} onChange={(e) => set("state", e.target.value as ShowcaseFormValues["state"])}
            className="w-full bg-wc-panelAlt border border-wc-line rounded px-3 py-2.5 text-wc-text font-body text-[13.5px]">
            <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
          </select>
        </Field>
      </div>

      <div className="mt-6 pt-6 border-t border-wc-line">
        <p className="font-mono text-xs text-wc-textMute mb-3">SEO</p>
        <Field label="SEO title" error={errors.seoTitle}><Input value={values.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} /></Field>
        <Field label="SEO description" error={errors.seoDescription}><Textarea rows={2} value={values.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} /></Field>
        <Field label="Semantic tags (comma-separated)">
          <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="networking, enterprise infrastructure" />
        </Field>
      </div>

      {errors._form && <p className="font-body text-[13px] text-red-400 mt-3">{errors._form[0]}</p>}
      <div className="flex gap-3 mt-7">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : isEdit ? "Save changes" : "Create showcase item"}</Button>
        {isEdit && <Button variant="ghost" onClick={handleArchive}>Archive</Button>}
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
  return <div className="mb-4"><label className="font-mono text-[11px] text-wc-textMute">{label}</label><div className="mt-1.5">{children}</div>{error && <p className="font-body text-xs text-red-400 mt-1">{error[0]}</p>}</div>;
}
