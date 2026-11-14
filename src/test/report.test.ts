import { describe, it, expect } from "vitest";
import { buildReport } from "@/lib/report";
const r = buildReport({ patchId: "p1", ra: 133.795, dec: -7.245, fov: 2, flags: 7, flaggers: 6, staticVotes: 3, classification: "Brown dwarf", origin: "https://x.test" });
describe("candidate report", () => {
  it("includes shareable coordinate URL", () => expect(r.url).toBe("https://x.test/inspect?ra=133.795&dec=-7.245&fov=2"));
  it("lists 4 epochs", () => expect(r.observations.epochs).toHaveLength(4));
  it("fov in arcmin", () => expect(r.coordinates.fovArcmin).toBe(12));
  it("agreement 70%", () => expect(r.consensus.agreementPct).toBe(70));
});
