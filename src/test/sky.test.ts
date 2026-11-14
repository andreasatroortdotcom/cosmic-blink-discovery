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
