import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, Award, Flame } from "lucide-react";
import { Shell } from "@/components/Shell";
import { useStats } from "@/lib/store";
import { rankFor, streak, fmtRA, fmtDec } from "@/lib/sky";

export const Route = createFileRoute("/log")({
  head: () => ({ meta: [
    { title: "My Discovery Log — Astroswipe" },
    { name: "description", content: "Your flagged SPHEREx candidates, review stats, streak and citizen-scientist rank." },
    { property: "og:title", content: "My Discovery Log — Astroswipe" },
    { property: "og:description", content: "Track your brown dwarf, asteroid and Planet X candidates." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Log,
});

const BADGES = [["Stargazer", "Start swiping"], ["Stellar Scout", "Review 5 fields"], ["Brown Dwarf Hunter", "20 reviews + 3 brown dwarfs"], ["Planet X Pioneer", "50 reviews + 3 Planet X flags"]];

function Log() {
  const { stats, removeFlag } = useStats();
  const rank = rankFor(stats);
  const ri = BADGES.findIndex((b) => b[0] === rank);
  const st = streak(stats.days, new Date().toISOString().slice(0, 10));
  return (
    <Shell>
      <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-glow">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Current rank</p>
        <h1 className="font-display text-3xl font-bold text-glow text-primary">{rank}</h1>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[["Reviewed", stats.reviewed], ["Flagged", stats.flags.length], ["Day streak", st]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-secondary/60 p-3"><div className="font-display text-2xl font-bold">{v}</div><div className="text-[11px] text-muted-foreground">{k}</div></div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {BADGES.map(([b, d], i) => <span key={b} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${i <= ri ? "border-accent text-accent" : "border-border text-muted-foreground opacity-60"}`} title={d}>{i <= ri ? <Award className="h-3 w-3" /> : null}{b} <span className="opacity-70">· {d}</span></span>)}
        </div>
        {st > 0 && <p className="mt-3 inline-flex items-center gap-1 text-xs text-warning"><Flame className="h-3 w-3" />Keep the streak alive tomorrow!</p>}
      </div>
      <h2 className="mb-3 font-display text-lg font-semibold">Discovery Log</h2>
      {stats.flags.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No candidates yet. <Link to="/" search={{}} className="text-primary underline">Start swiping</Link> and flag anything that moves.</p>
      ) : (
        <ul className="space-y-2">
          {stats.flags.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
              <Link to="/inspect" search={{ ra: f.ra, dec: f.dec }} className="min-w-0 flex-1">
                <div className="font-medium">{f.name} <span className="ml-1 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">{f.cls === "Unknown anomaly" ? "Something changed" : f.cls}</span></div>
                <div className="font-mono text-[11px] text-muted-foreground">{fmtRA(f.ra)} {fmtDec(f.dec)} · {new Date(f.at).toLocaleString()}</div>
              </Link>
              <button aria-label="Remove" onClick={() => removeFlag(f.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
