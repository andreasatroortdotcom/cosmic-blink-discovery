import { describe, it, expect } from "vitest";
import { BADGES, unlockedIds, progress } from "@/lib/badges";
const base = { reviewed: 0, flagKinds: [], events: {} };
describe("badges", () => {
  it("has the 8 requested badges", () => expect(BADGES).toHaveLength(8));
  it("First Light at 1 review", () => expect(unlockedIds({ ...base, reviewed: 1 })).toContain("first-light"));
  it("Survey Pioneer needs 25 reviews", () => {
    expect(unlockedIds({ ...base, reviewed: 24 })).not.toContain("survey-pioneer");
    expect(unlockedIds({ ...base, reviewed: 25 })).toContain("survey-pioneer");
  });
  it("Planet X Hunter from a planet-x flag", () => expect(unlockedIds({ ...base, flagKinds: ["planet-x"] })).toContain("planet-x-hunter"));
  it("Brown Dwarf Scout from a brown dwarf flag", () => expect(unlockedIds({ ...base, flagKinds: ["binary-bd"] })).toContain("brown-dwarf-scout"));
  it("progress caps at goal", () => expect(progress(BADGES[1], { ...base, reviewed: 40 })).toBe(25));
});
