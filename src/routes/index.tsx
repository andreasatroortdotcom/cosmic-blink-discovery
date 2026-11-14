import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { X, Star, Globe, Search, Sparkles, Shuffle, Infinity as InfinityIcon, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { SkyCanvas, type ViewOpts } from "@/components/SkyCanvas";
import { SkyControls } from "@/components/SkyControls";
import { TARGETS, EPOCHS, BANDS, fmtRA, fmtDec, parseQuery, targetForCoords, randomPatch, type Target, type Classification } from "@/lib/sky";
import { useStats } from "@/lib/store";
import { recordSwipe, seenSet, syncSeen, fetchVerifyQueue, alreadyFlagged, type SwipeResult } from "@/lib/swipes";
import { useUser } from "@/lib/auth";
import { isVerifySlot, POINTS, VERIFY_VOTES_NEEDED } from "@/lib/points";
import { ShieldCheck } from "lucide-react";
import { patchKey } from "@/lib/sky";
import { chime } from "@/lib/audio";
import { setTourStep, useTourStep } from "@/lib/tour";
import { ReportDialog } from "@/components/ReportDialog";

type S = { ra?: number | undefined; dec?: number | undefined; fov?: number | undefined };
export const Route = createFileRoute("/")({
  validateSearch: (s: { ra?: unknown; dec?: unknown; fov?: unknown }): S => ({
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
  const base = useMemo(() => {
    if (search.ra !== undefined && search.dec !== undefined) { const t = targetForCoords(search.ra, search.dec); return [t, ...TARGETS.filter((x) => x.id !== t.id)]; }
    return TARGETS;
  }, [search.ra, search.dec]);
  const [deck, setDeck] = useState<Target[]>(base);
  const [endless, setEndless] = useState(true);
  const seen = useRef<Set<string>>(new Set());
  const { user } = useUser();
  // Flagged patches waiting for independent verification; mixed into up to 20% of the feed.
  const queue = useRef<Target[]>([]);
  const verifyKeys = useRef<Map<string, number>>(new Map());
  const loadQueue = async () => {
    const rows = await fetchVerifyQueue(seen.current, user?.id);
    queue.current = rows.map((r) => { verifyKeys.current.set(r.patch_id!, (r.yes_votes ?? 0) + (r.no_votes ?? 0)); return targetForCoords(r.ra!, r.dec!); });
  };
  const fill = (pos: number) => { if (isVerifySlot(pos)) { while (queue.current.length) { const v = queue.current.shift()!; if (!seen.current.has(patchKey(v))) return v; } } return freshRandom(); };
  // Never serve a patch this volunteer already reviewed (except an explicitly linked one).
  const freshRandom = () => { for (let i = 0; i < 50; i++) { const p = randomPatch(); if (!seen.current.has(patchKey(p))) return p; } return randomPatch(); };
  const filterSeen = (d: Target[], keepFirst: boolean) => {
    const out = d.filter((x, i) => (keepFirst && i === 0) || !seen.current.has(patchKey(x)));
    return out.length ? out : [freshRandom(), freshRandom()];
  };
  const linked = search.ra !== undefined && search.dec !== undefined;
  useEffect(() => {
    seen.current = seenSet(); setDeck(linked ? filterSeen(base, true) : Array.from({ length: 5 }, () => freshRandom())); setIdx(0); setEndless(!linked);
    void syncSeen().then(async (s) => { seen.current = s; await loadQueue(); setDeck((d) => (linked ? filterSeen(d, true) : d.map((x, i) => (isVerifySlot(i) ? fill(i) : x)))); });
  }, [base, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [idx, setIdx] = useState(0);
  const [opts, setOpts] = useState<ViewOpts>({ diff: false, gaia: false, band: "composite", fov: search.fov ?? 1, speed: 1 });
  const [q, setQ] = useState("");
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const start = useRef({ x: 0, y: 0 });
  const t = deck[Math.min(idx, deck.length - 1)]!;
  // Judge tour: drive the real card through WISE 0855 → difference → Gaia → simulated flag + report.
  const tour = useTourStep();
  const wise = TARGETS.find((x) => x.id === "wise0855")!;
  useEffect(() => {
    if (tour === null) return;
    if (tour === 0) { if (search.ra !== wise.ra || search.dec !== wise.dec) void nav({ to: "/", search: { ra: wise.ra, dec: wise.dec } }); setIdx(0); setOpts((o) => ({ ...o, diff: false, gaia: false, band: "composite", speed: 1 })); }
    if (tour === 1) setOpts((o) => ({ ...o, diff: true, gaia: false }));
    if (tour === 2) setOpts((o) => ({ ...o, diff: false, gaia: true }));
    if (tour === 3) { chime(); toast.success("Simulated flag: something changed", { description: "Demo only — no vote was recorded." }); }
  }, [tour]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => {
    seen.current.add(patchKey(t));
    setDeck((d) => {
      const rest = d.slice(idx + 1).filter((x) => !seen.current.has(patchKey(x)));
      const head = d.slice(0, idx + 1);
      const out = [...head, ...rest];
      while (out.length < idx + 4) out.push(endless ? fill(out.length) : freshRandom());
      return out;
    });
    setIdx((i) => i + 1); setDrag({ x: 0, y: 0, active: false });
    if (queue.current.length < 3) void loadQueue();
  };
  const isVerify = verifyKeys.current.has(patchKey(t));
  const award = (pts: number, why: string) => { if (user) toast.success(`+${pts} points`, { description: why }); };
  const report = (r: SwipeResult) => {
    if (r === "duplicate") toast("You've already reviewed this patch", { description: "Each volunteer gets one vote per patch." });
    else if (r === "rate_limited") toast.error("Slow down a little", { description: "Too many reviews in a short time — try again in a minute." });
    else if (r === "error") toast.error("Couldn't save that review");
    return r === "ok";
  };
  const pass = async () => { const r = await recordSwipe(t, "static"); if (r === "rate_limited") { report(r); return; } if (report(r)) { review(); if (user) award(isVerify ? POINTS.review + POINTS.verify : POINTS.review, isVerify ? "Verification vote counted" : t.name); else toast("Static sky logged", { description: t.name }); } next(); };
  const skip = async () => { const r = await recordSwipe(t, "skipped"); if (r === "rate_limited") { report(r); return; } report(r); next(); };
  const randomNow = () => { const rp = freshRandom(); setDeck((d) => [...d.slice(0, idx + 1), rp, ...d.slice(idx + 1)]); setIdx((i) => i + 1); };
  const toggleEndless = () => {
    if (endless) { setEndless(false); setDeck(filterSeen(base, false)); setIdx(0); return; }
    setEndless(true); setDeck(Array.from({ length: 5 }, () => freshRandom())); setIdx(0);
    toast("Endless Survey Mode", { description: "Random patches from across the whole sky." });
  };
  const inspect = () => nav({ to: "/inspect", search: { ra: t.ra, dec: t.dec, fov: opts.fov } });
  const flag = async (cls: Classification) => {
    const first = !isVerify && !(await alreadyFlagged(patchKey(t)));
    const r = await recordSwipe(t, "candidate", cls);
    if (r === "rate_limited") { report(r); return; }
    if (!report(r)) { next(); return; }
    chime();
    review({ id: `${t.id}-${Date.now()}`, targetId: t.id, name: t.name, ra: t.ra, dec: t.dec, cls, at: Date.now() });
    if (!user) toast.success("Flagged: something changed", { description: "Sign in with Google to earn points for your discoveries" });
    else if (isVerify) award(POINTS.review + POINTS.verify, "Verification vote counted");
    else if (first) award(POINTS.review + POINTS.firstFlag, `First to spot this! +${POINTS.confirmedBonus} more if ${VERIFY_VOTES_NEEDED} volunteers confirm it`);
    else award(POINTS.review, "Someone flagged this first — your vote still helps");
    next();
  };
  const load = (x: Target) => { const i = deck.findIndex((d) => d.id === x.id); if (i >= 0) setIdx(i); else nav({ to: "/", search: { ra: x.ra, dec: x.dec } }); };
  const doSearch = (e: React.FormEvent) => { e.preventDefault(); const r = parseQuery(q); if (!r) { toast.error("Try a name or “RA Dec”, e.g. 08h55m10.8s -07d14m42.5s"); return; } setIdx(0); nav({ to: "/", search: { ra: r.ra, dec: r.dec, fov: opts.fov } }); };

  const up = () => { const { x, y } = drag; if (x > 110) { setDrag({ ...drag, active: false }); void flag("Unknown anomaly"); } else if (x < -110) pass(); else if (y < -110) inspect(); else setDrag({ x: 0, y: 0, active: false }); };
  const hint = drag.x > 40 ? "FLAG" : drag.x < -40 ? "STATIC" : drag.y < -40 ? "INSPECT" : null;

  return (
    <Shell>
      <form onSubmit={doSearch} className="mb-3 flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Barnard's Star · 133.795 -7.245 · 08h55m10.8s -07d14m42.5s" className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-3 font-mono text-xs outline-none focus:border-primary" /></div>
        <button className="rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">Go</button>
      </form>
      <div className="mb-3 flex flex-wrap gap-2">
        <button onClick={randomNow} className="inline-flex items-center gap-1.5 rounded-full border border-primary/60 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Shuffle className="h-3.5 w-3.5" />Generate random sky patch</button>
        <button onClick={toggleEndless} aria-pressed={endless} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${endless ? "border-accent bg-accent/15 text-accent" : "border-border text-muted-foreground"}`}><InfinityIcon className="h-3.5 w-3.5" />Endless Survey Mode{endless ? " · on" : ""}</button>
      </div>
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
                {isVerify && <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-info bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-info"><ShieldCheck className="h-3.5 w-3.5" />Verify a flag · {verifyKeys.current.get(patchKey(t))}/{VERIFY_VOTES_NEEDED} votes</div>}
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
            <button aria-label="Flag anomaly" onClick={() => void flag("Unknown anomaly")} className="grid h-16 w-16 place-items-center rounded-full border-2 border-success text-success transition active:scale-90"><Globe className="h-8 w-8" /></button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">← static · ↑ inspect · something changes →</p>
          <div className="mt-1 text-center"><button onClick={skip} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"><SkipForward className="h-3 w-3" />Not sure — skip</button></div>
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
      <ReportDialog hideTrigger open={tour === 3} onOpenChange={(o) => { if (!o) setTourStep(null); }}
        input={{ patchId: patchKey(wise), ra: wise.ra, dec: wise.dec, constellation: wise.constellation, fov: wise.fov, flags: 1, flaggers: 1, staticVotes: 0, classification: "Something changed — brown dwarf benchmark (tour demo)" }} />
    </Shell>
  );
}
