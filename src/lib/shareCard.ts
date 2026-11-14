import { buildField, fmtRA, fmtDec, targetForCoords, type Kind } from "./sky";
import { BADGES } from "./badges";

export const SHARE_HOST = "cosmic-blink-discovery.lovable.app";
const C = { bg0: "#05060f", bg1: "#14123a", cyan: "#4fe3ff", mag: "#ff4fd8", gold: "#ffc857", fg: "#eef2ff", mute: "#9aa3c7", line: "rgba(255,255,255,0.14)" };
const KIND_LABEL: Record<Kind, string> = { "planet-x": "Planet X Candidate", "brown-dwarf": "Brown Dwarf", "binary-bd": "Brown Dwarf Binary", "high-pm": "High Proper-Motion Star", variable: "Variable Star", asteroid: "Moving Object", static: "Something changed" };

export interface DiscoveryCardInput { name: string; ra: number; dec: number; constellation?: string | null; category?: string; consensus?: number | null; votes?: number }
/** Benchmark targets show their known type; random patches stay "Something changed" (binary verdict). */
export function categoryFor(ra: number, dec: number) { const t = targetForCoords(ra, dec); return t.benchmark ? KIND_LABEL[t.kind] : "Something changed"; }

function bg(x: CanvasRenderingContext2D, w: number, h: number) {
  const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, C.bg0); g.addColorStop(1, C.bg1); x.fillStyle = g; x.fillRect(0, 0, w, h);
  let s = 42; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${0.1 + r() * 0.5})`; x.fillRect(r() * w, r() * h, r() * 2, r() * 2); }
}
function pill(x: CanvasRenderingContext2D, text: string, cx: number, y: number, color: string) {
  x.font = "700 26px 'JetBrains Mono', monospace"; const tw = x.measureText(text).width + 48;
  x.strokeStyle = color; x.lineWidth = 2; x.beginPath(); x.roundRect(cx - tw / 2, y, tw, 52, 26); x.stroke();
  x.fillStyle = color; x.textAlign = "center"; x.fillText(text, cx, y + 35); x.textAlign = "left";
}

function sky(x: CanvasRenderingContext2D, ra: number, dec: number, px: number, py: number, size: number) {
  const t = targetForCoords(ra, dec); const field = buildField(t);
  x.save(); x.beginPath(); x.roundRect(px, py, size, size, 28); x.clip(); x.fillStyle = "#000"; x.fillRect(px, py, size, size);
  const at = (v: number) => px + ((v + 1) / 2) * size;
  for (const s of field) {
    const r = 1.2 + s.mag * 3.2;
    if (s.anomaly || Math.abs(s.vx) > 0.01 || s.var) {
      // difference snapshot: first epoch cyan, last epoch magenta
      for (const [e, col] of [[0, C.cyan], [3, C.mag]] as const) { x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 18; x.beginPath(); x.arc(at(s.x + s.vx * e), at(-(s.y + s.vy * e)), r + 3, 0, 7); x.fill(); }
      x.shadowBlur = 0;
    } else { x.fillStyle = `rgba(230,235,255,${0.35 + s.mag * 0.5})`; x.beginPath(); x.arc(at(s.x), at(-s.y), r, 0, 7); x.fill(); }
  }
  x.restore();
  const c = px + size / 2; x.strokeStyle = C.gold; x.lineWidth = 2;
  x.beginPath(); x.moveTo(c - 70, c - px + py); x.lineTo(c - 22, c - px + py); x.moveTo(c + 22, c - px + py); x.lineTo(c + 70, c - px + py);
  x.moveTo(c, py + size / 2 - 70); x.lineTo(c, py + size / 2 - 22); x.moveTo(c, py + size / 2 + 22); x.lineTo(c, py + size / 2 + 70); x.stroke();
  x.strokeStyle = C.line; x.lineWidth = 2; x.beginPath(); x.roundRect(px, py, size, size, 28); x.stroke();
  x.font = "500 22px 'JetBrains Mono', monospace"; x.fillStyle = C.cyan; x.fillText("● epoch 1", px + 24, py + size - 24); x.fillStyle = C.mag; x.fillText("● epoch 4", px + 190, py + size - 24);
}

function footer(x: CanvasRenderingContext2D, w: number, h: number) {
  x.strokeStyle = C.line; x.beginPath(); x.moveTo(80, h - 130); x.lineTo(w - 80, h - 130); x.stroke();
  x.font = "800 44px 'Space Grotesk', sans-serif"; x.fillStyle = C.fg; x.fillText("Astro", 80, h - 62); const aw = x.measureText("Astro").width;
  x.fillStyle = C.cyan; x.fillText("swipe", 80 + aw, h - 62);
  x.font = "500 26px 'JetBrains Mono', monospace"; x.fillStyle = C.mute; x.textAlign = "right"; x.fillText(SHARE_HOST, w - 80, h - 66); x.textAlign = "left";
}

export function renderDiscoveryCard(i: DiscoveryCardInput): HTMLCanvasElement {
  const w = 1080, h = 1350; const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const x = cv.getContext("2d")!;
  bg(x, w, h); pill(x, "ASTROSWIPE • NASA SPHEREx CITIZEN SCIENCE", w / 2, 60, C.cyan);
  sky(x, i.ra, i.dec, 190, 150, 700);
  const cat = i.category ?? categoryFor(i.ra, i.dec);
  x.font = "700 28px 'JetBrains Mono', monospace"; x.fillStyle = C.gold; x.fillText(cat.toUpperCase(), 80, 920);
  x.font = "800 64px 'Space Grotesk', sans-serif"; x.fillStyle = C.fg; x.fillText(i.name.slice(0, 26), 80, 995);
  const rows: [string, string][] = [["RA", fmtRA(i.ra)], ["DEC", fmtDec(i.dec)], ["CONSTELLATION", i.constellation || targetForCoords(i.ra, i.dec).constellation], ["CONSENSUS", i.consensus == null ? "Awaiting votes" : `${Math.round(i.consensus * 100)}%${i.votes ? ` of ${i.votes}` : ""}`], ["WAVELENGTH", "0.75 – 5.0 µm"], ["BANDS", "102 spectral"]];
  rows.forEach(([k, v], n) => { const cx = 80 + (n % 2) * 470, cy = 1050 + Math.floor(n / 2) * 60;
    x.font = "500 20px 'JetBrains Mono', monospace"; x.fillStyle = C.mute; x.fillText(k, cx, cy);
    x.font = "600 28px 'JetBrains Mono', monospace"; x.fillStyle = C.fg; x.fillText(v.slice(0, 24), cx + (k.length > 10 ? 210 : 120), cy); });
  footer(x, w, h); return cv;
}

export interface PassportInput { callsign: string; rank: string; reviewed: number; flagged: number; streak: number; badges: string[] }
export function renderPassport(i: PassportInput): HTMLCanvasElement {
  const w = 1080, h = 1350; const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const x = cv.getContext("2d")!;
  bg(x, w, h); pill(x, "CITIZEN SCIENTIST • RESEARCHER PASSPORT", w / 2, 60, C.gold);
  x.strokeStyle = C.cyan; x.lineWidth = 3; x.beginPath(); x.roundRect(80, 160, w - 160, 420, 32); x.stroke();
  const cx = 250, cy = 370; const g = x.createRadialGradient(cx, cy, 10, cx, cy, 130); g.addColorStop(0, C.cyan); g.addColorStop(1, C.bg1);
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 130, 0, 7); x.fill();
  x.font = "120px serif"; x.textAlign = "center"; x.fillText("🧑‍🚀", cx, cy + 42); x.textAlign = "left";
  x.font = "500 22px 'JetBrains Mono', monospace"; x.fillStyle = C.mute; x.fillText("CALLSIGN", 430, 270);
  x.font = "800 58px 'Space Grotesk', sans-serif"; x.fillStyle = C.fg; x.fillText(i.callsign.slice(0, 18), 430, 335);
  x.font = "500 22px 'JetBrains Mono', monospace"; x.fillStyle = C.mute; x.fillText("RANK", 430, 410);
  x.font = "700 40px 'Space Grotesk', sans-serif"; x.fillStyle = C.cyan; x.fillText(i.rank, 430, 460);
  x.font = "500 20px 'JetBrains Mono', monospace"; x.fillStyle = C.mute; x.fillText("MISSION · SPHEREx PLANET X HUNT", 430, 530);
  [["PATCHES INSPECTED", i.reviewed], ["CANDIDATES FLAGGED", i.flagged], ["DAY STREAK", i.streak]].forEach(([k, v], n) => {
    const bx = 80 + n * 315; x.strokeStyle = C.line; x.lineWidth = 2; x.beginPath(); x.roundRect(bx, 620, 290, 180, 24); x.stroke();
    x.font = "800 72px 'Space Grotesk', sans-serif"; x.fillStyle = C.fg; x.fillText(String(v), bx + 28, 715);
    x.font = "500 19px 'JetBrains Mono', monospace"; x.fillStyle = C.mute; x.fillText(String(k), bx + 28, 765); });
  x.font = "700 26px 'JetBrains Mono', monospace"; x.fillStyle = C.gold; x.fillText(`BADGES ${i.badges.length}/${BADGES.length}`, 80, 870);
  BADGES.forEach((b, n) => { const on = i.badges.includes(b.id); const bx = 80 + (n % 4) * 232, by = 900 + Math.floor(n / 4) * 150;
    x.globalAlpha = on ? 1 : 0.25; x.strokeStyle = on ? C.gold : C.line; x.beginPath(); x.roundRect(bx, by, 210, 130, 20); x.stroke();
    x.font = "54px serif"; x.textAlign = "center"; x.fillText(b.emoji, bx + 105, by + 66);
    x.font = "600 17px 'JetBrains Mono', monospace"; x.fillStyle = C.fg; x.fillText(b.name, bx + 105, by + 108); x.textAlign = "left"; x.globalAlpha = 1; });
  footer(x, w, h); return cv;
}
