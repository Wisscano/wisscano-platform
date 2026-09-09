"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createService, updateService, archiveService } from "@/actions/admin/services";
import { slugify } from "@/lib/utils";

export interface ServiceFormValues {
  id?: string; name: string; slug: string; icon?: string | null; shortBlurb?: string | null;
  description?: string | null; detailedContent?: string | null;
  seoTitle?: string | null; seoDescription?: string | null; altText?: string | null; semanticTags?: string[];
  displayOrder?: number; state?: "draft" | "published" | "archived";
}

export function ServiceForm({ initial }: { initial?: ServiceFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<ServiceFormValues>(initial ?? { name: "", slug: "", state: "published", displayOrder: 0 });
  const [tagsInput, setTagsInput] = useState((initial?.semanticTags ?? []).join(", "));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?.id);

  function set<K extends keyof ServiceFormValues>(k: K, v: ServiceFormValues[K]) { setValues((s) => ({ ...s, [k]: v })); }

  async function handleSave() {
    setSaving(true); setErrors({});
    const payload = { ...values, relatedCategoryIds: [], semanticTags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean) };
    const res = isEdit ? await updateService(initial!.id!, payload) : await createService(payload);
    setSaving(false);
    if (!res.ok) { setErrors(res.errors ?? {}); return; }
    router.push("/admin/services"); router.refresh();
  }

  async function handleArchive() {
    if (!initial?.id) return;
    if (!confirm(`Archive ${values.name}?`)) return;
    await archiveService(initial.id);
    router.push("/admin/services"); router.refresh();
  }

  return (
    <div className="max-w-[640px]">
      <Field label="Name" error={errors.name}>
        <Input value={values.name} onChange={(e) => { set("name", e.target.value); if (!isEdit) set("slug", slugify(e.target.value)); }} />
      </Field>
      <Field label="Slug (used in /services/[slug])" error={errors.slug}>
        <Input value={values.slug} onChange={(e) => set("slug", e.target.value)} />
      </Field>
      <Field label="Icon (lucide-react component name)" error={errors.icon}>
        <Input value={values.icon ?? ""} onChange={(e) => set("icon", e.target.value)} />
      </Field>
      <Field label="Short blurb" error={errors.shortBlurb}>
        <Input value={values.shortBlurb ?? ""} onChange={(e) => set("shortBlurb", e.target.value)} />
      </Field>
      <Field label="Description" error={errors.description}>
        <Textarea rows={3} value={values.description ?? ""} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field label="Detailed content" error={errors.detailedContent}>
        <Textarea rows={4} value={values.detailedContent ?? ""} onChange={(e) => set("detailedContent", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Display order"><Input type="number" value={values.displayOrder ?? 0} onChange={(e) => set("displayOrder", Number(e.target.value))} /></Field>
        <Field label="Status">
          <select value={values.state} onChange={(e) => set("state", e.target.value as ServiceFormValues["state"])}
            className="w-full bg-wc-panelAlt border border-wc-line rounded px-3 py-2.5 text-wc-text font-body text-[13.5px]">
            <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
          </select>
        </Field>
      </div>
      <div className="mt-6 pt-6 border-t border-wc-line">
        <p className="font-mono text-xs text-wc-textMute mb-3">SEO</p>
        <Field label="SEO title" error={errors.seoTitle}><Input value={values.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} /></Field>
        <Field label="SEO description" error={errors.seoDescription}><Textarea rows={2} value={values.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} /></Field>
        <Field label="Image alt text" error={errors.altText}>
          <Input value={values.altText ?? ""} onChange={(e) => set("altText", e.target.value)} />
        </Field>
        <Field label="Semantic tags (comma-separated)">
          <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="cloud, migration, hosting" />
        </Field>
      </div>
      {errors._form && <p className="font-body text-[13px] text-red-400 mt-3">{errors._form[0]}</p>}
      <div className="flex gap-3 mt-7">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : isEdit ? "Save changes" : "Create service"}</Button>
        {isEdit && <Button variant="ghost" onClick={handleArchive}>Archive</Button>}
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
  return <div className="mb-4"><label className="font-mono text-[11px] text-wc-textMute">{label}</label><div className="mt-1.5">{children}</div>{error && <p className="font-body text-xs text-red-400 mt-1">{error[0]}</p>}</div>;
}
