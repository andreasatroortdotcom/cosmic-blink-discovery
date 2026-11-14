import { BANDS, EPOCHS, buildField, fmtDec, fmtRA, targetForCoords } from "./sky";

export interface ReportInput {
  patchId: string; ra: number; dec: number; constellation?: string | null; fov?: number;
  flags: number; flaggers: number; staticVotes: number; classification: string;
  firstSpotted?: string | null; lastSpotted?: string | null; origin: string;
  evidenceSource?: "recorded" | "demo";
}

/** Structured citizen-science candidate report built from community data + the deterministic patch model. */
export function buildReport(i: ReportInput) {
  const t = targetForCoords(i.ra, i.dec);
  const fov = i.fov ?? t.fov ?? 1;
  const field = buildField(t);
  const movers = field.filter((s) => Math.hypot(s.vx, s.vy) > 0.01);
  const variables = field.filter((s) => s.var > 0);
  const total = i.flags + i.staticVotes;
  return {
    title: "NASA Citizen Science Candidate Report",
    designation: `ASW J${fmtRA(i.ra).replace(/[hms]/g, "").slice(0, 9)}${fmtDec(i.dec).replace(/[°′″]/g, "").replace("−", "-").slice(0, 7)}`,
    patchId: i.patchId,
    provenance: {
      votes: i.evidenceSource === "demo" ? "Simulated tour votes — not recorded community reviews" : "Recorded community reviews — not astronomical measurements",
      imagery: "Simulated sky, spectra and difference imaging; no SPHEREx observations ingested",
      epochs: "Four illustrative simulation epochs, not verified observation dates",
      crossMatch: "Not performed against Gaia DR3; the overlay uses simulated catalogue labels",
    },
    coordinates: { raSexagesimal: fmtRA(i.ra), raDeg: +i.ra.toFixed(5), decSexagesimal: fmtDec(i.dec), decDeg: +i.dec.toFixed(5), constellation: i.constellation || t.constellation, fovArcmin: +(fov * 6).toFixed(1) },
    consensus: {
      primaryClassification: i.classification, flagVotes: i.flags, staticVotes: i.staticVotes,
      volunteersFlagging: i.flaggers, totalReviews: total, agreementPct: total ? Math.round((100 * i.flags) / total) : 0,
      firstSpotted: i.firstSpotted ?? null, lastSpotted: i.lastSpotted ?? null,
    },
    observations: { mission: "SPHEREx-inspired simulation", cadence: "~6 months (illustrative)", epochs: EPOCHS.map((e, n) => ({ epoch: n + 1, date: e })), bands: BANDS.map((b) => `${b.label} (${b.range})`), spectralCoverage: "102 simulated bands, 0.75–5.0 µm" },
    differenceImaging: {
      movingSources: movers.length, variableSources: variables.length,
      summary: movers.length || variables.length
        ? `Simulation only: ${movers.length} moving source(s); ${variables.length} variable source(s). Not measured residuals from observations.`
        : "Simulation only: no injected moving or variable sources. Not an observational detection limit.",
    },
    gaia: "Unverified — no Gaia DR3 query performed. Simulated catalogue labels are not a cross-match result.",
    url: `${i.origin}/inspect?ra=${i.ra}&dec=${i.dec}&fov=${+fov.toFixed(2)}`,
    generated: new Date().toISOString(),
  };
}
export type Report = ReturnType<typeof buildReport>;
export type EvidenceReport = Report & {
  evidenceSummary?: { text: string; generatedAt: string; source: "Lovable AI Gateway" };
  researcherConfirmation?: { confirmed: boolean; confirmedAt: string | null; scope: string };
};

export function canExportReport(r: EvidenceReport): boolean {
  return Boolean(r.evidenceSummary?.text.trim() && r.researcherConfirmation?.confirmed && r.researcherConfirmation.confirmedAt);
}

export function confirmReport(r: EvidenceReport, confirmed: boolean): EvidenceReport {
  return { ...r, researcherConfirmation: { confirmed, confirmedAt: confirmed ? new Date().toISOString() : null,
    scope: "Researcher reviewed this AI summary and its simulation labels; not confirmation of an astronomical discovery or NASA endorsement." } };
}

export function reportToMarkdown(r: EvidenceReport) {
  const c = r.coordinates, k = r.consensus;
  return `# ${r.title}

**Designation:** ${r.designation}  
**Patch ID:** ${r.patchId}  
**Generated:** ${r.generated}

## Evidence provenance
- Votes: ${r.provenance.votes}
- Sky data: ${r.provenance.imagery}
- Epochs: ${r.provenance.epochs}
- Cross-match: ${r.provenance.crossMatch}

## AI evidence summary
${r.evidenceSummary?.text ?? "Not generated"}
${r.evidenceSummary ? `\nSource: ${r.evidenceSummary.source} · generated ${r.evidenceSummary.generatedAt}` : ""}

## Researcher confirmation
${r.researcherConfirmation?.confirmed ? `Reviewed and confirmed at ${r.researcherConfirmation.confirmedAt}` : "Not confirmed — draft only"}
${r.researcherConfirmation?.scope ?? "No researcher confirmation. Not a verified discovery or NASA endorsement."}

## Coordinates (J2000)
| | Sexagesimal | Decimal (deg) |
|---|---|---|
| RA | ${c.raSexagesimal} | ${c.raDeg} |
| Dec | ${c.decSexagesimal} | ${c.decDeg} |

- Constellation: ${c.constellation}
- Field of view: ${c.fovArcmin} arcmin

## Community consensus
- Primary classification: ${k.primaryClassification}
- Vote tally: ${k.flagVotes} "something changed" / ${k.staticVotes} static (${k.agreementPct}% agree)
- Volunteers flagging: ${k.volunteersFlagging} · total reviews: ${k.totalReviews}
- First spotted: ${k.firstSpotted ?? "—"} · last spotted: ${k.lastSpotted ?? "—"}

## Observation epochs (${r.observations.mission}, cadence ${r.observations.cadence})
${r.observations.epochs.map((e) => `- Epoch ${e.epoch}: ${e.date}`).join("\n")}

Bands: ${r.observations.spectralCoverage}
${r.observations.bands.map((b) => `- ${b}`).join("\n")}

## Difference imaging
${r.differenceImaging.summary}

## Gaia cross-match
${r.gaia}

## Link
${r.url}
`;
}
export function reportToText(r: EvidenceReport) {
  return reportToMarkdown(r).replace(/^#+ /gm, "").replace(/\*\*/g, "").replace(/^\|.*\|$\n?/gm, "")
    .replace("Coordinates (J2000)\n", `Coordinates (J2000)\nRA  ${r.coordinates.raSexagesimal}  (${r.coordinates.raDeg}°)\nDec ${r.coordinates.decSexagesimal}  (${r.coordinates.decDeg}°)\n`);
}
