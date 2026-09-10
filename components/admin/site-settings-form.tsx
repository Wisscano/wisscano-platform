"use client";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateSiteSettings } from "@/actions/admin/site-settings";
import { uploadAdminMedia } from "@/actions/upload";
import { ImageIcon, Plus, X } from "lucide-react";

function FileUploadField({ label, mediaId, previewUrl, onUploaded, hint }: {
  label: string; mediaId?: string | null; previewUrl?: string | null; onUploaded: (mediaId: string) => void; hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await uploadAdminMedia(formData);
    setUploading(false);
    if (res.ok && res.mediaId) onUploaded(res.mediaId);
    else setError(res.error ?? "Upload failed");
  }

  return (
    <div className="mb-4">
      <label className="font-mono text-[11px] text-wc-textMute">{label}</label>
      <div className="flex items-center gap-2.5 mt-1.5">
        <div className="w-11 h-11 rounded border border-dashed border-wc-lineStrong bg-wc-panelAlt flex items-center justify-center shrink-0 overflow-hidden">
          {previewUrl ? <img src={previewUrl} alt="" className="w-full h-full object-contain" /> : <ImageIcon size={16} className="text-wc-textMute" />}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handlePick(e.target.files)} />
        <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-2 text-[12px]">
          {uploading ? "Uploading…" : mediaId ? "Replace" : "Upload"}
        </Button>
      </div>
      {error && <p className="font-body text-xs text-red-400 mt-1">{error}</p>}
      {hint && <p className="font-body text-[11px] text-wc-textMute mt-1">{hint}</p>}
    </div>
  );
}

