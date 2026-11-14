import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Radar, Flame, Telescope, Users, AlertTriangle } from "lucide-react";
import { Shell } from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { fmtRA, fmtDec } from "@/lib/sky";
import { DB_TO_LABEL } from "@/lib/swipes";

export const Route = createFileRoute("/radar")({
  head: () => ({ meta: [
    { title: "Anomaly Radar — Astroswipe community discoveries" },
    { name: "description", content: "Live global stats and high-consensus SPHEREx sky patches flagged by multiple citizen scientists." },
    { property: "og:title", content: "Anomaly Radar — Astroswipe" },
    { property: "og:description", content: "See which sky patches the community flags most, then inspect and vote." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: RadarPage,
});

function useRadar() {
  const stats = useQuery({ queryKey: ["radar", "stats"], refetchInterval: 15000, queryFn: async () => {
    const { data, error } = await supabase.from("swipe_stats").select("*").single(); if (error) throw error; return data;
  } });
  const top = useQuery({ queryKey: ["radar", "top"], refetchInterval: 15000, queryFn: async () => {
    const { data, error } = await supabase.from("candidate_patches").select("*").order("flaggers", { ascending: false }).order("flags", { ascending: false }).order("last_at", { ascending: false }).limit(50);
    if (error) throw error; return data ?? [];
  } });
  return { stats, top };
}

function RadarPage() {
  const { stats, top } = useRadar();
  useEffect(() => {
    const ch = supabase.channel(`radar-${crypto.randomUUID()}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "swipes" }, () => { void stats.refetch(); void top.refetch(); }).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const s = stats.data;
  const cards = [
    { k: "Sky patches inspected", v: s?.patches_inspected, i: Telescope },
    { k: "Anomalies flagged", v: s?.anomalies_flagged, i: AlertTriangle },
    { k: "Total swipes", v: s?.total_swipes, i: Radar },
    { k: "Volunteers", v: s?.volunteers, i: Users },
  ];
  return (
    <Shell>
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><Radar className="h-6 w-6 text-primary" />Anomaly Radar</h1>
      <p className="mb-4 text-sm text-muted-foreground">Every swipe from every volunteer, aggregated live. Patches flagged by 2+ different people are high-priority for verification.</p>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(({ k, v, i: I }) => (
          <div key={k} className="rounded-2xl border border-border bg-card p-4"><I className="mb-2 h-4 w-4 text-accent" /><div className="font-display text-2xl font-bold">{v ?? "—"}</div><div className="text-[11px] text-muted-foreground">{k}</div></div>
        ))}
      </div>
      <h2 className="mb-3 font-display text-lg font-semibold">Top candidates</h2>
      {top.isError && <p className="text-sm text-destructive">Couldn't load community data. Try again shortly.</p>}
      {top.data && top.data.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No anomalies flagged yet — <Link to="/" search={{}} className="text-primary underline">be the first</Link>.</p>}
      <ul className="space-y-2">
        {top.data?.map((c) => {
          const hot = (c.flaggers ?? 0) >= 2;
          return (
            <li key={c.patch_id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 ${hot ? "border-accent shadow-glow" : "border-border"}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">{hot && <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent"><Flame className="h-3 w-3" />High priority</span>}{c.constellation || "Unknown"} <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">{DB_TO_LABEL[c.top_type ?? "unknown"] ?? c.top_type}</span></div>
                <div className="font-mono text-[11px] text-muted-foreground">{fmtRA(c.ra ?? 0)} {fmtDec(c.dec ?? 0)} · {c.flags} flags by {c.flaggers} volunteer{c.flaggers === 1 ? "" : "s"} · {c.static_votes} static</div>
              </div>
              <Link to="/" search={{ ra: c.ra ?? 0, dec: c.dec ?? 0 }} className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">Inspect & vote</Link>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}
