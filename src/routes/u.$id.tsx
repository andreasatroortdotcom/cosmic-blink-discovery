import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { Shell } from "@/components/Shell";
import { BadgeGrid } from "@/components/BadgeGrid";
import { ShareImageDialog } from "@/components/ShareImageDialog";
import { fetchPublicProfile, BADGES, unlockedIds } from "@/lib/badges";
import { renderPassport } from "@/lib/shareCard";
import { rankFor, streak } from "@/lib/sky";

export const Route = createFileRoute("/u/$id")({
  head: () => ({ meta: [
    { title: "Citizen Scientist Profile — Astroswipe" },
    { name: "description", content: "A volunteer's SPHEREx Planet X hunt progress: patches inspected, candidates flagged and badges earned." },
    { property: "og:title", content: "Citizen Scientist Profile — Astroswipe" },
    { property: "og:description", content: "See this volunteer's badges and progress in the SPHEREx citizen-science sky hunt." },
    { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["public-profile", id], queryFn: () => fetchPublicProfile(id), retry: false });
  const p = q.data;
  return (
    <Shell>
      <h1 className="mb-3 font-display text-2xl font-bold">Citizen Scientist Profile</h1>
      {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {(q.isError || (q.isSuccess && !p)) && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">This profile doesn't exist. <Link to="/" search={{}} className="text-primary underline">Start your own hunt</Link>.</p>}
      {p && (() => {
        const rank = rankFor({ reviewed: p.reviewed, flags: [], days: p.days });
        const badges = [...new Set([...p.badges, ...unlockedIds({ reviewed: p.reviewed, flagKinds: [], events: {} })])];
        const st = streak(p.days, new Date().toISOString().slice(0, 10));
        return (<>
          <section className="mb-6 rounded-3xl border border-border bg-card p-5 shadow-glow">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Callsign</p>
            <p className="font-display text-3xl font-bold">{p.display_name}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-primary"><BadgeCheck className="h-4 w-4" />{rank} · member since {new Date(p.member_since).toLocaleDateString()}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[["Patches inspected", p.reviewed], ["Candidates flagged", p.flagged], ["Day streak", st]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-secondary/60 p-3"><div className="font-display text-2xl font-bold">{v}</div><div className="text-[11px] text-muted-foreground">{k}</div></div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <ShareImageDialog label="Passport card" className="inline-flex items-center gap-2 rounded-full border border-accent px-4 py-2 text-sm font-semibold text-accent"
                render={() => renderPassport({ callsign: p.display_name, rank, reviewed: p.reviewed, flagged: p.flagged, streak: st, badges })}
                filename={`astroswipe-passport-${p.display_name}.png`} title="Researcher passport" shareText={`${p.display_name} — ${rank} on Astroswipe`} shareUrl={typeof window !== "undefined" ? window.location.href : undefined} />
              <Link to="/" search={{}} className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Join the hunt</Link>
            </div>
          </section>
          <h2 className="mb-3 font-display text-lg font-semibold">Badges <span className="font-mono text-sm text-muted-foreground">{badges.length}/{BADGES.length}</span></h2>
          <BadgeGrid ctx={{ reviewed: p.reviewed, flagKinds: [], events: {} }} unlocked={badges} />
        </>);
      })()}
    </Shell>
  );
}
