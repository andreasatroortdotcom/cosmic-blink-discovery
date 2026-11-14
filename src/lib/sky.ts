export type Kind = "high-pm" | "brown-dwarf" | "binary-bd" | "variable" | "planet-x" | "asteroid" | "static";
export interface Target {
  id: string; name: string; constellation: string; ra: number; dec: number; // degrees
  kind: Kind; blurb: string; benchmark?: boolean; fov?: number;
}
export const EPOCHS = ["2025-05", "2025-11", "2026-05", "2026-11"];
export const BANDS = [
  { id: "composite", label: "False-color composite", range: "0.75–5.0 µm" },
  { id: "d1", label: "Array 1", range: "0.75–1.09 µm" },
  { id: "d2", label: "Array 2", range: "1.10–1.62 µm" },
  { id: "d3", label: "Array 3", range: "1.63–2.41 µm" },
  { id: "d4", label: "Array 4", range: "2.42–3.82 µm" },
  { id: "d5", label: "Array 5", range: "3.83–4.41 µm" },
  { id: "d6", label: "Array 6", range: "4.42–5.00 µm" },
] as const;
export type BandId = (typeof BANDS)[number]["id"];

export const TARGETS: Target[] = [
  { id: "barnard", name: "Barnard's Star", constellation: "Ophiuchus", ra: 269.452, dec: 4.6934, kind: "high-pm", benchmark: true, blurb: "Highest proper motion star in the sky — 10.3″/yr, marching visibly between epochs." },
  { id: "wise0855", name: "WISE 0855−0714", constellation: "Hydra", ra: 133.79513, dec: -7.24515, kind: "brown-dwarf", benchmark: true, blurb: "Coldest known brown dwarf (~285 K). Invisible in optical, bright at 4.5 µm, fast-moving." },
  { id: "epsindib", name: "Epsilon Indi B", constellation: "Indus", ra: 330.84, dec: -56.786, kind: "binary-bd", benchmark: true, blurb: "Brown dwarf pair Ba/Bb orbiting the K dwarf ε Indi A, sharing its proper motion." },
  { id: "rwaur", name: "RW Aurigae", constellation: "Auriga", ra: 76.9563, dec: 30.4013, kind: "variable", benchmark: true, blurb: "Young T Tauri variable with dramatic dimming events from its disk." },
  { id: "rdra", name: "R Draconis", constellation: "Draco", ra: 246.4398, dec: 66.7529, kind: "variable", benchmark: true, blurb: "Mira-type long-period variable pulsing over ~246 days." },
  { id: "planetx", name: "Simulated Planet X", constellation: "Orion (sim.)", ra: 85.2, dec: -12.5, kind: "planet-x", benchmark: true, blurb: "Injected slow, faint, red mover consistent with a distant Kuiper Belt / Planet Nine object." },
  { id: "f1", name: "Field 1182-A", constellation: "Cetus", ra: 28.4, dec: -9.1, kind: "asteroid", blurb: "Ecliptic field — main-belt traffic expected." },
  { id: "f2", name: "Field 0441-C", constellation: "Cygnus", ra: 305.2, dec: 41.7, kind: "static", blurb: "Dense galactic-plane star field." },
  { id: "f3", name: "Field 2207-B", constellation: "Ursa Major", ra: 165.9, dec: 55.3, kind: "brown-dwarf", blurb: "High-latitude field with an unidentified red source." },
  { id: "f4", name: "Field 3310-D", constellation: "Pisces", ra: 12.7, dec: 7.4, kind: "static", blurb: "Quiet extragalactic field." },
  { id: "f5", name: "Field 0912-E", constellation: "Leo", ra: 160.1, dec: 12.9, kind: "variable", blurb: "Point source with irregular brightness." },
];

export function mulberry(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const seedOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);

