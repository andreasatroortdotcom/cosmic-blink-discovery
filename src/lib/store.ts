import { useEffect, useState, useCallback } from "react";
import type { Stats, Flag } from "./sky";
const KEY = "astroswipe.stats.v1";
const empty: Stats = { reviewed: 0, flags: [], days: [] };
export function useStats() {
  const [stats, setStats] = useState<Stats>(empty);
  useEffect(() => { try { const v = localStorage.getItem(KEY); if (v) setStats(JSON.parse(v)); } catch {} }, []);
  const update = useCallback((fn: (s: Stats) => Stats) => setStats((s) => { const n = fn(s); localStorage.setItem(KEY, JSON.stringify(n)); return n; }), []);
  const review = useCallback((flag?: Flag) => update((s) => { const d = new Date().toISOString().slice(0, 10); return { reviewed: s.reviewed + 1, flags: flag ? [flag, ...s.flags] : s.flags, days: s.days.includes(d) ? s.days : [...s.days, d] }; }), [update]);
  const removeFlag = useCallback((id: string) => update((s) => ({ ...s, flags: s.flags.filter((f) => f.id !== id) })), [update]);
  return { stats, review, removeFlag };
}
