import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TARGETS, targetForCoords, type Stats, type Kind } from "./sky";

export type BadgeEvent = "diff" | "gaia" | "spectral" | "validator";
export interface BadgeCtx { reviewed: number; flagKinds: Kind[]; events: Partial<Record<BadgeEvent, number>> }
export interface Badge { id: string; emoji: string; name: string; desc: string; goal: number; value: (c: BadgeCtx) => number }

const ev = (e: BadgeEvent) => (c: BadgeCtx) => c.events[e] ?? 0;
export const BADGES: Badge[] = [
  { id: "first-light", emoji: "🔭", name: "First Light", desc: "Inspect your first sky patch", goal: 1, value: (c) => c.reviewed },
  { id: "survey-pioneer", emoji: "🌌", name: "Survey Pioneer", desc: "Review 25 sky patches", goal: 25, value: (c) => c.reviewed },
  { id: "planet-x-hunter", emoji: "🪐", name: "Planet X Hunter", desc: "Flag a Planet X / Kuiper candidate", goal: 1, value: (c) => c.flagKinds.filter((k) => k === "planet-x").length },
  { id: "brown-dwarf-scout", emoji: "🤎", name: "Brown Dwarf Scout", desc: "Flag an infrared mover (brown dwarf)", goal: 1, value: (c) => c.flagKinds.filter((k) => k === "brown-dwarf" || k === "binary-bd").length },
  { id: "spectral-analyst", emoji: "📊", name: "Spectral Analyst", desc: "Inspect the 102-band spectrum or play its sonification", goal: 1, value: ev("spectral") },
  { id: "diff-detective", emoji: "➖", name: "Diff Detective", desc: "Use difference imaging to spot movement", goal: 1, value: ev("diff") },
  { id: "gaia-navigator", emoji: "⭐", name: "Gaia Navigator", desc: "Use the Gaia overlay to cross-match stars", goal: 1, value: ev("gaia") },
  { id: "community-validator", emoji: "🏆", name: "Community Validator", desc: "Vote on a community candidate", goal: 1, value: ev("validator") },
];

export const progress = (b: Badge, c: BadgeCtx) => Math.min(b.value(c), b.goal);
export const isUnlocked = (b: Badge, c: BadgeCtx) => b.value(c) >= b.goal;
export const unlockedIds = (c: BadgeCtx) => BADGES.filter((b) => isUnlocked(b, c)).map((b) => b.id);

export function kindOfFlag(f: { targetId: string; ra: number; dec: number }): Kind {
  return TARGETS.find((t) => t.id === f.targetId)?.kind ?? targetForCoords(f.ra, f.dec).kind;
}

const STATS = "astroswipe.stats.v1", EVENTS = "astroswipe.events.v1", SEEN = "astroswipe.badges.v1";
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };

export function readCtx(): BadgeCtx {
  const s = read<Stats>(STATS, { reviewed: 0, flags: [], days: [] });
  return { reviewed: s.reviewed, flagKinds: s.flags.map(kindOfFlag), events: read(EVENTS, {}) };
}

/** Compare unlocked badges with the ones already celebrated and toast new ones. */
export function checkBadges() {
  if (typeof window === "undefined") return;
  const now = unlockedIds(readCtx());
  const seen = read<string[]>(SEEN, []);
  const fresh = now.filter((id) => !seen.includes(id));
  if (fresh.length) {
    localStorage.setItem(SEEN, JSON.stringify([...seen, ...fresh]));
    for (const id of fresh) { const b = BADGES.find((x) => x.id === id)!; toast.success(`${b.emoji} Badge unlocked: ${b.name}`, { description: b.desc, className: "badge-toast" }); }
  }
  window.dispatchEvent(new Event("astroswipe:badges"));
}

export function markEvent(e: BadgeEvent) {
  if (typeof window === "undefined") return;
  const cur = read<Partial<Record<BadgeEvent, number>>>(EVENTS, {});
  localStorage.setItem(EVENTS, JSON.stringify({ ...cur, [e]: (cur[e] ?? 0) + 1 }));
  checkBadges();
}

export function useBadgeCtx() {
  const [c, setC] = useState<BadgeCtx>({ reviewed: 0, flagKinds: [], events: {} });
  useEffect(() => { const f = () => setC(readCtx()); f(); window.addEventListener("astroswipe:badges", f); return () => window.removeEventListener("astroswipe:badges", f); }, []);
  return c;
}
