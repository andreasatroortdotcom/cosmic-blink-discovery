import { supabase } from "@/integrations/supabase/client";
import type { Classification, Target } from "./sky";
import { patchKey } from "./sky";

export const CLASS_TO_DB: Record<Classification, string> = {
  "Planet X candidate": "planet_x", "Brown Dwarf candidate": "brown_dwarf", "Asteroid/Comet": "asteroid_comet", "Variable Star": "variable_star", "Unknown anomaly": "unknown",
};
export const DB_TO_LABEL: Record<string, string> = { planet_x: "Planet X candidate", brown_dwarf: "Brown dwarf", asteroid_comet: "Asteroid / comet", variable_star: "Variable star", unknown: "Unknown anomaly" };

const SKEY = "astroswipe.session.v1";
export function sessionId() {
  let id = localStorage.getItem(SKEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(SKEY, id); }
  return id;
}
const SEEN = "astroswipe.seen.v1";
export function seenSet(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN) || "[]")); } catch { return new Set(); }
}
export function markSeen(id: string) { const s = seenSet(); s.add(id); localStorage.setItem(SEEN, JSON.stringify([...s])); }
/** Merge patches this browser session already reviewed according to the server. */
export async function syncSeen() {
  const { data } = await supabase.from("swipes").select("patch_id").eq("user_session_id", sessionId()).limit(1000);
  const s = seenSet(); data?.forEach((r) => s.add(r.patch_id)); localStorage.setItem(SEEN, JSON.stringify([...s])); return s;
}
export type SwipeResult = "ok" | "duplicate" | "rate_limited" | "error";
export async function recordSwipe(t: Target, verdict: "candidate" | "static" | "skipped", cls?: Classification): Promise<SwipeResult> {
  const id = patchKey(t);
  const { error } = await supabase.from("swipes").insert({
    patch_id: id, ra: t.ra, dec: t.dec, constellation: t.constellation, verdict,
    candidate_type: cls ? CLASS_TO_DB[cls] : null, user_session_id: sessionId(),
  });
  if (!error) { markSeen(id); return "ok"; }
  if (error.code === "23505" || error.message.includes("DUPLICATE")) { markSeen(id); return "duplicate"; }
  if (error.message.includes("RATE_LIMIT")) return "rate_limited";
  console.error("swipe not saved", error); return "error";
}
