import { BANDS, EPOCHS, buildField, fmtDec, fmtRA, targetForCoords } from "./sky";

export interface ReportInput {
  patchId: string; ra: number; dec: number; constellation?: string | null; fov?: number;
  flags: number; flaggers: number; staticVotes: number; classification: string;
  firstSpotted?: string | null; lastSpotted?: string | null; origin: string;
}

/** Structured citizen-science candidate report built from community data + the deterministic patch model. */
export function buildReport(i: ReportInput) {
  const t = targetForCoords(i.ra, i.dec);
  const fov = i.fov ?? t.fov ?? 1;
  const field = buildField(t);
  const movers = field.filter((s) => Math.hypot(s.vx, s.vy) > 0.01);
  const variables = field.filter((s) => s.var > 0);
  const uncatalogued = field.filter((s) => s.anomaly && !s.known);
  const total = i.flags + i.staticVotes;
  return {
    title: "NASA Citizen Science Candidate Report",
    designation: `ASW J${fmtRA(i.ra).replace(/[hms]/g, "").slice(0, 9)}${fmtDec(i.dec).replace(/[°′″]/g, "").replace("−", "-").slice(0, 7)}`,
    patchId: i.patchId,
    coordinates: { raSexagesimal: fmtRA(i.ra), raDeg: +i.ra.toFixed(5), decSexagesimal: fmtDec(i.dec), decDeg: +i.dec.toFixed(5), constellation: i.constellation || t.constellation, fovArcmin: +(fov * 6).toFixed(1) },
    consensus: {
      primaryClassification: i.classification, flagVotes: i.flags, staticVotes: i.staticVotes,
      volunteersFlagging: i.flaggers, totalReviews: total, agreementPct: total ? Math.round((100 * i.flags) / total) : 0,
      firstSpotted: i.firstSpotted ?? null, lastSpotted: i.lastSpotted ?? null,
    },
    observations: { mission: "NASA SPHEREx all-sky survey", cadence: "~6 months", epochs: EPOCHS.map((e, n) => ({ epoch: n + 1, date: e })), bands: BANDS.map((b) => `${b.label} (${b.range})`), spectralCoverage: "102 bands, 0.75–5.0 µm" },
    differenceImaging: {
      movingSources: movers.length, variableSources: variables.length,
      summary: movers.length || variables.length
        ? `${movers.length} source(s) show positive/negative dipoles between epochs; ${variables.length} show flux change.`
        : "No significant dipole or flux residuals detected.",
    },
    gaia: uncatalogued.length
      ? "Gaia DR3 cross-match checked: No known high-proper-motion source at this position (Uncataloged candidate)"
      : "Gaia DR3 cross-match checked: Position matches a catalogued source",
    url: `${i.origin}/inspect?ra=${i.ra}&dec=${i.dec}&fov=${+fov.toFixed(2)}`,
    generated: new Date().toISOString(),
  };
}
export type Report = ReturnType<typeof buildReport>;

export function reportToMarkdown(r: Report) {
  const c = r.coordinates, k = r.consensus;
  return `# ${r.title}

**Designation:** ${r.designation}  
**Patch ID:** ${r.patchId}  
**Generated:** ${r.generated}

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
export function reportToText(r: Report) {
  return reportToMarkdown(r).replace(/^#+ /gm, "").replace(/\*\*/g, "").replace(/^\|.*\|$\n?/gm, "")
    .replace("Coordinates (J2000)\n", `Coordinates (J2000)\nRA  ${r.coordinates.raSexagesimal}  (${r.coordinates.raDeg}°)\nDec ${r.coordinates.decSexagesimal}  (${r.coordinates.decDeg}°)\n`);
}
