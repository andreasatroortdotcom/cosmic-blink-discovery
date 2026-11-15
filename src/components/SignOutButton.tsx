import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

export function SignOutButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return (
    <Button variant="ghost" size="sm" className={className} disabled={busy}
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        try {
          await signOut(queryClient);
          await navigate({ to: "/", replace: true });
          toast.success("Logged out");
        } catch {
          toast.error("Couldn't log out. Please try again.");
        } finally {
          setBusy(false);
        }
      }}>
      {busy ? <Loader2 className="animate-spin" /> : <LogOut />}
      {busy ? "Logging out…" : "Log out"}
    </Button>
  );
}