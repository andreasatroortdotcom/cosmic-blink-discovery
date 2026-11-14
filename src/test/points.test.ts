import { describe, it, expect } from "vitest";
import { verificationStatus, isVerifySlot, pointsFor } from "@/lib/points";

describe("verification", () => {
  it("stays pending below 10 votes", () => expect(verificationStatus(9, 0)).toBe("pending"));
  it("confirms at 70% of 10", () => expect(verificationStatus(7, 3)).toBe("confirmed"));
  it("sends 60% to second review", () => expect(verificationStatus(6, 4)).toBe("second_review"));
});
describe("feed mix", () => {
  it("at most 20% of cards are verification slots", () => {
    const slots = Array.from({ length: 100 }, (_, i) => i).filter(isVerifySlot).length;
    expect(slots).toBe(20);
  });
});
describe("points", () => {
  it("first flag confirmed = 1 + 10 + 100", () => expect(pointsFor({ reviews: 1, verifications: 0, firstFlags: 1, confirmed: 1 })).toBe(111));
  it("verification vote = 1 + 5", () => expect(pointsFor({ reviews: 1, verifications: 1, firstFlags: 0, confirmed: 0 })).toBe(6));
});
