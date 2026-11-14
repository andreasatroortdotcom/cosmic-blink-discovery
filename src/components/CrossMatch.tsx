import { useEffect, useRef, useState } from "react";
import { ExternalLink, Layers, MousePointer2 } from "lucide-react";
import { SkyCanvas, type ViewOpts } from "./SkyCanvas";
import type { Target } from "@/lib/sky";

export const SURVEYS = [
  { id: "CDS/P/DSS2/color", sv: "DSS2 Red", name: "DSS2 Optical", meta: "Visible · 1980s–1990s" },
  { id: "CDS/P/2MASS/color", sv: "2MASS-K", name: "2MASS", meta: "Near-IR J/H/Ks · 1997–2001" },
  { id: "CDS/P/allWISE/color", sv: "WISE 3.4", name: "AllWISE", meta: "Mid-IR 3.4/4.6 µm · 2010–2011" },
  { id: "CDS/P/unWISE/color-W2-W1W2-W1", sv: "WISE 4.6", name: "unWISE / NEOWISE", meta: "W1+W2 · 2010–2020 coadd" },
] as const;

export function cutoutUrl(hips: string, ra: number, dec: number, fovDeg: number, px = 300) {
  return `https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=${encodeURIComponent(hips)}&width=${px}&height=${px}&fov=${fovDeg}&projection=TAN&coordsys=icrs&ra=${ra}&dec=${dec}&format=jpg&stretch=asinh`;
}
/** NASA SkyView cutout, used when the CDS image service doesn't answer. */
export function skyviewUrl(survey: string, ra: number, dec: number, fovDeg: number, px = 300) {
  return `https://skyview.gsfc.nasa.gov/current/cgi/runquery.pl?Survey=${encodeURIComponent(survey)}&Position=${ra},${dec}&Size=${fovDeg}&Pixels=${px}&Return=JPEG`;
}
function Cutout({ s, ra, dec, fovDeg }: { s: (typeof SURVEYS)[number]; ra: number; dec: number; fovDeg: number }) {
  const srcs = [cutoutUrl(s.id, ra, dec, fovDeg), skyviewUrl(s.sv, ra, dec, fovDeg)];
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [ra, dec, fovDeg]);
  if (i >= srcs.length) return <div className="grid h-full w-full place-items-center p-3 text-center text-[11px] text-muted-foreground">{s.name} archive is offline right now — use IRSA below.</div>;
  return <img src={srcs[i]} onError={() => setI((n) => n + 1)} alt={`${s.name} image at RA ${ra.toFixed(3)} Dec ${dec.toFixed(3)}`} loading="lazy" className="h-full w-full object-cover" />;
}
export function externalLinks(ra: number, dec: number) {
  const c = `${ra.toFixed(5)} ${dec >= 0 ? "+" : ""}${dec.toFixed(5)}`;
  return [
    { name: "CDS Portal", href: `https://cdsportal.u-strasbg.fr/?target=${encodeURIComponent(c)}` },
    { name: "SIMBAD", href: `https://simbad.cds.unistra.fr/simbad/sim-coo?Coord=${encodeURIComponent(c)}&Radius=2&Radius.unit=arcmin` },
    { name: "IRSA Finder Chart", href: `https://irsa.ipac.caltech.edu/applications/finderchart/?locstr=${encodeURIComponent(c)}&subsize=0.1` },
  ];
}

const Cross = () => (
  <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
    <g stroke="var(--accent)" strokeWidth="0.6" fill="none"><line x1="50" y1="30" x2="50" y2="44" /><line x1="50" y1="56" x2="50" y2="70" /><line x1="30" y1="50" x2="44" y2="50" /><line x1="56" y1="50" x2="70" y2="50" /><circle cx="50" cy="50" r="9" strokeDasharray="2 2" /></g>
  </svg>
);

type AladinApi = { setImageSurvey: (id: string) => void; gotoRaDec: (ra: number, dec: number) => void; setFoV: (d: number) => void };
type AWin = { A?: { init: Promise<void>; aladin: (el: HTMLElement, o: object) => AladinApi } };
let aladinScript: Promise<void> | null = null;
function loadAladin() {
  aladinScript ??= new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js"; s.charset = "utf-8"; s.onload = () => res(); s.onerror = () => { aladinScript = null; rej(new Error("load")); }; document.head.appendChild(s); });
  return aladinScript;
}

