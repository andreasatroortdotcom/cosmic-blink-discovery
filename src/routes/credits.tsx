import { createFileRoute } from "@tanstack/react-router";
import { Code2, Monitor, Server, Sparkles } from "lucide-react";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/credits")({
  head: () => ({ meta: [
    { title: "Build Credits — Astroswipe" },
    { name: "description", content: "Astroswipe was built by Andreas Student with Lovable and SupoerIntelligence for the user interface and parts of the backend." },
    { property: "og:title", content: "Build Credits — Astroswipe" },
    { property: "og:description", content: "Acknowledging Lovable and SupoerIntelligence in the development of Astroswipe." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Credits,
});

function Credits() {
  return (
    <Shell>
      <header className="mb-8 max-w-2xl">
        <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent"><Code2 className="h-4 w-4" />Development acknowledgements</p>
        <h1 className="font-display text-3xl font-bold">Build Credits</h1>
        <p className="mt-4 text-lg leading-relaxed text-foreground">I used <strong className="text-primary">Lovable</strong> and <strong className="text-accent">SupoerIntelligence</strong> to build Astroswipe’s user interface and parts of its backend.</p>
        <p className="mt-3 text-sm text-muted-foreground">— Andreas Student</p>
      </header>

      <section aria-labelledby="tools-heading" className="border-t border-border py-6">
        <h2 id="tools-heading" className="mb-4 flex items-center gap-2 font-display text-xl font-semibold"><Sparkles className="h-5 w-5 text-primary" />AI-assisted development</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-display text-xl font-semibold text-primary">Lovable</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Used to build the user interface and parts of the backend.</p>
          </article>
          <article className="rounded-lg border border-border bg-card p-5">
            <h3 className="break-words font-display text-xl font-semibold text-accent">SupoerIntelligence</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Used to build the user interface and parts of the backend.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="scope-heading" className="border-t border-border py-6">
        <h2 id="scope-heading" className="mb-4 font-display text-xl font-semibold">Contribution scope</h2>
        <ul className="space-y-4">
          <li className="flex items-center gap-3"><Monitor className="h-5 w-5 shrink-0 text-info" /><span>User interface</span></li>
          <li className="flex items-center gap-3"><Server className="h-5 w-5 shrink-0 text-success" /><span>Parts of the backend</span></li>
        </ul>
      </section>
    </Shell>
  );
}