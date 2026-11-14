/** Scoring + verification rules. The database views compute the real totals; these mirror them for UI and tests. */
export const POINTS = { review: 1, verify: 5, firstFlag: 10, confirmedBonus: 100, correctVerify: 5 } as const;
/** Points needed (Brown Dwarf Hunter) to make the final call on second-review patches. */
export const FINAL_CALL_POINTS = 800;
export function canMakeFinalCall(points: number) { return points >= FINAL_CALL_POINTS; }
export const VERIFY_VOTES_NEEDED = 10;
export const CONFIRM_RATIO = 0.7;
/** Max share of feed cards that are verification tasks: every 5th card = 20%. */
export const VERIFY_EVERY = 5;

export type VerifyStatus = "pending" | "confirmed" | "second_review";
export function verificationStatus(yes: number, no: number): VerifyStatus {
  if (yes + no < VERIFY_VOTES_NEEDED) return "pending";
  return yes >= CONFIRM_RATIO * (yes + no) ? "confirmed" : "second_review";
}
/** Card at 0-based feed position `pos` should be a verification task (when one is available). */
export function isVerifySlot(pos: number) { return (pos + 1) % VERIFY_EVERY === 0; }

export function pointsFor(o: { reviews: number; verifications: number; firstFlags: number; confirmed: number; correct?: number }) {
  return o.reviews * POINTS.review + o.verifications * POINTS.verify + o.firstFlags * POINTS.firstFlag + o.confirmed * POINTS.confirmedBonus + (o.correct ?? 0) * POINTS.correctVerify;
}
const TITLES: [number, string][] = [[2000, "Planet X Pioneer"], [800, "Brown Dwarf Hunter"], [300, "Comet Chaser"], [100, "Stellar Scout"], [0, "Stargazer"]];
export function titleFor(points: number) { return TITLES.find(([min]) => points >= min)![1]; }
export function nextTitle(points: number) { const up = [...TITLES].reverse().find(([min]) => min > points); return up ? { name: up[1], at: up[0] } : null; }
