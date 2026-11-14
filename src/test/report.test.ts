import { describe, it, expect } from "vitest";
import { buildReport, canExportReport, confirmReport, reportToMarkdown, reportToText } from "@/lib/report";
const r = buildReport({ patchId: "p1", ra: 133.795, dec: -7.245, fov: 2, flags: 7, flaggers: 6, staticVotes: 3, classification: "Brown dwarf", origin: "https://x.test" });
describe("candidate report", () => {
  it("includes shareable coordinate URL", () => expect(r.url).toBe("https://x.test/inspect?ra=133.795&dec=-7.245&fov=2"));
  it("lists 4 epochs", () => expect(r.observations.epochs).toHaveLength(4));
  it("fov in arcmin", () => expect(r.coordinates.fovArcmin).toBe(12));
  it("agreement 70%", () => expect(r.consensus.agreementPct).toBe(70));
  it("requires AI summary and researcher confirmation before export", () => {
    expect(canExportReport(r)).toBe(false);
    expect(canExportReport(confirmReport(r, true))).toBe(false);
    const summary = { ...r, evidenceSummary: { text: "Recorded votes; simulated sky.", generatedAt: "2026-11-14T23:34:00Z", source: "Lovable AI Gateway" as const } };
    expect(canExportReport(summary)).toBe(false);
    expect(canExportReport(confirmReport(summary, true))).toBe(true);
    expect(canExportReport(confirmReport(summary, false))).toBe(false);
  });
  it("does not claim simulated epochs or cross-match are observations", () => {
    expect(r.provenance.epochs).toBe("Four illustrative simulation epochs, not verified observation dates");
    expect(r.gaia).toBe("Unverified — no Gaia DR3 query performed. Simulated catalogue labels are not a cross-match result.");
    expect(r.observations.mission).toBe("SPHEREx-inspired simulation");
  });
  it("includes summary and confirmation in every text export", () => {
    const confirmed = confirmReport({ ...r, evidenceSummary: { text: "Seven flags; three static reviews; simulation only.", generatedAt: "2026-11-14T23:34:00Z", source: "Lovable AI Gateway" } }, true);
    for (const exportText of [reportToMarkdown(confirmed), reportToText(confirmed), JSON.stringify(confirmed)]) {
      expect(exportText).toContain("Seven flags; three static reviews; simulation only.");
      expect(exportText).toContain(confirmed.researcherConfirmation?.confirmedAt);
      expect(exportText).toContain(r.provenance.imagery);
    }
  });
  it("keeps tour evidence distinct from recorded votes", () => {
    const demo = buildReport({ patchId: "demo", ra: 133.795, dec: -7.245, flags: 0, flaggers: 0, staticVotes: 0, classification: "Demo", evidenceSource: "demo", origin: "https://astroswipe.select" });
    expect(demo.provenance.votes).toBe("Simulated tour votes — not recorded community reviews");
    expect(demo.consensus.totalReviews).toBe(0);
  });
});
