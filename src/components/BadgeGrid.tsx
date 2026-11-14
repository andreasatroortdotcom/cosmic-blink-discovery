import { Lock } from "lucide-react";
import { BADGES, isUnlocked, progress, type BadgeCtx } from "@/lib/badges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function BadgeGrid({ ctx }: { ctx: BadgeCtx }) {
  return (
    <TooltipProvider delayDuration={100}>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BADGES.map((b) => {
          const on = isUnlocked(b, ctx); const p = progress(b, ctx);
          return (
            <li key={b.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label={`${b.name}: ${b.desc}${on ? " (unlocked)" : ` (${p}/${b.goal})`}`} className={`relative flex w-full flex-col items-center gap-1 rounded-2xl border p-3 text-center transition ${on ? "border-accent bg-accent/10 shadow-glow" : "border-border bg-card opacity-60 grayscale"}`}>
                    {!on && <Lock className="absolute right-2 top-2 h-3 w-3 text-muted-foreground" />}
                    <span className="text-3xl" aria-hidden>{b.emoji}</span>
                    <span className="text-xs font-semibold">{b.name}</span>
                    <span className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"><span className="block h-full bg-accent" style={{ width: `${(100 * p) / b.goal}%` }} /></span>
                    <span className="font-mono text-[10px] text-muted-foreground">{p}/{b.goal}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="shadow-glow">{b.desc}</TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </TooltipProvider>
  );
}
