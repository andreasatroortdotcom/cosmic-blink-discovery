import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { X, Star, Globe, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { SkyCanvas, type ViewOpts } from "@/components/SkyCanvas";
import { SkyControls } from "@/components/SkyControls";
import { TARGETS, CLASSES, EPOCHS, BANDS, fmtRA, fmtDec, parseQuery, targetForCoords, type Target, type Classification } from "@/lib/sky";
import { useStats } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type S = { ra?: number; dec?: number; fov?: number };
export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): S => ({
    ra: s.ra !== undefined && isFinite(Number(s.ra)) ? Number(s.ra) : undefined,
    dec: s.dec !== undefined && isFinite(Number(s.dec)) ? Number(s.dec) : undefined,
    fov: s.fov !== undefined && isFinite(Number(s.fov)) ? Number(s.fov) : undefined,
  }),
  head: () => ({ meta: [
    { title: "Astroswipe — Swipe the SPHEREx sky for Planet X" },
    { name: "description", content: "Blink through SPHEREx infrared survey epochs and flag moving objects, brown dwarfs and variable stars." },
    { property: "og:title", content: "Astroswipe — Swipe the SPHEREx sky" },
    { property: "og:description", content: "Citizen science: find brown dwarfs, asteroids and Planet X candidates in SPHEREx data." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Feed,
});

function Feed() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const { stats, review } = useStats();
  const deck = useMemo(() => {
    if (search.ra !== undefined && search.dec !== undefined) { const t = targetForCoords(search.ra, search.dec); return [t, ...TARGETS.filter((x) => x.id !== t.id)]; }
    return TARGETS;
  }, [search.ra, search.dec]);
  const [idx, setIdx] = useState(0);
  const [opts, setOpts] = useState<ViewOpts>({ diff: false, gaia: false, band: "composite", fov: search.fov ?? 1, speed: 1 });
  const [classify, setClassify] = useState(false);
  const [q, setQ] = useState("");
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const start = useRef({ x: 0, y: 0 });
  const t = deck[idx % deck.length];

  const next = () => { setIdx((i) => i + 1); setDrag({ x: 0, y: 0, active: false }); };
  const pass = () => { review(); toast("Static sky logged", { description: t.name }); next(); };
  const inspect = () => nav({ to: "/inspect", search: { ra: t.ra, dec: t.dec, fov: opts.fov } });
  const flag = (cls: Classification) => {
    review({ id: `${t.id}-${Date.now()}`, targetId: t.id, name: t.name, ra: t.ra, dec: t.dec, cls, at: Date.now() });
    setClassify(false); toast.success("Added to your Discovery Log", { description: `${cls} · ${t.name}` }); next();
  };
  const load = (x: Target) => { const i = deck.findIndex((d) => d.id === x.id); if (i >= 0) setIdx(i); else nav({ to: "/", search: { ra: x.ra, dec: x.dec } }); };
  const doSearch = (e: React.FormEvent) => { e.preventDefault(); const r = parseQuery(q); if (!r) return toast.error("Try a name or “RA Dec”, e.g. 08h55m10.8s -07d14m42.5s"); setIdx(0); nav({ to: "/", search: { ra: r.ra, dec: r.dec, fov: opts.fov } }); };

  const up = () => { const { x, y } = drag; if (x > 110) { setDrag({ ...drag, active: false }); setClassify(true); } else if (x < -110) pass(); else if (y < -110) inspect(); else setDrag({ x: 0, y: 0, active: false }); };
  const hint = drag.x > 40 ? "FLAG" : drag.x < -40 ? "STATIC" : drag.y < -40 ? "INSPECT" : null;

  return (
    <Shell>
      <form onSubmit={doSearch} className="mb-3 flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Barnard's Star · 133.795 -7.245 · 08h55m10.8s -07d14m42.5s" className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-3 font-mono text-xs outline-none focus:border-primary" /></div>
        <button className="rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">Go</button>
      </form>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-accent"><Sparkles className="h-3 w-3" />NASA targets</span>
        {TARGETS.filter((x) => x.benchmark).map((x) => (
          <button key={x.id} onClick={() => load(x)} className={`shrink-0 rounded-full border px-3 py-1 text-xs ${t.id === x.id ? "border-accent bg-accent/15 text-accent" : "border-border text-muted-foreground"}`}>{x.name}</button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,460px)_1fr]">
        <div className="mx-auto w-full max-w-[460px]">
          <div className="relative">
            <div className="absolute inset-x-4 top-3 h-full rounded-3xl border border-border bg-card/40" />
            <article
              className="relative touch-none select-none overflow-hidden rounded-3xl border border-border bg-card shadow-glow"
              style={{ transform: `translate(${drag.x}px, ${Math.min(drag.y, 0)}px) rotate(${drag.x / 18}deg)`, transition: drag.active ? "none" : "transform .3s" }}
              onPointerDown={(e) => { start.current = { x: e.clientX, y: e.clientY }; setDrag({ x: 0, y: 0, active: true }); (e.target as Element).setPointerCapture?.(e.pointerId); }}
              onPointerMove={(e) => drag.active && setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true })}
              onPointerUp={up} onPointerCancel={() => setDrag({ x: 0, y: 0, active: false })}
            >
              <div className="relative">
                <SkyCanvas target={t} opts={opts} className="aspect-square w-full" />
                {hint && <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border-4 px-4 py-1 font-display text-3xl font-black ${hint === "FLAG" ? "border-success text-success" : hint === "STATIC" ? "border-destructive text-destructive" : "border-info text-info"}`}>{hint}</div>}
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><h1 className="font-display text-xl font-bold">{t.name}</h1><p className="text-xs text-muted-foreground">{t.constellation}</p></div>
                  <div className="text-right font-mono text-[11px] leading-5"><div>RA {fmtRA(t.ra)}</div><div>Dec {fmtDec(t.dec)}</div></div>
                </div>
                <p className="text-sm text-muted-foreground">{t.blurb}</p>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-muted-foreground">
                  <span className="rounded bg-secondary px-1.5 py-0.5">{EPOCHS[0]} → {EPOCHS[EPOCHS.length - 1]}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5">{BANDS.find((b) => b.id === opts.band)!.range}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5">102 bands · 6.2″/px</span>
                </div>
                <SkyControls opts={opts} set={setOpts} />
              </div>
            </article>
          </div>
          <div className="mt-5 flex items-center justify-center gap-6">
            <button aria-label="Static sky" onClick={pass} className="grid h-16 w-16 place-items-center rounded-full border-2 border-destructive text-destructive transition active:scale-90"><X className="h-8 w-8" /></button>
            <button aria-label="Deep dive" onClick={inspect} className="grid h-12 w-12 place-items-center rounded-full border-2 border-info text-info transition active:scale-90"><Star className="h-6 w-6" /></button>
            <button aria-label="Flag anomaly" onClick={() => setClassify(true)} className="grid h-16 w-16 place-items-center rounded-full border-2 border-success text-success transition active:scale-90"><Globe className="h-8 w-8" /></button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">← static · ↑ inspect · flag moving object →</p>
        </div>
        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">How to hunt</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• The image blinks between SPHEREx survey epochs ~6 months apart.</li>
              <li>• Anything that jumps or pulses is interesting. Turn on <b className="text-foreground">Difference</b> to see black/white dipoles.</li>
              <li>• <b className="text-foreground">Gaia overlay</b> circles known stars (gold = proper motion). Pink boxes are uncatalogued.</li>
              <li>• Cold brown dwarfs glow at 4–5 µm — try Array 6.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 font-mono text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Reviewed</span><span>{stats.reviewed}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Flagged</span><span>{stats.flags.length}</span></div>
          </div>
        </aside>
      </div>

      <Dialog open={classify} onOpenChange={setClassify}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">What did you spot?</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            {CLASSES.map((c) => <button key={c} onClick={() => flag(c)} className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-left text-sm font-medium hover:border-primary hover:bg-primary/10">{c}</button>)}
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
