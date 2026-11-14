import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { SkyCanvas, type ViewOpts } from "@/components/SkyCanvas";
import { SkyControls } from "@/components/SkyControls";
import { fmtRA, fmtDec, spectrum, targetForCoords, EPOCHS, buildField } from "@/lib/sky";

type S = { ra: number; dec: number; fov?: number };
export const Route = createFileRoute("/inspect")({
  validateSearch: (s: Record<string, unknown>): S => ({ ra: Number(s.ra ?? 269.452) || 0, dec: Number(s.dec ?? 4.6934) || 0, fov: s.fov !== undefined ? Number(s.fov) : undefined }),
  head: () => ({ meta: [
    { title: "Deep Dive Inspector — Astroswipe" },
    { name: "description", content: "Inspect a SPHEREx sky patch: 102-band infrared spectrum, epochs, coordinates and report export." },
    { property: "og:title", content: "Deep Dive Inspector — Astroswipe" },
    { property: "og:description", content: "102-band SPHEREx spectrum and multi-epoch blink for any coordinates." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Inspect,
});

function Inspect() {
  const { ra, dec, fov } = Route.useSearch();
  const t = useMemo(() => targetForCoords(ra, dec), [ra, dec]);
  const sed = useMemo(() => spectrum(t), [t]);
  const [opts, setOpts] = useState<ViewOpts>({ diff: false, gaia: true, band: "composite", fov: fov ?? 1, speed: 1 });
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/inspect?ra=${ra}&dec=${dec}&fov=${opts.fov}`;
  const main = buildField(t).find((s) => s.anomaly || s.var || Math.abs(s.vx) > 0.01);
  const pm = main ? (Math.hypot(main.vx, main.vy) * 6 * 60 * 2).toFixed(2) : "0";
  const W = 600, H = 220;
  const path = sed.points.map((p, i) => `${i ? "L" : "M"}${((Math.log(p.w / 0.75) / Math.log(5 / 0.75)) * W).toFixed(1)},${(H - p.f * (H - 20)).toFixed(1)}`).join(" ");

  const report = () => {
    const blob = new Blob([JSON.stringify({ target: t.name, ra, dec, raHMS: fmtRA(ra), decDMS: fmtDec(dec), fovArcmin: opts.fov * 6, epochs: EPOCHS, properMotionArcsecPerYr: Number(pm), sedTempK: Math.round(sed.temp), spectrum: sed.points.map((p) => ({ um: +p.w.toFixed(4), relFlux: +p.f.toFixed(4) })), url, generated: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `astroswipe-${t.id}.json`; a.click();
  };

  return (
    <Shell>
      <Link to="/" search={{}} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to feed</Link>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-border shadow-glow"><SkyCanvas target={t} opts={opts} className="aspect-square w-full" /></div>
          <SkyControls opts={opts} set={setOpts} />
        </div>
        <div className="space-y-4">
          <div><h1 className="font-display text-2xl font-bold">{t.name}</h1><p className="text-sm text-muted-foreground">{t.constellation} · {t.blurb}</p></div>
          <dl className="grid grid-cols-2 gap-2 font-mono text-xs">
            {[["RA", fmtRA(ra)], ["Dec", fmtDec(dec)], ["RA (deg)", ra.toFixed(5)], ["Dec (deg)", dec.toFixed(5)], ["Motion", `${pm}″/yr`], ["Fit T_eff", `${Math.round(sed.temp)} K`]].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-card p-2"><dt className="text-muted-foreground">{k}</dt><dd className="text-sm">{v}</dd></div>
            ))}
          </dl>
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-2 font-display text-sm font-semibold">102-band SPHEREx spectrum (SED)</h2>
            <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full">
              <defs><linearGradient id="sg" x1="0" x2="1"><stop offset="0" stopColor="var(--info)" /><stop offset="1" stopColor="var(--accent)" /></linearGradient></defs>
              {[0.75, 1, 2, 3, 4, 5].map((w) => { const x = (Math.log(w / 0.75) / Math.log(5 / 0.75)) * W; return <g key={w}><line x1={x} x2={x} y1={0} y2={H} stroke="var(--border)" /><text x={Math.min(x + 2, W - 30)} y={H + 14} fontSize="11" fill="var(--muted-foreground)" fontFamily="JetBrains Mono">{w}µm</text></g>; })}
              <path d={path} fill="none" stroke="url(#sg)" strokeWidth="2.5" />
              {sed.points.map((p, i) => <circle key={i} cx={(Math.log(p.w / 0.75) / Math.log(5 / 0.75)) * W} cy={H - p.f * (H - 20)} r="1.8" fill="var(--foreground)" />)}
            </svg>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Share link copied"); }} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><Copy className="h-4 w-4" />Copy share link</button>
            <button onClick={report} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Download className="h-4 w-4" />Export report</button>
          </div>
          <p className="break-all font-mono text-[10px] text-muted-foreground">?ra={ra}&dec={dec}&fov={opts.fov}</p>
        </div>
      </div>
    </Shell>
  );
}
