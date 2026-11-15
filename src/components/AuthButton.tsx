import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useUser, signInWithGoogle } from "@/lib/auth";
import { UserRound, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { SignOutButton } from "./SignOutButton";

const G = <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>;

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <button onClick={() => signInWithGoogle().catch(() => toast.error("Google sign-in failed"))}
      className="google-btn inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-sm font-medium sm:px-3">
      {G}{label}
    </button>
  );
}
export function AuthButton() {
  const { user, ready } = useUser();
  if (!ready) return <span className="h-8 w-8" />;
  if (!user) return <GoogleButton label="Sign in" />;
  const pic = user.user_metadata?.['avatar_url'] as string | undefined;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu" title="Account menu" className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-primary/60 bg-primary/15 p-0 text-xs font-bold text-primary">
          {pic ? <img src={pic} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : (user.email?.[0] ?? "V").toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild><Link to="/profile"><UserRound />My profile</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/leaderboard"><Trophy />My ranking</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <SignOutButton className="w-full justify-start" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
