import { useSyncExternalStore } from "react";
export const TOUR_STEPS = [
  { title: "WISE 0855 — the coldest brown dwarf", body: "We load the official benchmark target and blink between SPHEREx survey epochs ~6 months apart. Watch the faint source march across the field." },
  { title: "Difference imaging", body: "Subtracting the first epoch from each later one cancels static stars. A moving object leaves a black/white dipole — the signature of motion." },
  { title: "Gaia DR3 overlay", body: "Cyan circles are stars Gaia already catalogued (gold arrows = proper motion). The brown dwarf is far too cold for Gaia's optical eyes, so it gets a pink 'uncatalogued' box." },
  { title: "Flag & report", body: "Swipe right to flag it. Here we simulate the flag (no vote is recorded) and open the NASA Citizen Science Candidate Report, ready to export." },
] as const;
export const STEP_MS = 15000;
let step: number | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
export function setTourStep(s: number | null) { step = s !== null && s >= TOUR_STEPS.length ? null : s; emit(); }
export function useTourStep() { return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => step, () => null); }
