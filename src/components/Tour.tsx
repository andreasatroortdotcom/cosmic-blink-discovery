import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Star, Volume2, VolumeX, X } from "lucide-react";
import { TOUR_STEPS, STEP_MS, setTourStep, useTourStep } from "@/lib/tour";
import { setMuted, useMuted } from "@/lib/audio";

export function SoundToggle() {
  const muted = useMuted();
  return (
    <button onClick={() => setMuted(!muted)} aria-label={muted ? "Unmute sound" : "Mute sound"} aria-pressed={!muted} title={muted ? "Sound off" : "Sound on"}
      className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground">
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}

export function TourButton() {
  const nav = useNavigate();
  return (
    <button onClick={() => { void nav({ to: "/", search: {} }).then(() => setTourStep(0)); }}
      className="tour-glow inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent/15 px-3 py-1.5 text-xs font-bold text-accent">
      <Star className="h-3.5 w-3.5 fill-current" /><span className="sm:hidden">Tour</span><span className="hidden sm:inline">Judge Tour (60s)</span>
    </button>
  );
}

export function TourPanel() {
  const step = useTourStep();
  useEffect(() => {
    if (step === null || step >= TOUR_STEPS.length - 1) return;
    const id = setTimeout(() => setTourStep(step + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [step]);
  if (step === null) return null;
  const s = TOUR_STEPS[step]!; const last = step === TOUR_STEPS.length - 1;
  return (
    <div role="dialog" aria-label="Judge tour" className="fixed inset-x-3 bottom-20 z-[60] mx-auto max-w-md rounded-2xl border border-accent bg-card/95 p-4 shadow-glow backdrop-blur">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent">Judge tour · step {step + 1}/{TOUR_STEPS.length}</span>
        <button onClick={() => setTourStep(null)} aria-label="Exit tour" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <h2 className="font-display text-base font-bold">{s.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="flex gap-1.5">{TOUR_STEPS.map((_, i) => <button key={i} onClick={() => setTourStep(i)} aria-label={`Go to step ${i + 1}`} className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-accent" : i < step ? "w-2 bg-accent/60" : "w-2 bg-secondary"}`} />)}</span>
        <span className="flex gap-2">
          {!last && <button onClick={() => setTourStep(TOUR_STEPS.length - 1)} className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Skip</button>}
          <button onClick={() => setTourStep(last ? null : step + 1)} className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground">{last ? "Exit tour" : "Next"}</button>
        </span>
      </div>
    </div>
  );
}
