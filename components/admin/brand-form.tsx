"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createBrand, updateBrand, archiveBrand } from "@/actions/admin/brands";
import { slugify } from "@/lib/utils";

export interface BrandFormValues {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  websiteUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  altText?: string | null;
  semanticTags?: string[];
  displayOrder?: number;
  state?: "draft" | "published" | "archived";
}

/**
 * Canonical admin form pattern (§29): create/edit in one component, slug
 * auto-derived from name but editable, inline validation errors surfaced
 * from the server action, explicit publish-state control, confirmation
 * before archive. Categories/services/showcase forms mirror this exactly.
 */
export function BrandForm({ initial }: { initial?: BrandFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<BrandFormValues>(
    initial ?? { name: "", slug: "", state: "published", displayOrder: 0 }
  );
  const [tagsInput, setTagsInput] = useState((initial?.semanticTags ?? []).join(", "));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?.id);

  function set<K extends keyof BrandFormValues>(key: K, value: BrandFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setErrors({});
    const payload = {
      ...values,
      categoryIds: [],
      semanticTags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    };
    const res = isEdit ? await updateBrand(initial!.id!, payload) : await createBrand(payload);
    setSaving(false);
    if (!res.ok) { setErrors(res.errors ?? {}); return; }
    router.push("/admin/brands");
    router.refresh();
  }

  async function handleArchive() {
    if (!initial?.id) return;
    if (!confirm(`Archive ${values.name}? It will disappear from the public site but its history is kept.`)) return;
    await archiveBrand(initial.id);
    router.push("/admin/brands");
    router.refresh();
  }

  return (
    <div className="max-w-[640px]">
      <Field label="Name" error={errors.name}>
        <Input value={values.name} onChange={(e) => {
          set("name", e.target.value);
          if (!isEdit) set("slug", slugify(e.target.value));
        }} />
      </Field>

      <Field label="Slug (used in /brands/[slug])" error={errors.slug}>
        <Input value={values.slug} onChange={(e) => set("slug", e.target.value)} />
      </Field>

      <Field label="Description" error={errors.description}>
        <Textarea rows={3} value={values.description ?? ""} onChange={(e) => set("description", e.target.value)} />
      </Field>

      <Field label="Website URL" error={errors.websiteUrl}>
        <Input value={values.websiteUrl ?? ""} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Display order" error={errors.displayOrder}>
          <Input type="number" value={values.displayOrder ?? 0} onChange={(e) => set("displayOrder", Number(e.target.value))} />
        </Field>
        <Field label="Status">
          <select
            value={values.state}
            onChange={(e) => set("state", e.target.value as BrandFormValues["state"])}
            className="w-full bg-wc-panelAlt border border-wc-line rounded px-3 py-2.5 text-wc-text font-body text-[13.5px]"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      </div>

      <div className="mt-6 pt-6 border-t border-wc-line">
        <p className="font-mono text-xs text-wc-textMute mb-3">SEO</p>
        <Field label="SEO title" error={errors.seoTitle}>
          <Input value={values.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} />
        </Field>
        <Field label="SEO description" error={errors.seoDescription}>
          <Textarea rows={2} value={values.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} />
        </Field>
        <Field label="Logo alt text" error={errors.altText}>
          <Input value={values.altText ?? ""} onChange={(e) => set("altText", e.target.value)} />
        </Field>
        <Field label="Semantic tags (comma-separated)">
          <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="networking, enterprise, cisco switches" />
          <p className="font-body text-[11px] text-wc-textMute mt-1">Used for internal linking and search relevance — not shown publicly.</p>
        </Field>
      </div>

      {errors._form && <p className="font-body text-[13px] text-red-400 mt-3">{errors._form[0]}</p>}

      <div className="flex gap-3 mt-7">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : isEdit ? "Save changes" : "Create brand"}</Button>
        {isEdit && <Button variant="ghost" onClick={handleArchive}>Archive</Button>}
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="font-mono text-[11px] text-wc-textMute">{label}</label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="font-body text-xs text-red-400 mt-1">{error[0]}</p>}
    </div>
  );
}
