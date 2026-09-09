"use client";
import { useState } from "react";
import { updateCarouselConfig } from "@/actions/admin/carousels";
import { Button } from "@/components/ui/button";

const LABELS: Record<string, string> = { brands: "Brands We Source", what_we_source: "What We Source", services: "Our Services" };

export function CarouselConfigRow({ config }: { config: { type: "brands" | "what_we_source" | "services"; direction: "left" | "right"; speedPxPerSec: number; active: boolean; pauseOnHover: boolean } }) {
  const [state, setState] = useState(config);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await updateCarouselConfig(state);
    setSaving(false);
  }

  return (
    <div className="border border-wc-line rounded-md p-5 flex flex-wrap items-end gap-4">
      <div className="min-w-[180px]">
        <p className="font-display font-bold text-sm">{LABELS[state.type]}</p>
      </div>
      <div>
        <label className="font-mono text-[11px] text-wc-textMute block mb-1.5">Autoplay direction</label>
        <select value={state.direction} onChange={(e) => setState((s) => ({ ...s, direction: e.target.value as "left" | "right" }))}
          className="bg-wc-panelAlt border border-wc-line rounded px-2.5 py-2 text-wc-text font-body text-[13px]">
          <option value="left">Left</option><option value="right">Right</option>
        </select>
      </div>
      <div>
        <label className="font-mono text-[11px] text-wc-textMute block mb-1.5">Speed (px/sec)</label>
        <input type="number" min={5} max={200} value={state.speedPxPerSec} onChange={(e) => setState((s) => ({ ...s, speedPxPerSec: Number(e.target.value) }))}
          className="bg-wc-panelAlt border border-wc-line rounded px-2.5 py-2 text-wc-text font-body text-[13px] w-24" />
      </div>
      <label className="flex items-center gap-2 font-body text-[13px] text-wc-textSoft">
        <input type="checkbox" checked={state.active} onChange={(e) => setState((s) => ({ ...s, active: e.target.checked }))} /> Active
      </label>
      <label className="flex items-center gap-2 font-body text-[13px] text-wc-textSoft">
        <input type="checkbox" checked={state.pauseOnHover} onChange={(e) => setState((s) => ({ ...s, pauseOnHover: e.target.checked }))} /> Pause on hover
      </label>
      <Button onClick={save} disabled={saving} className="px-4 py-2 text-[13px]">{saving ? "Saving…" : "Save"}</Button>
      <p className="w-full font-body text-[12px] text-wc-textMute mt-1">
        Autoplay always resumes this direction/speed after a visitor drags the carousel and lets go.
      </p>
    </div>
  );
}
