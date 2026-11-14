import { useEffect, useRef, useState } from "react";
import { renderDiscoveryCard, SHARE_HOST } from "@/lib/shareCard";
import { Download, ImageIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** Generic "render a canvas card → preview → download / native share" dialog. */
export function ShareImageDialog({ render, filename, title, shareText, shareUrl, label = "Share image", className }: {
  render: () => HTMLCanvasElement; filename: string; title: string; shareText: string; shareUrl?: string | undefined; label?: string; className?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const renderRef = useRef(render); renderRef.current = render;
  useEffect(() => { if (!open) return; const id = setTimeout(() => { try { setSrc(renderRef.current().toDataURL("image/png")); } catch { toast.error("Couldn't render the card"); } }, 30); return () => clearTimeout(id); }, [open]);
  const blob = async () => (await fetch(src!)).blob();
  const download = () => { if (!src) return; const a = document.createElement("a"); a.href = src; a.download = filename; a.click(); };
  const share = async () => {
    if (!src) return;
    const file = new File([await blob()], filename, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title, text: shareText, ...(shareUrl ? { url: shareUrl } : {}) });
      else if (navigator.share) await navigator.share({ title, text: shareText, ...(shareUrl ? { url: shareUrl } : {}) });
      else { await navigator.clipboard.writeText(`${shareText} ${shareUrl ?? ""}`.trim()); toast.success("Sharing isn't supported here — link copied instead"); }
    } catch (e) { if ((e as Error).name !== "AbortError") toast.error("Sharing failed"); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSrc(null); }}>
      <DialogTrigger asChild>
        <button className={className ?? "inline-flex items-center gap-1.5 rounded-full border border-accent px-3 py-1.5 text-xs font-semibold text-accent"}><ImageIcon className="h-3.5 w-3.5" />{label}</button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] w-[calc(100vw-1.5rem)] max-w-md overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Download the card or share it straight to your apps.</DialogDescription></DialogHeader>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          {src ? <img src={src} alt={title} className="block w-full" /> : <div className="flex aspect-[4/5] items-center justify-center text-sm text-muted-foreground">Rendering…</div>}
        </div>
        <div className="flex gap-2">
          <button disabled={!src} onClick={download} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Download className="h-4 w-4" />Download PNG</button>
          <button disabled={!src} onClick={() => void share()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50"><Share2 className="h-4 w-4" />Share</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DiscoveryShare(p: { name: string; ra: number; dec: number; constellation?: string | null; consensus?: number | null; votes?: number; className?: string | undefined }) {
  const url = `https://${SHARE_HOST}/inspect?ra=${p.ra}&dec=${p.dec}`;
  return <ShareImageDialog className={p.className} render={() => renderDiscoveryCard(p)} filename={`astroswipe-${p.ra.toFixed(3)}_${p.dec.toFixed(3)}.png`} title="Share discovery card" shareText={`I spotted something in the SPHEREx sky: ${p.name} — help verify it on Astroswipe!`} shareUrl={url} />;
}
