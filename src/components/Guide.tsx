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
      <button aria-label="Öppna guiden" onClick={() => setOpen(true)} className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary"><HelpCircle className="h-4 w-4" /></button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Välkommen till Astroswipe</DialogTitle>
            <DialogDescription>Hjälp till att hitta rörliga objekt i NASA:s SPHEREx-data.</DialogDescription>
          </DialogHeader>
          <section className="space-y-2">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-accent">1 · Epok-blinkning</h3>
            <Row icon={<Repeat className="h-4 w-4" />} tone="border-primary text-primary" title="Himlen fotograferas var 6:e månad">SPHEREx kartlägger hela himlen var sjätte månad. Bilden blinkar mellan dessa epoker – objekt som rört sig hoppar fram och tillbaka, och objekt som ändrat ljusstyrka pulserar.</Row>
          </section>
          <section className="space-y-3">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-accent">2 · Swajpval</h3>
            <Row icon={<Globe className="h-4 w-4" />} tone="border-success text-success" title="Swajpa höger · grön knapp">Flagga som kandidat: anomali, rörligt objekt, Planet X, brun dvärg eller variabel stjärna.</Row>
            <Row icon={<X className="h-4 w-4" />} tone="border-destructive text-destructive" title="Swajpa vänster · röd knapp">Statisk himmel – inget rör sig.</Row>
            <Row icon={<Star className="h-4 w-4" />} tone="border-info text-info" title="Swajpa upp · blå stjärna">Djupdykning med spektrum och detaljer.</Row>
          </section>
          <section className="space-y-3">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-accent">3 · Snabbverktyg</h3>
            <Row icon={<Layers className="h-4 w-4" />} tone="border-border text-foreground" title="Skillnadsbild">Subtraherar första epoken – allt som är stilla försvinner, och rörelse syns som svart/vita par.</Row>
            <Row icon={<Crosshair className="h-4 w-4" />} tone="border-border text-foreground" title="Gaia-lager">Ringar in kända stjärnor från Gaia-katalogen så att du kan bortse från dem. Rosa rutor = okända källor.</Row>
          </section>
          <button onClick={() => close(false)} className="mt-2 w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground">Förstått – börja leta!</button>
        </DialogContent>
      </Dialog>
    </>
  );
}
