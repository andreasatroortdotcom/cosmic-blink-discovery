import { describe, it, expect } from "vitest";
import { pitchFor } from "@/lib/audio";
import { cutoutUrl, externalLinks } from "@/components/CrossMatch";
describe("spectral sonification", () => {
  it("brighter flux gives higher pitch across 220–1320 Hz", () => {
    expect(pitchFor(0)).toBe(220); expect(pitchFor(1)).toBe(1320); expect(pitchFor(0.5)).toBeGreaterThan(pitchFor(0.2));
  });
});
describe("cross-match", () => {
  it("cutouts and links use the exact coordinates", () => {
    expect(cutoutUrl("CDS/P/allWISE/color", 133.79513, -7.24515, 0.1)).toContain("ra=133.79513&dec=-7.24515");
    expect(externalLinks(133.79513, -7.24515).map((l) => l.name)).toEqual(["CDS Portal", "SIMBAD", "IRSA Finder Chart"]);
    expect(externalLinks(133.79513, -7.24515)[1]!.href).toContain("133.79513");
  });
});
