import { useMemo, useState } from "react";
import { Copy, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { buildReport, reportToMarkdown, reportToText, type ReportInput } from "@/lib/report";

function downloadBlob(text: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function ReportDialog({ input, open: openProp, onOpenChange, hideTrigger }: { input: Omit<ReportInput, "origin">; open?: boolean; onOpenChange?: (o: boolean) => void; hideTrigger?: boolean }) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (o: boolean) => { setOpenState(o); onOpenChange?.(o); };
  const r = useMemo(() => (open ? buildReport({ ...input, origin: window.location.origin }) : null), [open, input]);
  const md = r ? reportToMarkdown(r) : "";
  const base = `astroswipe-${input.patchId}`;
  const btn = "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && <DialogTrigger asChild><button className="inline-flex items-center gap-1.5 rounded-full border border-accent px-3 py-1.5 text-xs font-semibold text-accent"><FileText className="h-3.5 w-3.5" />Export report</button></DialogTrigger>}
      <DialogContent className="max-h-[85dvh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">NASA Citizen Science Candidate Report</DialogTitle></DialogHeader>
        {r && (<div className="space-y-4 text-sm">
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
          <section><h3 className="mb-1 font-semibold">Observation epochs</h3>
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">{r.observations.epochs.map((e) => <span key={e.epoch} className="rounded bg-secondary px-2 py-0.5">E{e.epoch} · {e.date}</span>)}</div>
            <p className="mt-1 text-xs text-muted-foreground">SPHEREx · {r.observations.spectralCoverage} · cadence {r.observations.cadence}</p></section>
          <section><h3 className="mb-1 font-semibold">Difference imaging</h3><p className="text-muted-foreground">{r.differenceImaging.summary}</p></section>
          <section><h3 className="mb-1 font-semibold">Gaia cross-match</h3><p className="text-muted-foreground">{r.gaia}</p></section>
          <p className="break-all rounded bg-secondary px-2 py-1 font-mono text-[11px]">{r.url}</p>
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <button className={btn} onClick={() => downloadBlob(JSON.stringify(r, null, 2), "application/json", `${base}.json`)}><Download className="h-3.5 w-3.5" />JSON</button>
            <button className={btn} onClick={() => downloadBlob(md, "text/markdown", `${base}.md`)}><Download className="h-3.5 w-3.5" />Markdown</button>
            <button className={btn} onClick={() => downloadBlob(reportToText(r), "text/plain", `${base}.txt`)}><Download className="h-3.5 w-3.5" />Text</button>
            <button className={btn} onClick={() => void navigator.clipboard.writeText(md).then(() => toast.success("Report copied"), () => toast.error("Couldn't copy"))}><Copy className="h-3.5 w-3.5" />Copy</button>
          </div>
        </div>)}
      </DialogContent>
    </Dialog>
  );
}