export interface Src { x: number; y: number; mag: number; temp: number; vx: number; vy: number; var: number; known: boolean; anomaly: boolean }
/** Positions in field units (-1..1). vx/vy per epoch. */
export function buildField(t: Target): Src[] {
  const r = mulberry(seedOf(t.id + t.ra.toFixed(2)));
  const n = t.constellation === "Cygnus" ? 260 : 140;
  const out: Src[] = [];
  for (let i = 0; i < n; i++) out.push({ x: r() * 2 - 1, y: r() * 2 - 1, mag: Math.pow(r(), 3) * 1 + 0.15, temp: 3000 + r() * 7000, vx: (r() - 0.5) * 0.002, vy: (r() - 0.5) * 0.002, var: 0, known: true, anomaly: false });
  const add = (s: Partial<Src>) => out.push({ x: 0, y: 0, mag: 1, temp: 4000, vx: 0, vy: 0, var: 0, known: false, anomaly: true, ...s });
  switch (t.kind) {
    case "high-pm": add({ x: -0.15, y: 0.12, mag: 1.4, temp: 3100, vx: 0.07, vy: -0.05, known: true }); break;
    case "brown-dwarf": add({ x: -0.1, y: -0.05, mag: 0.9, temp: 300, vx: 0.05, vy: 0.03 }); break;
    case "binary-bd": add({ x: 0.2, y: 0.1, mag: 1.8, temp: 4600, vx: 0.035, vy: -0.01, known: true, anomaly: false }); add({ x: -0.15, y: 0.05, mag: 0.8, temp: 1300, vx: 0.035, vy: -0.01 }); add({ x: -0.12, y: 0.07, mag: 0.6, temp: 1000, vx: 0.035, vy: -0.01 }); break;
    case "variable": add({ x: 0.02, y: -0.03, mag: 1.2, temp: 2800, var: 0.75, known: true }); break;
    case "planet-x": add({ x: -0.05, y: 0.0, mag: 0.45, temp: 60, vx: 0.018, vy: 0.006 }); break;
    case "asteroid": add({ x: -0.5, y: 0.3, mag: 0.7, temp: 5200, vx: 0.32, vy: -0.12 }); break;
  }
  return out;
}

/** relative flux of a blackbody-ish source in a band (0..1+) */
export function bandFlux(temp: number, um: number) {
  const x = 14388 / (um * Math.max(temp, 40));
  const b = 1 / (Math.pow(um, 5) * (Math.exp(Math.min(x, 60)) - 1));
  const peak = 2898 / Math.max(temp, 40);
  const bp = 1 / (Math.pow(peak, 5) * (Math.exp(4.965) - 1));
  let f = b / bp;
  if (temp < 1500) { // methane / water absorption
    f *= 1 - 0.7 * Math.exp(-((um - 3.3) ** 2) / 0.08) - 0.4 * Math.exp(-((um - 1.4) ** 2) / 0.02) - 0.4 * Math.exp(-((um - 2.2) ** 2) / 0.05);
  }
  return Math.max(0, f);
}
export const BAND_UM: Record<BandId, number> = { composite: 2, d1: 0.92, d2: 1.36, d3: 2.0, d4: 3.1, d5: 4.1, d6: 4.7 };
export const WAVELENGTHS = Array.from({ length: 102 }, (_, i) => 0.75 * Math.pow(5 / 0.75, i / 101));

export function spectrum(t: Target) {
  const f = buildField(t);
  const main = f.find((s) => s.anomaly) ?? f.find((s) => s.var || s.vx > 0.01) ?? f[0]!;
  const r = mulberry(seedOf(t.id + "sed"));
  const vals = WAVELENGTHS.map((w) => bandFlux(main.temp, w) * (1 + (r() - 0.5) * 0.08));
  const max = Math.max(...vals, 1e-9);
  return { temp: main.temp, points: WAVELENGTHS.map((w, i) => ({ w, f: (vals[i] ?? 0) / max })) };
}

