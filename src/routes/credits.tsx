import { createFileRoute } from "@tanstack/react-router";
import { Code2, Monitor, Server, Sparkles } from "lucide-react";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/credits")({
  head: () => ({ meta: [
    { title: "Build Credits — Astroswipe" },
    { name: "description", content: "Andreas used Lovable, a Super Intelligence (SI) tool, to generate code for Astroswipe’s user interface and parts of its backend." },
    { property: "og:title", content: "Build Credits — Astroswipe" },
    { property: "og:description", content: "SI use disclosure: Lovable assisted with code generation for Astroswipe’s user interface and parts of its backend." },
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
        <p className="mt-4 text-lg leading-relaxed text-foreground">I used <strong className="text-primary">Lovable</strong>, a <strong className="text-accent">Super Intelligence (SI)</strong> tool, to generate code for Astroswipe’s user interface and parts of its backend.</p>
        <p className="mt-3 text-sm text-muted-foreground">— Andreas</p>
      </header>

      <section aria-labelledby="tools-heading" className="border-t border-border py-6">
        <h2 id="tools-heading" className="mb-4 flex items-center gap-2 font-display text-xl font-semibold"><Sparkles className="h-5 w-5 text-primary" />Super Intelligence (SI) disclosure</h2>
        <h3 className="font-display text-xl font-semibold text-primary">Lovable</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Lovable was the SI-assisted development tool used for code generation. Its contributions include the user interface and portions of the backend implementation.</p>
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