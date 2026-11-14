import { supabase } from "@/integrations/supabase/client";
import type { Classification, Target } from "./sky";
import { patchKey } from "./sky";

export const CLASS_TO_DB: Record<Classification, string> = {
  "Planet X candidate": "planet_x", "Brown Dwarf candidate": "brown_dwarf", "Asteroid/Comet": "asteroid_comet", "Variable Star": "variable_star", "Unknown anomaly": "unknown",
};
export const DB_TO_LABEL: Record<string, string> = { planet_x: "Planet X candidate", brown_dwarf: "Brown dwarf", asteroid_comet: "Asteroid / comet", variable_star: "Variable star", unknown: "Something changed" };

const SKEY = "astroswipe.session.v1";
export function sessionId() {
  let id = localStorage.getItem(SKEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(SKEY, id); }
  return id;
}
const SECRET = "astroswipe.session.secret.v1";
export function sessionSecret() {
  let v = localStorage.getItem(SECRET);
  if (!v) { v = crypto.randomUUID() + crypto.randomUUID(); localStorage.setItem(SECRET, v); }
  return v;
}
let registered: Promise<void> | null = null;
/** Bind this browser's session id to a private secret; start a fresh session if the old one can't be proven. */
export function ensureSession() {
  registered ??= (async () => {
    const { data } = await supabase.rpc("register_guest_session", { _session: sessionId(), _secret: sessionSecret() });
    if (data === false) {
      localStorage.setItem(SKEY, crypto.randomUUID());
      await supabase.rpc("register_guest_session", { _session: sessionId(), _secret: sessionSecret() });
    }
  })();
  return registered;
}
const SEEN = "astroswipe.seen.v1";
export function seenSet(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN) || "[]")); } catch { return new Set(); }
}
export function markSeen(id: string) { const s = seenSet(); s.add(id); localStorage.setItem(SEEN, JSON.stringify([...s])); }
/** Merge patches this browser session already reviewed according to the server. */
export async function syncSeen() {
  await ensureSession();
  const { data } = await supabase.rpc("session_seen_patches", { _session: sessionId(), _secret: sessionSecret() });
  const s = seenSet(); (data as string[] | null)?.forEach((p) => s.add(p)); localStorage.setItem(SEEN, JSON.stringify([...s])); return s;
}
export type SwipeResult = "ok" | "duplicate" | "rate_limited" | "error";
export async function recordSwipe(t: Target, verdict: "candidate" | "static" | "skipped", cls?: Classification): Promise<SwipeResult> {
  const id = patchKey(t);
  await ensureSession();
  const { error } = await supabase.from("swipes").insert({
    patch_id: id, ra: t.ra, dec: t.dec, constellation: t.constellation, verdict,
    candidate_type: cls ? CLASS_TO_DB[cls] : null, user_session_id: sessionId(),
  });
  if (!error) { markSeen(id); return "ok"; }
  if (error.code === "23505" || error.message.includes("DUPLICATE")) { markSeen(id); return "duplicate"; }
  if (error.message.includes("RATE_LIMIT")) return "rate_limited";
  console.error("swipe not saved", error); return "error";
}

/** Flagged patches still collecting verification votes, oldest first, excluding ones this volunteer already saw. */
export async function fetchVerifyQueue(seen: Set<string>, userId?: string) {
  const { data } = await supabase.from("patch_verification").select("patch_id, ra, dec, discoverer_id, yes_votes, no_votes")
    .eq("status", "pending").order("flagged_at", { ascending: true }).limit(200);
  return (data ?? []).filter((r) => r.patch_id && !seen.has(r.patch_id) && (!userId || r.discoverer_id !== userId));
}
/** Has anyone flagged this patch before? Used to tell a volunteer they were first. */
export async function alreadyFlagged(patchId: string) {
  const { data } = await supabase.from("patch_verification").select("patch_id").eq("patch_id", patchId).maybeSingle();
  return !!data;
}
