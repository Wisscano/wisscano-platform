"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createDocumentType, updateDocumentType, archiveDocumentType } from "@/actions/admin/document-types";

export interface DocumentTypeFormValues {
  id?: string; name: string; code: string; description?: string | null; active?: boolean;
}

export function DocumentTypeForm({ initial }: { initial?: DocumentTypeFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<DocumentTypeFormValues>(initial ?? { name: "", code: "", active: true });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?.id);

  function set<K extends keyof DocumentTypeFormValues>(k: K, v: DocumentTypeFormValues[K]) { setValues((s) => ({ ...s, [k]: v })); }

  async function handleSave() {
    setSaving(true); setErrors({});
    const res = isEdit ? await updateDocumentType(initial!.id!, values) : await createDocumentType(values);
    setSaving(false);
    if (!res.ok) { setErrors(res.errors ?? {}); return; }
    router.push("/admin/document-types"); router.refresh();
  }

  async function handleArchive() {
    if (!initial?.id) return;
    if (!confirm(`Deactivate ${values.name}?`)) return;
    await archiveDocumentType(initial.id);
    router.push("/admin/document-types"); router.refresh();
  }

  return (
    <div className="max-w-[480px]">
      <div className="mb-4">
        <label className="font-mono text-[11px] text-wc-textMute">Name</label>
        <Input className="mt-1.5" value={values.name} onChange={(e) => set("name", e.target.value)} />
        {errors.name && <p className="font-body text-xs text-red-400 mt-1">{errors.name[0]}</p>}
      </div>
      <div className="mb-4">
        <label className="font-mono text-[11px] text-wc-textMute">Code (e.g. QT, INV, LPO)</label>
        <Input className="mt-1.5" value={values.code} onChange={(e) => set("code", e.target.value.toUpperCase())} />
        {errors.code && <p className="font-body text-xs text-red-400 mt-1">{errors.code[0]}</p>}
      </div>
      <div className="mb-4">
        <label className="font-mono text-[11px] text-wc-textMute">Description</label>
        <Textarea className="mt-1.5" rows={2} value={values.description ?? ""} onChange={(e) => set("description", e.target.value)} />
      </div>
      <label className="flex items-center gap-2 font-body text-[13px] text-wc-textSoft mb-5">
        <input type="checkbox" checked={values.active ?? true} onChange={(e) => set("active", e.target.checked)} /> Available when creating documents
      </label>

      {errors._form && <p className="font-body text-[13px] text-red-400 mt-3">{errors._form[0]}</p>}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : isEdit ? "Save changes" : "Create document type"}</Button>
        {isEdit && <Button variant="ghost" onClick={handleArchive}>Deactivate</Button>}
      </div>
    </div>
  );
}
