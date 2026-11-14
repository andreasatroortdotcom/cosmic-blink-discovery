import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, Pencil } from "lucide-react";
import { Shell } from "@/components/Shell";
import { BadgeGrid } from "@/components/BadgeGrid";
import { ShareImageDialog, DiscoveryShare } from "@/components/ShareImageDialog";
import { useStats } from "@/lib/store";
import { useBadgeCtx, unlockedIds, BADGES } from "@/lib/badges";
import { renderPassport } from "@/lib/shareCard";
import { rankFor, streak, fmtRA, fmtDec } from "@/lib/sky";
import { useUser } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [
    { title: "Researcher Passport — Astroswipe" },
    { name: "description", content: "Your citizen-scientist profile: callsign, SPHEREx patches inspected, candidates flagged, streak, rank and badges." },
    { property: "og:title", content: "Researcher Passport — Astroswipe" },
    { property: "og:description", content: "A shareable citizen-scientist ID card for the SPHEREx Planet X hunt." },
    { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Profile,
});

const CALLSIGN = "astroswipe.callsign";

function Profile() {
  const { stats } = useStats();
  const ctx = useBadgeCtx();
  const { user } = useUser();
  const [callsign, setCallsign] = useState("");
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem(CALLSIGN);
    const meta = user?.user_metadata as { full_name?: string } | undefined;
    setCallsign(saved || meta?.full_name?.split(" ")[0] || `Volunteer-${Math.floor(1000 + Math.random() * 9000)}`);
  }, [user]);
  const save = (v: string) => { const c = v.trim().slice(0, 18) || callsign; setCallsign(c); localStorage.setItem(CALLSIGN, c); setEditing(false); };
  const rank = rankFor(stats);
  const st = streak(stats.days, new Date().toISOString().slice(0, 10));
  const unlocked = unlockedIds(ctx);
  return (
    <Shell>
      <h1 className="mb-3 font-display text-2xl font-bold">Researcher Passport</h1>
      <section className="mb-6 rounded-3xl border border-border bg-card p-5 shadow-glow">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Callsign</p>
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); save(new FormData(e.currentTarget).get("c") as string); }} className="flex gap-2">
            <input name="c" defaultValue={callsign} maxLength={18} autoFocus aria-label="Callsign" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 font-display text-xl" />
            <button className="rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">Save</button>
          </form>
        ) : (
          <div className="flex items-center gap-2"><p className="font-display text-3xl font-bold">{callsign}</p><button aria-label="Edit callsign" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button></div>
        )}
        <p className="mt-1 inline-flex items-center gap-1 text-sm text-primary"><BadgeCheck className="h-4 w-4" />{rank}</p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[["Patches inspected", stats.reviewed], ["Candidates flagged", stats.flags.length], ["Day streak", st]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-secondary/60 p-3"><div className="font-display text-2xl font-bold">{v}</div><div className="text-[11px] text-muted-foreground">{k}</div></div>
          ))}
        </div>
        <div className="mt-4">
          <ShareImageDialog label="Export profile card" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            render={() => renderPassport({ callsign, rank, reviewed: stats.reviewed, flagged: stats.flags.length, streak: st, badges: unlocked })}
            filename={`astroswipe-passport-${callsign}.png`} title="Researcher passport" shareText={`${callsign} — ${rank} on Astroswipe, hunting Planet X in SPHEREx data.`} shareUrl="https://cosmic-blink-discovery.lovable.app/" />
        </div>
      </section>
      <h2 className="mb-3 font-display text-lg font-semibold">Badges <span className="font-mono text-sm text-muted-foreground">{unlocked.length}/{BADGES.length}</span></h2>
      <div className="mb-6"><BadgeGrid ctx={ctx} /></div>
      <h2 className="mb-3 font-display text-lg font-semibold">My discoveries</h2>
      {stats.flags.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nothing flagged yet. <Link to="/" search={{}} className="text-primary underline">Start swiping</Link>.</p>
      ) : (
        <ul className="space-y-2">{stats.flags.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
            <Link to="/inspect" search={{ ra: f.ra, dec: f.dec }} className="min-w-0 flex-1"><div className="font-medium">{f.name}</div><div className="font-mono text-[11px] text-muted-foreground">{fmtRA(f.ra)} {fmtDec(f.dec)} · {new Date(f.at).toLocaleDateString()}</div></Link>
            <DiscoveryShare name={f.name} ra={f.ra} dec={f.dec} />
          </li>))}</ul>
      )}
      <p className="mt-4 text-xs text-muted-foreground">You've cast {stats.reviewed} votes in total ({stats.reviewed - stats.flags.length} static, {stats.flags.length} "something changed").</p>
    </Shell>
  );
}
