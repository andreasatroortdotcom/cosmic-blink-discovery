import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/Shell";
import { TARGETS, fmtRA, fmtDec } from "@/lib/sky";

export const Route = createFileRoute("/community")({
  head: () => ({ meta: [
    { title: "Community Candidates — Astroswipe" },
    { name: "description", content: "Vote on and verify moving-object candidates flagged by fellow SPHEREx citizen scientists." },
    { property: "og:title", content: "Community Candidates — Astroswipe" },
    { property: "og:description", content: "Help verify brown dwarf, asteroid and Planet X candidates." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Community,
});

const SEED = [
  { id: "c1", user: "nebula_nora", t: "wise0855", cls: "Brown Dwarf candidate", up: 41, down: 2, ago: "12 min" },
  { id: "c2", user: "kuiper_kid", t: "planetx", cls: "Planet X candidate", up: 87, down: 9, ago: "38 min" },
  { id: "c3", user: "dr_parallax", t: "barnard", cls: "Unknown anomaly", up: 12, down: 30, ago: "1 h" },
  { id: "c4", user: "mira_watch", t: "rdra", cls: "Variable Star", up: 55, down: 1, ago: "2 h" },
  { id: "c5", user: "rockhound", t: "f1", cls: "Asteroid/Comet", up: 23, down: 4, ago: "3 h" },
  { id: "c6", user: "ir_ines", t: "f3", cls: "Brown Dwarf candidate", up: 9, down: 3, ago: "5 h" },
];
const KEY = "astroswipe.votes.v1";

function Community() {
  const [votes, setVotes] = useState<Record<string, 1 | -1>>({});
  useEffect(() => { try { setVotes(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch {} }, []);
  const vote = (id: string, v: 1 | -1) => setVotes((s) => { const n = { ...s }; if (n[id] === v) delete n[id]; else n[id] = v; localStorage.setItem(KEY, JSON.stringify(n)); return n; });
  return (
    <Shell>
      <h1 className="font-display text-2xl font-bold">Community candidates</h1>
      <p className="mb-4 text-sm text-muted-foreground">Recent flags from other volunteers. 50+ net votes marks a candidate as community-verified for follow-up. <span className="opacity-70">(Sample data for the demo.)</span></p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SEED.map((c) => {
          const t = TARGETS.find((x) => x.id === c.t)!; const my = votes[c.id] ?? 0;
          const up = c.up + (my === 1 ? 1 : 0), down = c.down + (my === -1 ? 1 : 0); const net = up - down;
          return (
            <li key={c.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div><Link to="/inspect" search={{ ra: t.ra, dec: t.dec }} className="font-display font-semibold hover:text-primary">{t.name}</Link>
                  <div className="font-mono text-[11px] text-muted-foreground">{fmtRA(t.ra)} {fmtDec(t.dec)}</div></div>
                {net >= 50 && <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] text-success"><ShieldCheck className="h-3 w-3" />Verified</span>}
              </div>
              <p className="mt-2 text-sm"><span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs text-primary">{c.cls}</span> <span className="text-muted-foreground">by @{c.user} · {c.ago} ago</span></p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => vote(c.id, 1)} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${my === 1 ? "border-success text-success" : "border-border"}`}><ThumbsUp className="h-3 w-3" />Confirm {up}</button>
                <button onClick={() => vote(c.id, -1)} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${my === -1 ? "border-destructive text-destructive" : "border-border"}`}><ThumbsDown className="h-3 w-3" />Reject {down}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}
