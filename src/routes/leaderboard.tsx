import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Shell } from "@/components/Shell";
import { GoogleButton } from "@/components/AuthButton";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { POINTS, VERIFY_VOTES_NEEDED, titleFor, nextTitle } from "@/lib/points";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [
    { title: "Leaderboard — Astroswipe top sky hunters" },
    { name: "description", content: "Top Astroswipe citizen scientists ranked by reviews, verifications and confirmed SPHEREx discoveries." },
    { property: "og:title", content: "Astroswipe Leaderboard" },
    { property: "og:description", content: "Who found the most moving objects in the SPHEREx sky?" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Board,
});

function Board() {
  const { user, ready } = useUser();
  const q = useQuery({ queryKey: ["leaderboard"], refetchInterval: 20000, queryFn: async () => {
    const { data, error } = await supabase.from("leaderboard").select("*").order("points", { ascending: false }).limit(100);
    if (error) throw error; return data ?? [];
  } });
  const me = q.data?.find((r) => r.user_id === user?.id);
  const pts = me?.points ?? 0; const up = nextTitle(pts);
  return (
    <Shell>
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><Trophy className="h-6 w-6 text-accent" />Leaderboard</h1>
      <p className="mb-4 text-sm text-muted-foreground">+{POINTS.review} per review · +{POINTS.verify} per verification vote · +{POINTS.firstFlag} for being first to flag · +{POINTS.confirmedBonus} bonus when {VERIFY_VOTES_NEEDED} volunteers confirm (70%) your discovery.</p>
      <section className="mb-6 rounded-2xl border border-border bg-card p-5">
        {!ready ? null : !user ? (
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">You're swiping as a guest. Sign in to earn points and appear on the leaderboard.</p><GoogleButton /></div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div><div className="font-display text-lg font-semibold">{me?.display_name ?? user.user_metadata?.['full_name'] ?? "You"}</div><div className="text-sm text-accent">{titleFor(pts)}</div></div>
              <div className="text-right"><div className="font-display text-3xl font-bold text-primary">{pts}</div><div className="text-[11px] text-muted-foreground">points</div></div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
              {[["Reviews", me?.reviews], ["Verified", me?.verifications], ["First flags", me?.first_flags], ["Confirmed", me?.confirmed]].map(([k, v]) => <div key={k as string} className="rounded-lg bg-secondary p-2"><div className="text-base text-foreground">{v ?? 0}</div><div className="text-muted-foreground">{k}</div></div>)}
            </div>
            {up && <p className="text-xs text-muted-foreground">{up.at - pts} points to <b className="text-foreground">{up.name}</b></p>}
            <SignOutButton className="text-muted-foreground" />
          </div>
        )}
      </section>
      {q.data?.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No ranked volunteers yet — sign in and start swiping.</p>}
      <ol className="space-y-2">
        {q.data?.map((r, i) => (
          <li key={r.user_id} className={`flex items-center gap-3 rounded-xl border bg-card p-3 ${r.user_id === user?.id ? "border-primary" : "border-border"}`}>
            <span className="w-6 text-center font-mono text-sm text-muted-foreground">{i + 1}</span>
            {r.avatar_url ? <img src={r.avatar_url} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full" /> : <span className="h-8 w-8 rounded-full bg-secondary" />}
            <div className="min-w-0 flex-1"><div className="truncate font-medium">{r.display_name ?? "Volunteer"}</div><div className="text-[11px] text-muted-foreground">{titleFor(r.points ?? 0)} · {r.confirmed} confirmed · {r.first_flags} first flags</div></div>
            <span className="font-display text-lg font-bold text-primary">{r.points}</span>
          </li>
        ))}
      </ol>
    </Shell>
  );
}
