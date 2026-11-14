import { BANDS, type BandId } from "@/lib/sky";
import type { ViewOpts } from "./SkyCanvas";
import { Slider } from "@/components/ui/slider";
import { Layers, Crosshair, Gauge } from "lucide-react";

export function SkyControls({ opts, set }: { opts: ViewOpts; set: (o: ViewOpts) => void }) {
  const chip = (on: boolean) => `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`;
  return (
    <div className="space-y-3" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-2">
        <button className={chip(opts.diff)} onClick={() => set({ ...opts, diff: !opts.diff })}><Layers className="h-3.5 w-3.5" />Difference</button>
        <button className={chip(opts.gaia)} onClick={() => set({ ...opts, gaia: !opts.gaia })}><Crosshair className="h-3.5 w-3.5" />Gaia overlay</button>
        <div className="inline-flex items-center gap-1 rounded-full border border-border px-1 py-0.5">
          <Gauge className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          {[["Slow", 0.5], ["Normal", 1], ["Fast", 2.2]].map(([l, v]) => (
            <button key={l} onClick={() => set({ ...opts, speed: v as number })} className={`rounded-full px-2 py-1 text-xs ${opts.speed === v ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <select value={opts.band} onChange={(e) => set({ ...opts, band: e.target.value as BandId })} className="h-9 flex-1 rounded-md border border-border bg-card px-2 font-mono text-xs">
          {BANDS.map((b) => <option key={b.id} value={b.id}>{b.label} · {b.range}</option>)}
        </select>
        <div className="flex w-40 items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">FOV</span>
          <Slider min={0.3} max={1.5} step={0.05} value={[opts.fov]} onValueChange={([v]) => set({ ...opts, fov: v })} />
          <span className="w-8 font-mono text-[10px]">{(opts.fov * 6).toFixed(1)}′</span>
        </div>
      </div>
    </div>
  );
}
