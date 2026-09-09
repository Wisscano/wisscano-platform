"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateCompanyProfile } from "@/actions/admin/company-profile";

export function CompanyProfileForm({ initial }: { initial: any }) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  function set(k: string, v: string) { setValues((s: any) => ({ ...s, [k]: v })); setSaved(false); }

  async function save() {
    setSaving(true);
    await updateCompanyProfile(values.id, values);
    setSaving(false); setSaved(true);
  }

  return (
    <div className="max-w-[480px]">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Legal name"><Input value={values.legalName ?? ""} onChange={(e) => set("legalName", e.target.value)} /></Field>
        <Field label="Tax / VAT number"><Input value={values.taxNumber ?? ""} onChange={(e) => set("taxNumber", e.target.value)} /></Field>
        <Field label="Registration number"><Input value={values.registrationNumber ?? ""} onChange={(e) => set("registrationNumber", e.target.value)} /></Field>
        <Field label="Phone"><Input value={values.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Authorized signatory"><Input value={values.authorizedSignatoryName ?? ""} onChange={(e) => set("authorizedSignatoryName", e.target.value)} /></Field>
        <Field label="Signatory title"><Input value={values.authorizedSignatoryTitle ?? ""} onChange={(e) => set("authorizedSignatoryTitle", e.target.value)} /></Field>
      </div>
      <Field label="Address"><Textarea rows={2} value={values.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
      <Field label="Bank details"><Textarea rows={2} value={values.bankDetails ?? ""} onChange={(e) => set("bankDetails", e.target.value)} /></Field>
      <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save company profile"}</Button>
      {saved && <span className="ml-3 font-body text-[13px] text-wc-cyan">Saved.</span>}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4"><label className="font-mono text-[11px] text-wc-textMute">{label}</label><div className="mt-1.5">{children}</div></div>;
}
