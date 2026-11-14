import { Link } from "@tanstack/react-router";
import { Orbit, BookMarked, Users, Telescope, Radar, Trophy, Atom } from "lucide-react";
import { AuthButton } from "./AuthButton";
import type { ReactNode } from "react";
import { Guide } from "./Guide";
import { SoundToggle, TourButton, TourPanel } from "./Tour";
export function Shell({ children }: { children: ReactNode }) {
  const l = "flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground [&.active]:text-primary";
  return (
    <div className="min-h-[100dvh] pb-20">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
          <Link to="/" className="flex shrink-0 items-center gap-1.5 font-display text-base sm:text-lg font-bold tracking-tight"><Orbit className="h-5 w-5 text-primary" />Astro<span className="text-glow text-primary">swipe</span></Link>
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2"><span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground lg:block">SPHEREx · Planet X Hunt</span><TourButton /><SoundToggle /><Guide /><AuthButton /></div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-3 py-3 sm:px-4 sm:py-4">{children}</main>
      <TourPanel />
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          <Link to="/" className={l} activeOptions={{ exact: true }}><Telescope className="h-5 w-5" />Swipe</Link>
          <Link to="/log" className={l}><BookMarked className="h-5 w-5" />My log</Link>
          <Link to="/radar" className={l}><Radar className="h-5 w-5" />Radar</Link>
          <Link to="/leaderboard" className={l}><Trophy className="h-5 w-5" />Ranks</Link>
          <Link to="/community" className={l}><Users className="h-5 w-5" />Community</Link>
          <Link to="/science" className={l}><Atom className="h-5 w-5" />Science</Link>
        </div>
      </nav>
    </div>
  );
}
