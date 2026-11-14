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
export async function recordSwipe(t: Target, verdict: "candidate" | "static" | "skipped", cls?: Classification) {
  const { error } = await supabase.from("swipes").insert({
    patch_id: patchKey(t), ra: t.ra, dec: t.dec, constellation: t.constellation, verdict,
    candidate_type: cls ? CLASS_TO_DB[cls] : null, user_session_id: sessionId(),
  });
  if (error) console.error("swipe not saved", error);
  return !error;
}
