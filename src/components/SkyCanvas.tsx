import { useEffect, useMemo, useRef } from "react";
import { buildField, bandFlux, BAND_UM, EPOCHS, type BandId, type Target } from "@/lib/sky";

export interface ViewOpts { diff: boolean; gaia: boolean; band: BandId; fov: number; speed: number; playing?: boolean }

function tint(band: BandId, temp: number) {
  if (band !== "composite") { const k = ["d1","d2","d3","d4","d5","d6"].indexOf(band) / 5; return [255 - k * 40, 230 - k * 90, 255 - k * 160]; }
  const b = bandFlux(temp, 1.0), r = bandFlux(temp, 4.5), g = bandFlux(temp, 2.2); const m = Math.max(b, g, r, 1e-9);
  return [80 + 175 * (r / m), 80 + 175 * (g / m), 80 + 175 * (b / m)];
}

export function SkyCanvas({ target, opts, onEpoch, className }: { target: Target; opts: ViewOpts; onEpoch?: (i: number) => void; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const field = useMemo(() => buildField(target), [target]);
  const epoch = useRef(0);

  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext("2d")!;
    const S = c.width; const zoom = 1 / opts.fov; const um = BAND_UM[opts.band];
    const P = (x: number, y: number) => [S / 2 + x * zoom * S / 2, S / 2 + y * zoom * S / 2];
    const bright = (s: (typeof field)[0], e: number) => {
      const f = opts.band === "composite" ? 1 : Math.min(2.2, bandFlux(s.temp, um) / Math.max(bandFlux(s.temp, 2), 0.05));
      return s.mag * f * (1 + s.var * Math.sin(e * 2.1 + 0.4));
    };
    const blob = (x: number, y: number, r: number, col: number[], a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a})`); g.addColorStop(0.35, `rgba(${col[0]},${col[1]},${col[2]},${a * 0.35})`); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    };
    const draw = () => {
      const e = epoch.current;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = opts.diff ? "#55555c" : "#05040c"; ctx.fillRect(0, 0, S, S);
      if (!opts.diff) { const g = ctx.createRadialGradient(S * 0.3, S * 0.7, 0, S * 0.3, S * 0.7, S); g.addColorStop(0, "rgba(90,40,140,0.25)"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, S, S); }
      for (const s of field) {
        const [x, y] = P(s.x + s.vx * e, s.y + s.vy * e);
        const b = bright(s, e); const r = (4 + b * 9) * Math.sqrt(zoom);
        if (opts.diff) {
          const [x0, y0] = P(s.x, s.y); const b0 = bright(s, 0);
          const moved = Math.hypot(x - x0, y - y0) > 1.5; const dv = b - b0;
          if (moved) { blob(x, y, r, [255, 255, 255], Math.min(1, b)); blob(x0, y0, r, [0, 0, 0], Math.min(1, b0)); }
          else if (Math.abs(dv) > 0.05) blob(x, y, r, dv > 0 ? [255, 255, 255] : [0, 0, 0], Math.min(1, Math.abs(dv) * 1.5));
        } else { ctx.globalCompositeOperation = "lighter"; blob(x, y, r, tint(opts.band, s.temp), Math.min(1, b)); ctx.globalCompositeOperation = "source-over"; }
      }
      if (opts.gaia) {
        ctx.lineWidth = 1.2;
        for (const s of field) {
          if (!s.known) continue;
          const [x, y] = P(s.x + s.vx * e, s.y + s.vy * e);
          if (x < -10 || y < -10 || x > S + 10 || y > S + 10) continue;
          ctx.strokeStyle = "rgba(120,220,255,0.55)"; ctx.beginPath(); ctx.arc(x, y, 7 + s.mag * 4, 0, 7); ctx.stroke();
          const [x2, y2] = P(s.x + s.vx * e + s.vx * 3, s.y + s.vy * e + s.vy * 3);
          if (Math.hypot(x2 - x, y2 - y) > 4) { ctx.strokeStyle = "rgba(255,210,90,0.9)"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); }
        }
        for (const s of field) if (s.anomaly && !s.known) { const [x, y] = P(s.x + s.vx * e, s.y + s.vy * e); ctx.strokeStyle = "rgba(255,90,180,0.95)"; ctx.setLineDash([4, 3]); ctx.strokeRect(x - 14, y - 14, 28, 28); ctx.setLineDash([]); }
      }
      ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `${S / 28}px JetBrains Mono, monospace`;
      ctx.fillText(`EPOCH ${e + 1}/${EPOCHS.length} · ${EPOCHS[e]}${opts.diff ? " − " + EPOCHS[0] : ""}`, S * 0.04, S * 0.07);
      onEpoch?.(e);
    };
    draw();
    if (opts.playing === false) return;
    const id = setInterval(() => { epoch.current = (epoch.current + 1) % EPOCHS.length; if (opts.diff && epoch.current === 0) epoch.current = 1; draw(); }, 900 / opts.speed);
    return () => clearInterval(id);
  }, [field, opts, onEpoch]);

  return <canvas ref={ref} width={640} height={640} className={className} aria-label={`SPHEREx blink comparator of ${target.name}`} />;
}
