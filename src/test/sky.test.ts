import { describe, it, expect } from "vitest";
import { parseQuery, rankFor, streak } from "@/lib/sky";
describe("sky", () => {
  it("parses WISE 0855 sexagesimal coords", () => {
    const r = parseQuery("08h55m10.831s -07d14m42.53s")!;
    expect(r.ra).toBeCloseTo(133.795, 2); expect(r.dec).toBeCloseTo(-7.245, 2);
  });
  it("finds targets by name", () => { expect(parseQuery("barnard")?.target?.id).toBe("barnard"); });
  it("ranks Stellar Scout after 5 reviews", () => { expect(rankFor({ reviewed: 5, flags: [], days: [] })).toBe("Stellar Scout"); });
  it("counts consecutive-day streak", () => { expect(streak(["2026-11-12", "2026-11-13", "2026-11-14"], "2026-11-14")).toBe(3); });
});
import { randomPatch, targetForCoords, mulberry } from "@/lib/sky";
describe("random patches", () => {
  it("stay within RA 0–360 and Dec ±90", () => {
    const r = mulberry(42);
    for (let i = 0; i < 500; i++) { const t = randomPatch(r); expect(t.ra).toBeGreaterThanOrEqual(0); expect(t.ra).toBeLessThan(360); expect(Math.abs(t.dec)).toBeLessThanOrEqual(90); }
  });
  it("rebuild the same patch from its coordinates (for Inspect & vote links)", () => {
    const t = randomPatch(mulberry(7)); expect(targetForCoords(t.ra, t.dec).id).toBe(t.id);
  });
});