// ---- coordinates ----
export function fmtRA(deg: number) { const h = (((deg % 360) + 360) % 360) / 15; const hh = Math.floor(h); const m = (h - hh) * 60; const mm = Math.floor(m); const ss = (m - mm) * 60; return `${String(hh).padStart(2, "0")}h${String(mm).padStart(2, "0")}m${ss.toFixed(2).padStart(5, "0")}s`; }
export function fmtDec(deg: number) { const s = deg < 0 ? "−" : "+"; const a = Math.abs(deg); const d = Math.floor(a); const m = (a - d) * 60; const mm = Math.floor(m); const ss = (m - mm) * 60; return `${s}${String(d).padStart(2, "0")}°${String(mm).padStart(2, "0")}′${ss.toFixed(1).padStart(4, "0")}″`; }

/** Accepts "133.795 -7.245", "08h55m10.8s -07d14m42.5s", "08:55:10.8 -07:14:42.5" or a target name. */
export function parseQuery(q: string): { ra: number; dec: number; target?: Target } | null {
  const s = q.trim(); if (!s) return null;
  const low = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const t = TARGETS.find((t) => t.name.toLowerCase().replace(/[^a-z0-9]/g, "").includes(low) || t.id === low);
  if (t && /[a-z]/i.test(s)) return { ra: t.ra, dec: t.dec, target: t };
  const parts = s.replace(/,/g, " ").split(/\s+/);
  if (parts.length < 2) return null;
  const sex = (p: string) => p.split(/[hdms:°′″'"]+/).filter(Boolean).map(Number);
  const a = parts[0]!, b = parts.slice(1).join("");
  const isSex = /[hms:]/.test(a);
  let ra: number, dec: number;
  if (isSex) { const [h = NaN, m = 0, sc = 0] = sex(a); ra = (h + m / 60 + sc / 3600) * 15; const neg = /^[-−]/.test(b); const [d = NaN, dm = 0, ds = 0] = sex(b.replace(/^[-−+]/, "")); dec = (neg ? -1 : 1) * (d + dm / 60 + ds / 3600); }
  else { ra = Number(a); dec = Number(b.replace("−", "-")); }
  if (!isFinite(ra) || !isFinite(dec) || ra < 0 || ra >= 360 || Math.abs(dec) > 90) return null;
  return { ra, dec };
}
export function targetForCoords(ra: number, dec: number): Target {
  const near = TARGETS.find((t) => Math.abs(t.ra - ra) < 0.05 && Math.abs(t.dec - dec) < 0.05);
  if (near) return near;
  const kinds: Kind[] = ["static", "static", "asteroid", "variable", "brown-dwarf", "static"];
  const r = mulberry(seedOf(`${ra.toFixed(3)},${dec.toFixed(3)}`));
  return { id: `c${ra.toFixed(3)}_${dec.toFixed(3)}`, name: `Custom field ${fmtRA(ra).slice(0, 6)}`, constellation: "Custom", ra, dec, kind: kinds[Math.floor(r() * kinds.length)] ?? "static", blurb: "User-requested coordinates." };
}

// ---- gamification ----
export type Classification = "Brown Dwarf candidate" | "Asteroid/Comet" | "Planet X candidate" | "Variable Star" | "Unknown anomaly";
export const CLASSES: Classification[] = ["Brown Dwarf candidate", "Asteroid/Comet", "Planet X candidate", "Variable Star", "Unknown anomaly"];
export interface Flag { id: string; targetId: string; name: string; ra: number; dec: number; cls: Classification; at: number }
export interface Stats { reviewed: number; flags: Flag[]; days: string[] }
export function rankFor(s: Stats) {
  const px = s.flags.filter((f) => f.cls === "Planet X candidate").length;
  const bd = s.flags.filter((f) => f.cls === "Brown Dwarf candidate").length;
  if (px >= 3 && s.reviewed >= 50) return "Planet X Pioneer";
  if (bd >= 3 && s.reviewed >= 20) return "Brown Dwarf Hunter";
  if (s.reviewed >= 5) return "Stellar Scout";
  return "Stargazer";
}
export function streak(days: string[], today: string) {
  const set = new Set(days); let n = 0; const d = new Date(today + "T00:00:00Z");
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}
