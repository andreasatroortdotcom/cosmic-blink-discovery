import { useSyncExternalStore } from "react";

const KEY = "astroswipe.muted.v1";
let muted: boolean | null = null;
const subs = new Set<() => void>();
function isMuted() { if (muted === null) muted = typeof window !== "undefined" && localStorage.getItem(KEY) === "1"; return muted; }
export function setMuted(v: boolean) { muted = v; localStorage.setItem(KEY, v ? "1" : "0"); subs.forEach((f) => f()); }
export function useMuted() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, isMuted, () => false);
}

let ctx: AudioContext | null = null;
function ac() {
  if (isMuted() || typeof window === "undefined") return null;
  const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  ctx ??= new C();
  if (ctx.state === "suspended") void ctx.resume();
  // Browsers keep audio locked until the user interacts with the page.
  return ctx.state === "running" ? ctx : null;
}
function tone(c: AudioContext, freq: number, start: number, dur: number, gain: number, type: OscillatorType = "sine") {
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(gain, start + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(c.destination); o.start(start); o.stop(start + dur + 0.05);
  return o;
}
/** Soft radar tick on each epoch blink. */
export function tick() { const c = ac(); if (c) tone(c, 1400, c.currentTime, 0.06, 0.025, "triangle"); }
/** Uplifting major-chord chime for a flag. */
export function chime() { const c = ac(); if (!c) return; const t = c.currentTime; [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, t + i * 0.07, 0.9, 0.06)); }
/** Sci-fi resonance sweep for toggling difference imaging. */
export function resonance(on: boolean) {
  const c = ac(); if (!c) return; const t = c.currentTime;
  const o = tone(c, on ? 180 : 520, t, 0.5, 0.05, "sawtooth"); o.frequency.exponentialRampToValueAtTime(on ? 520 : 180, t + 0.45);
  tone(c, on ? 360 : 260, t, 0.6, 0.03);
}
/** Spectral sonification: one note per band, low→high wavelength, pitch follows relative flux (0..1). */
export function sonify(flux: number[], seconds = 5) {
  const c = ac(); if (!c || !flux.length) return 0;
  const t = c.currentTime + 0.05; const o = c.createOscillator(); const g = c.createGain();
  o.type = "sine"; const step = seconds / flux.length;
  flux.forEach((f, i) => o.frequency.linearRampToValueAtTime(pitchFor(f), t + i * step));
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.1); g.gain.setValueAtTime(0.08, t + seconds - 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + seconds + 0.05);
  return seconds;
}
/** Brighter infrared flux → higher pitch (220 Hz to 1320 Hz). */
export function pitchFor(f: number) { return 220 + Math.max(0, Math.min(1, f)) * 1100; }
