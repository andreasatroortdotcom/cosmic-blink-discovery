import { BANDS, type BandId } from "@/lib/sky";
import type { ViewOpts } from "./SkyCanvas";
import { Slider } from "@/components/ui/slider";
import { Layers, Crosshair, Gauge } from "lucide-react";

export function SkyControls({ opts, set }: { opts: ViewOpts; set: (o: ViewOpts) => void }) {
  const chip = (on: boolean) => `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:px-3 sm:py-1.5 sm:text-xs transition ${on ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`;
  return (
    <div className="space-y-2 sm:space-y-3" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <button aria-pressed={opts.diff} className={chip(opts.diff)} onClick={() => set({ ...opts, diff: !opts.diff })}><Layers className="h-3.5 w-3.5" /><span className="sm:hidden">Diff</span><span className="hidden sm:inline">Difference</span></button>
        <button aria-pressed={opts.gaia} className={chip(opts.gaia)} onClick={() => set({ ...opts, gaia: !opts.gaia })}><Crosshair className="h-3.5 w-3.5" />Gaia<span className="hidden sm:inline"> overlay</span></button>
        <div className="inline-flex items-center gap-1 rounded-full border border-border px-1 py-0.5">
          <Gauge className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          {[["Slow", 0.5, "½×"], ["Normal", 1, "1×"], ["Fast", 2.2, "2×"]].map(([l, v, sh]) => (
            <button key={l} aria-label={`${l} blink`} aria-pressed={opts.speed === v} onClick={() => set({ ...opts, speed: v as number })} className={`rounded-full px-2 py-0.5 text-[11px] sm:py-1 sm:text-xs ${opts.speed === v ? "bg-primary/25 text-primary" : "text-muted-foreground"}`}><span className="sm:hidden">{sh}</span><span className="hidden sm:inline">{l}</span></button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <select value={opts.band} onChange={(e) => set({ ...opts, band: e.target.value as BandId })} aria-label="Infrared band" className="h-8 min-w-0 flex-1 rounded-md sm:h-9 border border-border bg-card px-2 font-mono text-xs">
          {BANDS.map((b) => <option key={b.id} value={b.id}>{b.label} · {b.range}</option>)}
        </select>
        <div className="flex w-32 shrink-0 items-center sm:w-40 gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">FOV</span>
          <Slider min={0.3} max={1.5} step={0.05} value={[opts.fov]} onValueChange={([v]) => set({ ...opts, fov: v ?? 1 })} />
          <span className="w-8 font-mono text-[10px]">{(opts.fov * 6).toFixed(1)}′</span>
        </div>
      </div>
    </div>
  );
}
