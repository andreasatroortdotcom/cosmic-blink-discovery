import { useEffect, useState } from "react";
import { HelpCircle, X, Star, Globe, Layers, Crosshair, Repeat } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const KEY = "astroswipe.guide.seen.v1";

export function Guide() {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!localStorage.getItem(KEY)) setOpen(true); }, []);
  const close = (v: boolean) => { setOpen(v); if (!v) localStorage.setItem(KEY, "1"); };
  const Row = ({ icon, tone, title, children }: { icon: React.ReactNode; tone: string; title: string; children: React.ReactNode }) => (
    <div className="flex gap-3"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 ${tone}`}>{icon}</div><div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">{children}</p></div></div>
  );
  return (
    <>
      <button aria-label="Open guide" onClick={() => setOpen(true)} className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary"><HelpCircle className="h-4 w-4" /></button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Welcome to Astroswipe</DialogTitle>
            <DialogDescription>Help find moving objects in NASA's SPHEREx data.</DialogDescription>
          </DialogHeader>
          <section className="space-y-2">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-accent">1 · Epoch blinking</h3>
            <Row icon={<Repeat className="h-4 w-4" />} tone="border-primary text-primary" title="The sky is imaged every 6 months">SPHEREx maps the entire sky every six months. The image blinks between these epochs — objects that moved jump back and forth, and objects that changed brightness pulse.</Row>
          </section>
          <section className="space-y-3">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-accent">2 · Swipe actions</h3>
            <Row icon={<Globe className="h-4 w-4" />} tone="border-success text-success" title="Swipe right · green button">Flag as a candidate: anomaly, moving object, Planet X, brown dwarf or variable star.</Row>
            <Row icon={<X className="h-4 w-4" />} tone="border-destructive text-destructive" title="Swipe left · red button">Static sky — nothing moves.</Row>
            <Row icon={<Star className="h-4 w-4" />} tone="border-info text-info" title="Swipe up · blue star">Deep dive with spectrum and details.</Row>
          </section>
          <section className="space-y-3">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-accent">3 · Quick tools</h3>
            <Row icon={<Layers className="h-4 w-4" />} tone="border-border text-foreground" title="Difference image">Subtracts the first epoch — everything static disappears, and motion shows up as black/white pairs.</Row>
            <Row icon={<Crosshair className="h-4 w-4" />} tone="border-border text-foreground" title="Gaia overlay">Circles known stars from the Gaia catalog so you can ignore them. Pink boxes = unknown sources.</Row>
          </section>
          <button onClick={() => close(false)} className="mt-2 w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground">Got it — start hunting!</button>
        </DialogContent>
      </Dialog>
    </>
  );
}
