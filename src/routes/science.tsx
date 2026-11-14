import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Satellite, Telescope, History, Users, Rainbow, Layers, Crosshair, LineChart, ZoomIn, Link2 } from "lucide-react";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/science")({
  head: () => ({ meta: [
    { title: "Science & Mission — Astroswipe for SPHEREx and Gaia" },
    { name: "description", content: "How Astroswipe uses NASA SPHEREx multi-epoch infrared imaging and ESA Gaia astrometry to find Planet X, brown dwarfs and variable stars." },
    { property: "og:title", content: "Science & Mission — Astroswipe" },
    { property: "og:description", content: "From Tombaugh's blink comparator to crowdsourced SPHEREx review: the method behind Astroswipe." },
    { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Science,
});

const criteria = [
  { i: Rainbow, t: "102-band infrared decomposition", d: "Switch between SPHEREx's six detector arrays or a false-colour composite spanning 0.75–5.0 µm.", to: "/" as const },
  { i: Layers, t: "Difference imaging dipoles", d: "Epoch subtraction turns motion into black/white dipoles and brightening into residual flux.", to: "/" as const },
  { i: Crosshair, t: "Gaia proper-motion overlay", d: "Known Gaia sources are circled with motion vectors so uncatalogued movers stand out.", to: "/" as const },
  { i: LineChart, t: "On-the-fly spectra", d: "Every patch renders a 102-point spectral energy distribution in the Deep Dive inspector.", to: "/inspect" as const },
  { i: ZoomIn, t: "Adjustable field of view", d: "Zoom from wide survey context down to arcminute scale on any card.", to: "/" as const },
  { i: Link2, t: "Open coordinate query URLs", d: "Any view is shareable and embeddable via ?ra=…&dec=…&fov=… parameters.", to: "/inspect" as const },
];
const timeline = [
  { y: "1930", t: "Clyde Tombaugh discovers Pluto", d: "Flipping between photographic plates on a mechanical blink comparator at Lowell Observatory." },
  { y: "2009–11", t: "WISE maps the mid-infrared sky", d: "Revealing cold brown dwarfs like WISE 0855, the coldest known, at ~250 K." },
  { y: "2017", t: "Backyard Worlds: Planet 9", d: "Volunteers blinking WISE images find thousands of brown dwarf candidates." },
  { y: "2025→", t: "SPHEREx + Astroswipe", d: "Every 6 months a fresh 102-band all-sky map — reviewed by swiping, one patch at a time." },
];

function Science() {
  const card = "rounded-2xl border border-border bg-card p-5";
  return (
    <Shell>
      <header className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">NASA Space Apps · Planet X and SPHEREx</p>
        <h1 className="font-display text-3xl font-bold">Science &amp; Mission</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Astroswipe turns two flagship surveys into a crowdsourced blink comparator, so anyone can help find what moves or changes in the infrared sky.</p>
      </header>

      <h2 className="mb-3 font-display text-xl font-semibold">Mission overview</h2>
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <article className={card}><Satellite className="mb-2 h-6 w-6 text-primary" /><h3 className="font-display font-semibold">NASA SPHEREx</h3>
          <p className="mt-1 text-sm text-muted-foreground">Launched in 2025, SPHEREx maps the entire sky every ~6 months in 102 near-infrared bands from 0.75 to 5.0 µm. Each survey is a new epoch: comparing them reveals objects that move, brighten or fade, and the spectra show what they're made of.</p>
          <ul className="mt-3 space-y-1 font-mono text-[11px] text-muted-foreground"><li>· All-sky, 6.2″ pixels</li><li>· 102 spectral channels across 6 arrays</li><li>· 4 epochs over a 2-year baseline</li></ul></article>
        <article className={card}><Telescope className="mb-2 h-6 w-6 text-accent" /><h3 className="font-display font-semibold">ESA Gaia</h3>
          <p className="mt-1 text-sm text-muted-foreground">Gaia measured positions, parallaxes and proper motions for ~1.8 billion stars. Cross-matching with Gaia DR3 removes known movers, so what remains in SPHEREx difference images is genuinely uncatalogued.</p>
          <ul className="mt-3 space-y-1 font-mono text-[11px] text-muted-foreground"><li>· Micro-arcsecond astrometry</li><li>· Proper-motion vectors for known stars</li><li>· Optical-only: blind to the coldest objects</li></ul></article>
      </div>

      <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold"><History className="h-5 w-5 text-primary" />The challenge &amp; the method</h2>
      <ol className="mb-4 space-y-3 border-l border-primary/40 pl-5">
        {timeline.map((e) => (<li key={e.y} className="relative"><span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary shadow-glow" />
          <div className="font-mono text-xs text-accent">{e.y}</div><div className="font-semibold">{e.t}</div><p className="text-sm text-muted-foreground">{e.d}</p></li>))}
      </ol>
      <div className={`${card} mb-8 grid gap-4 text-sm sm:grid-cols-3`}>
        <div><b>Planet X / Kuiper objects</b><p className="text-muted-foreground">Extremely cold, slow movers: a faint dipole that shifts a few pixels between epochs.</p></div>
        <div><b>Brown dwarfs</b><p className="text-muted-foreground">Bright at 4–5 µm, faint below 1 µm, with methane and water absorption, often with high proper motion.</p></div>
        <div><b>Variable stars</b><p className="text-muted-foreground">Stay put but change flux: a single-signed residual in the difference image.</p></div>
      </div>

      <h2 className="mb-3 font-display text-xl font-semibold">How Astroswipe meets the challenge criteria</h2>
      <ul className="mb-8 grid gap-3 sm:grid-cols-2">
        {criteria.map(({ i: I, t, d, to }) => (
          <li key={t}><Link to={to} search={to === "/" ? {} : { ra: 133.795, dec: -7.245 }} className={`${card} flex gap-3 transition hover:border-primary`}>
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div><div className="flex items-center gap-2 font-semibold"><I className="h-4 w-4 text-primary" />{t}</div><p className="text-sm text-muted-foreground">{d}</p><span className="text-xs text-primary">Try it →</span></div>
          </Link></li>))}
      </ul>

      <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold"><Users className="h-5 w-5 text-primary" />Citizen science impact</h2>
      <div className={`${card} mb-4 space-y-3 text-sm text-muted-foreground`}>
        <p>Each SPHEREx epoch is a huge volume of data, far too much for a few astronomers to inspect by eye. Astroswipe splits it into millions of small, deterministic sky patches that take a few seconds each to judge.</p>
        <div className="grid gap-3 sm:grid-cols-4">
          {[["1", "Swipe", "Volunteers mark a patch static or \"something changed\"."], ["2", "Verify", "Flags go to 10 independent volunteers; 70% agreement confirms."], ["3", "Final call", "Experienced volunteers settle disputed cases."], ["4", "Report", "Vetted candidates export as structured reports for follow-up."]].map(([n, t, d]) => (
            <div key={n} className="rounded-xl bg-secondary/50 p-3"><div className="font-display text-2xl font-bold text-primary">{n}</div><div className="font-semibold text-foreground">{t}</div><p className="text-xs">{d}</p></div>))}
        </div>
        <p>Server-side duplicate-vote protection and rate limits keep consensus honest, so astronomers get a short list of high-confidence candidates instead of raw survey data.</p>
      </div>
      <div className="flex flex-wrap gap-3"><Link to="/" search={{}} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Start hunting</Link><Link to="/radar" className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary">See community candidates</Link></div>
    </Shell>
  );
}