function AladinView({ ra, dec, fovDeg, survey }: { ra: number; dec: number; fovDeg: number; survey: string }) {
  const el = useRef<HTMLDivElement>(null); const api = useRef<AladinApi | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let dead = false;
    loadAladin().then(async () => { const A = (window as unknown as AWin).A!; await A.init; if (dead || !el.current) return;
      api.current = A.aladin(el.current, { survey, fov: fovDeg, target: `${ra} ${dec}`, cooFrame: "ICRS", showReticle: true, showLayersControl: false, showFullscreenControl: true, showGotoControl: false });
      setState("ready"); }).catch(() => !dead && setState("error"));
    return () => { dead = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { api.current?.setImageSurvey(survey); }, [survey]);
  useEffect(() => { api.current?.gotoRaDec(ra, dec); api.current?.setFoV(fovDeg); }, [ra, dec, fovDeg]);
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-background">
      <div ref={el} className="h-full w-full" />
      {state !== "ready" && <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">{state === "loading" ? "Loading Aladin Lite…" : "Couldn't load the interactive viewer — use the cutouts above."}</div>}
    </div>
  );
}

export function CrossMatch({ target, opts }: { target: Target; opts: ViewOpts }) {
  const fovDeg = Math.max(0.02, opts.fov * 0.1);
  const [live, setLive] = useState(false);
  const [survey, setSurvey] = useState<string>(SURVEYS[2].id);
  const [blink, setBlink] = useState(false); const [bi, setBi] = useState(0);
  useEffect(() => { if (!blink) return; const id = setInterval(() => setBi((i) => (i + 1) % 2), 800); return () => clearInterval(id); }, [blink]);
  const still: ViewOpts = { ...opts, diff: false, gaia: false, playing: false };
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold"><Layers className="h-4 w-4 text-accent" />Multi-Survey Cross-Match</h2>
        <button onClick={() => setBlink((b) => !b)} aria-pressed={blink} className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${blink ? "border-accent bg-accent/15 text-accent" : "border-border text-muted-foreground"}`}>Blink 2MASS ↔ AllWISE{blink ? " · on" : ""}</button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">Same coordinates and field of view in every survey. If the object sits on the crosshair in SPHEREx but is offset or missing in older images, it has moved — or it's new.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <figure className="space-y-1">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-primary"><SkyCanvas target={target} opts={still} className="h-full w-full" bare /><Cross /></div>
          <figcaption className="text-[11px]"><b>SPHEREx</b> <span className="text-muted-foreground">· 0.75–5.0 µm · 2025–26 (simulated)</span></figcaption>
        </figure>
        {(blink ? [SURVEYS[bi === 0 ? 1 : 2]!] : SURVEYS).map((s) => (
          <figure key={blink ? "blink" : s.id} className="space-y-1">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-background">
              <Cutout s={s} ra={target.ra} dec={target.dec} fovDeg={fovDeg} />
              <Cross />
            </div>
            <figcaption className="text-[11px]"><b>{s.name}</b> <span className="text-muted-foreground">· {s.meta}</span></figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => setLive((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary"><MousePointer2 className="h-3.5 w-3.5" />{live ? "Hide" : "Open"} interactive Aladin Lite</button>
        {live && <select value={survey} onChange={(e) => setSurvey(e.target.value)} aria-label="Survey" className="rounded-full border border-border bg-card px-3 py-1.5 text-xs">{SURVEYS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
      </div>
      {live && <div className="mt-3"><AladinView ra={target.ra} dec={target.dec} fovDeg={fovDeg} survey={survey} /></div>}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {externalLinks(target.ra, target.dec).map((l) => <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 hover:border-primary hover:text-primary">{l.name}<ExternalLink className="h-3 w-3" /></a>)}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">Historical images: CDS HiPS, falling back to NASA SkyView. SPHEREx tile is the app's simulated field.</p>
    </section>
  );
}