export function SiteSettingsForm({ initial, mediaUrls }: { initial: any; mediaUrls: { logo?: string | null; favicon?: string | null; og?: string | null } }) {
  const [values, setValues] = useState(initial);
  const [previews, setPreviews] = useState(mediaUrls);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  function set(k: string, v: any) { setValues((s: any) => ({ ...s, [k]: v })); setSaved(false); }

  async function handleSave() {
    setSaving(true); setErrors({});
    const res = await updateSiteSettings(values.id, values);
    setSaving(false);
    if (!res.ok) { setErrors(res.errors ?? {}); return; }
    setSaved(true);
  }

  const socialEntries = Object.entries(values.socialLinks ?? {});
  function updateSocial(platform: string, url: string) { set("socialLinks", { ...values.socialLinks, [platform]: url }); }
function renameSocialPlatform(oldName: string, newName: string) {
  const next: Record<string, string> = { ...(values.socialLinks ?? {}) };
  const url = next[oldName] ?? "";
  delete next[oldName];
  next[newName] = url;
  set("socialLinks", next);
}
function removeSocial(platform: string) {
  const next: Record<string, string> = { ...(values.socialLinks ?? {}) };
  delete next[platform];
  set("socialLinks", next);
}
  function addSocial() { set("socialLinks", { ...values.socialLinks, "New platform": "" }); }

  const navItems: { label: string; url: string; order: number }[] = values.navItems ?? [];
function updateNav(i: number, patch: Partial<{ label: string; url: string }>) {
  const next = [...navItems];
  const current = next[i];
  if (!current) return;
  next[i] = { ...current, ...patch };
  set("navItems", next);
}
  function addNav() { set("navItems", [...navItems, { label: "New link", url: "/", order: navItems.length }]); }
  function removeNav(i: number) { set("navItems", navItems.filter((_, idx) => idx !== i)); }
function moveNav(i: number, dir: number) {
  const next = [...navItems].sort((a, b) => a.order - b.order);
  const j = i + dir;
  if (j < 0 || j >= next.length) return;
  const a = next[i];
  const b = next[j];
  if (!a || !b) return;
  [a.order, b.order] = [b.order, a.order];
  set("navItems", next);
}

  return (
    <div className="max-w-[620px]">
      <div className="flex items-center gap-3 mb-6">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
        {saved && <span className="font-body text-[13px] text-wc-cyan">Saved.</span>}
      </div>

      <h2 className="font-mono text-xs text-wc-textMute mb-3">IDENTITY</h2>
{([["companyName", "Company name"], ["tagline", "Tagline"], ["acronymExpansion", "WISSCANO acronym expansion"]] as const).map(([key, label]) => (
        <div key={key} className="mb-4">
          <label className="font-mono text-[11px] text-wc-textMute">{label}</label>
          <Input className="mt-1.5" value={values[key] ?? ""} onChange={(e) => set(key, e.target.value)} />
          {errors[key] && <p className="font-body text-xs text-red-400 mt-1">{errors[key][0]}</p>}
        </div>
      ))}
      <div className="grid grid-cols-2 gap-4">
        <FileUploadField label="Logo" mediaId={values.logoMediaId} previewUrl={previews.logo} hint="SVG or PNG with transparent background"
          onUploaded={(id) => { set("logoMediaId", id); }} />
        <FileUploadField label="Favicon" mediaId={values.faviconMediaId} previewUrl={previews.favicon} hint="Square, 512×512px recommended"
          onUploaded={(id) => { set("faviconMediaId", id); }} />
      </div>

      <h2 className="font-mono text-xs text-wc-textMute mt-6 mb-3">HERO</h2>
      <div className="mb-4">
        <label className="font-mono text-[11px] text-wc-textMute">Hero headline</label>
        <Input className="mt-1.5" value={values.heroHeadline ?? ""} onChange={(e) => set("heroHeadline", e.target.value)} />
      </div>
      <div className="mb-4">
        <label className="font-mono text-[11px] text-wc-textMute">Hero subheadline</label>
        <Textarea className="mt-1.5" rows={2} value={values.heroSubheadline ?? ""} onChange={(e) => set("heroSubheadline", e.target.value)} />
      </div>

      <h2 className="font-mono text-xs text-wc-textMute mt-6 mb-3">CONTACT</h2>
      <div className="grid grid-cols-2 gap-4">
{([["contactEmail", "Contact email"], ["contactPhone", "Contact phone"], ["whatsappNumber", "WhatsApp number"], ["defaultCountryCode", "Default country (ISO)"], ["defaultCurrency", "Default currency"]] as const).map(([key, label]) => (
          <div key={key} className="mb-4">
            <label className="font-mono text-[11px] text-wc-textMute">{label}</label>
            <Input className="mt-1.5" value={values[key] ?? ""} onChange={(e) => set(key, e.target.value)} />
            {errors[key] && <p className="font-body text-xs text-red-400 mt-1">{errors[key][0]}</p>}
          </div>
        ))}
      </div>
      <div className="mb-4">
        <label className="font-mono text-[11px] text-wc-textMute">Address</label>
        <Textarea className="mt-1.5" rows={2} value={values.address ?? ""} onChange={(e) => set("address", e.target.value)} />
      </div>

      <h2 className="font-mono text-xs text-wc-textMute mt-6 mb-3">SEO DEFAULTS</h2>
      <div className="mb-4">
        <label className="font-mono text-[11px] text-wc-textMute">Default SEO title</label>
        <Input className="mt-1.5" value={values.seoDefaultTitle ?? ""} onChange={(e) => set("seoDefaultTitle", e.target.value)} />
      </div>
      <div className="mb-4">
        <label className="font-mono text-[11px] text-wc-textMute">Default SEO description</label>
        <Textarea className="mt-1.5" rows={2} value={values.seoDefaultDescription ?? ""} onChange={(e) => set("seoDefaultDescription", e.target.value)} />
      </div>
      <FileUploadField label="Default social share image (Open Graph)" mediaId={values.ogImageMediaId} previewUrl={previews.og}
        hint="Used when pages are shared on social platforms and don't define their own image, 1200×630px recommended"
        onUploaded={(id) => set("ogImageMediaId", id)} />

      <h2 className="font-mono text-xs text-wc-textMute mt-6 mb-3">SOCIAL LINKS</h2>
      {socialEntries.map(([platform, url]) => (
        <div key={platform} className="flex gap-2 mb-2.5 items-center">
          <Input value={platform} onChange={(e) => renameSocialPlatform(platform, e.target.value)} className="w-[140px] shrink-0" />
          <Input value={url as string} onChange={(e) => updateSocial(platform, e.target.value)} placeholder="https://" />
          <button onClick={() => removeSocial(platform)} className="bg-transparent border-none cursor-pointer shrink-0"><X size={14} className="text-wc-textMute" /></button>
        </div>
      ))}
      <Button variant="ghost" onClick={addSocial} className="mb-6"><Plus size={13} /> Add social link</Button>

      <h2 className="font-mono text-xs text-wc-textMute mb-3">FOOTER</h2>
      <div className="mb-4">
        <label className="font-mono text-[11px] text-wc-textMute">Footer text</label>
        <Textarea className="mt-1.5" rows={2} value={values.footerText ?? ""} onChange={(e) => set("footerText", e.target.value)} />
      </div>

      <h2 className="font-mono text-xs text-wc-textMute mt-6 mb-3">NAVIGATION</h2>
      {navItems.slice().sort((a, b) => a.order - b.order).map((n, i, arr) => (
        <div key={i} className="flex gap-2 mb-2.5 items-center">
          <div className="flex flex-col gap-0.5">
            <button onClick={() => moveNav(i, -1)} disabled={i === 0} className="bg-transparent border-none text-wc-textMute" style={{ opacity: i === 0 ? 0.3 : 1, cursor: i === 0 ? "default" : "pointer" }}>▲</button>
            <button onClick={() => moveNav(i, 1)} disabled={i === arr.length - 1} className="bg-transparent border-none text-wc-textMute" style={{ opacity: i === arr.length - 1 ? 0.3 : 1, cursor: i === arr.length - 1 ? "default" : "pointer" }}>▼</button>
          </div>
          <Input value={n.label} onChange={(e) => updateNav(i, { label: e.target.value })} className="w-[160px] shrink-0" />
          <Input value={n.url} onChange={(e) => updateNav(i, { url: e.target.value })} />
          <button onClick={() => removeNav(i)} className="bg-transparent border-none cursor-pointer shrink-0"><X size={14} className="text-wc-textMute" /></button>
        </div>
      ))}
      <Button variant="ghost" onClick={addNav}><Plus size={13} /> Add navigation link</Button>

      {errors._form && <p className="font-body text-[13px] text-red-400 mt-4">{errors._form[0]}</p>}
      <div className="mt-8 pt-6 border-t border-wc-line">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
        {saved && <span className="ml-3 font-body text-[13px] text-wc-cyan">Saved.</span>}
      </div>
    </div>
  );
}
