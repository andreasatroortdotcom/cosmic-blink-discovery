import { useState } from "react";
import { Copy, Download, FileText, Sparkles, LoaderCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { buildReport, canExportReport, confirmReport, reportToMarkdown, reportToText, type ReportInput, type EvidenceReport } from "@/lib/report";
import { generateReportEvidence } from "@/lib/report-evidence.functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

function downloadBlob(text: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function ReportDialog({ input, open: openProp, onOpenChange, hideTrigger }: { input: Omit<ReportInput, "origin">; open?: boolean; onOpenChange?: (o: boolean) => void; hideTrigger?: boolean }) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (o: boolean) => { setOpenState(o); onOpenChange?.(o); };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-full border-accent text-accent"><FileText />Export report</Button></DialogTrigger>}
      <DialogContent className="max-h-[85dvh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">NASA Citizen Science Candidate Report</DialogTitle></DialogHeader>
        {open && <ReportContents key={JSON.stringify(input)} input={input} />}
      </DialogContent>
    </Dialog>
  );
}

function ReportContents({ input }: { input: Omit<ReportInput, "origin"> }) {
  const [r, setReport] = useState<EvidenceReport>(() => buildReport({ ...input, origin: "https://astroswipe.select" }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generate = useServerFn(generateReportEvidence);
  const ready = canExportReport(r) && !busy;
  const md = reportToMarkdown(r);
  const base = `astroswipe-${r.patchId}`;
  const run = async () => {
    setBusy(true); setError(null); setReport((old) => confirmReport({ ...old, evidenceSummary: undefined }, false));
    try {
      const result = await generate({ data: { patchId: input.patchId, ra: input.ra, dec: input.dec,
        ...(input.fov !== undefined ? { fov: input.fov } : {}), demo: input.evidenceSource === "demo" } });
      if (result.report) setReport(result.report);
      else setError(result.error);
    } catch { setError("Couldn't generate the AI evidence summary. Export remains locked."); }
    finally { setBusy(false); }
  };
  const download = (text: string, type: string, name: string) => { if (ready) downloadBlob(text, type, name); };
  return <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-border bg-secondary/40 p-3 font-mono text-xs">
            <div className="text-base font-bold text-primary">{r.designation}</div>
            <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
              <span className="text-muted-foreground">RA</span><span>{r.coordinates.raSexagesimal} · {r.coordinates.raDeg}°</span>
              <span className="text-muted-foreground">Dec</span><span>{r.coordinates.decSexagesimal} · {r.coordinates.decDeg}°</span>
              <span className="text-muted-foreground">Constellation</span><span>{r.coordinates.constellation}</span>
              <span className="text-muted-foreground">FOV</span><span>{r.coordinates.fovArcmin} arcmin</span>
            </div>
          </div>
          <section><h3 className="mb-1 font-semibold">Community consensus</h3>
            <p className="text-muted-foreground">{r.consensus.primaryClassification} · {r.consensus.flagVotes} flag / {r.consensus.staticVotes} static ({r.consensus.agreementPct}% agree) · {r.consensus.volunteersFlagging} volunteer(s) flagging</p>
            <p className="font-mono text-[11px] text-muted-foreground">First {r.consensus.firstSpotted ? new Date(r.consensus.firstSpotted).toUTCString() : "—"} · Last {r.consensus.lastSpotted ? new Date(r.consensus.lastSpotted).toUTCString() : "—"}</p></section>
          <section className="border-l-2 border-info pl-3 text-xs text-muted-foreground" aria-label="Evidence provenance">
            <h3 className="mb-1 font-semibold text-info">Simulation — not an observed discovery</h3>
            <p>{r.provenance.votes}.</p><p>{r.provenance.imagery}.</p>
            <p>{r.provenance.crossMatch}.</p>
          </section>
          <section><h3 className="mb-1 font-semibold">Illustrative simulation epochs</h3>
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">{r.observations.epochs.map((e) => <span key={e.epoch} className="rounded bg-secondary px-2 py-0.5">E{e.epoch} · {e.date}</span>)}</div>
            <p className="mt-1 text-xs text-muted-foreground">SPHEREx · {r.observations.spectralCoverage} · cadence {r.observations.cadence}</p></section>
          <section><h3 className="mb-1 font-semibold">Difference imaging · simulated</h3><p className="text-muted-foreground">{r.differenceImaging.summary}</p></section>
          <section><h3 className="mb-1 font-semibold">Gaia cross-match</h3><p className="text-muted-foreground">{r.gaia}</p></section>
          <p className="break-all rounded bg-secondary px-2 py-1 font-mono text-[11px]">{r.url}</p>
          <section className="space-y-2 border-t border-border pt-3" aria-label="AI evidence summary">
            <h3 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" />AI evidence summary</h3>
            {r.evidenceSummary && <p className="leading-relaxed text-muted-foreground">{r.evidenceSummary.text}</p>}
            {busy && <p role="status" className="flex items-center gap-2 text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />Reviewing recorded evidence…</p>}
            {error && <p role="alert" className="text-destructive">{error}</p>}
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void run()}><Sparkles />{r.evidenceSummary ? "Regenerate summary" : "Generate evidence summary"}</Button>
          </section>
          <label className="flex items-start gap-2 border-t border-border pt-3 text-xs leading-relaxed">
            <Checkbox aria-label="Researcher confirmation" checked={r.researcherConfirmation?.confirmed ?? false}
              disabled={!r.evidenceSummary || busy} onCheckedChange={(value) => setReport((old) => confirmReport(old, value === true))} className="mt-0.5" />
            <span>I have reviewed the AI summary and confirm it accurately describes the recorded votes and simulated data. This does not confirm a discovery or NASA endorsement.</span>
          </label>
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" disabled={!ready} onClick={() => download(JSON.stringify(r, null, 2), "application/json", `${base}.json`)}><Download />JSON</Button>
            <Button variant="outline" size="sm" disabled={!ready} onClick={() => download(md, "text/markdown", `${base}.md`)}><Download />Markdown</Button>
            <Button variant="outline" size="sm" disabled={!ready} onClick={() => download(reportToText(r), "text/plain", `${base}.txt`)}><Download />Text</Button>
            <Button variant="outline" size="sm" disabled={!ready} onClick={() => { if (ready) void navigator.clipboard.writeText(md).then(() => toast.success("Report copied"), () => toast.error("Couldn't copy")); }}><Copy />Copy</Button>
          </div>
        </div>;
}
