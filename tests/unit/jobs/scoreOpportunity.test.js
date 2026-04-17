import { describe, it, expect } from "@jest/globals";
import { scoreOpportunity } from "../../../src/jobs/scoreOpportunity.js";

function opp(overrides = {}) {
  return {
    title:            "Community Helper",
    description:      "Assist locals",
    requiredSkills:   [],
    availabilityDays: [],
    startDate:        null,
    location:         "Riyadh",
    charity:          { category: "EDUCATION" },
    ...overrides,
  };
}

describe("scoreOpportunity()", () => {
  it("returns 0 for a completely mismatched profile", () => {
    expect(scoreOpportunity(opp(), [], [], [])).toBe(0);
  });

  it("adds +2 per matching required skill", () => {
    const score = scoreOpportunity(
      opp({ requiredSkills: ["React", "Node"] }),
      ["react", "python"],
      [],
      [],
    );
    expect(score).toBe(2); // "react" matches "React" case-insensitively
  });

  it("adds +2 for each matching required skill (multiple)", () => {
    const score = scoreOpportunity(
      opp({ requiredSkills: ["React", "Node"] }),
      ["React", "Node"],
      [],
      [],
    );
    expect(score).toBe(4);
  });

  it("uses fuzzy fallback (+1 per skill in title/description) when requiredSkills is empty", () => {
    const score = scoreOpportunity(
      opp({ title: "React developer needed", description: "Node experience helpful" }),
      ["react", "node"],
      [],
      [],
    );
    expect(score).toBe(2);
  });

  it("skips fuzzy fallback when requiredSkills is non-empty", () => {
    const score = scoreOpportunity(
      opp({ requiredSkills: ["Python"], title: "React and Node needed" }),
      ["react"],
      [],
      [],
    );
    expect(score).toBe(0); // requiredSkills present but "react" not in them
  });

  it("adds +3 per matching availability day", () => {
    const score = scoreOpportunity(
      opp({ availabilityDays: ["MONDAY", "WEDNESDAY"] }),
      [],
      ["MONDAY", "FRIDAY"],
      [],
    );
    expect(score).toBe(3);
  });

  it("adds +1 start-day fallback when availabilityDays is empty", () => {
    // 2024-01-01 is a Monday
    const score = scoreOpportunity(
      opp({ availabilityDays: [], startDate: "2024-01-01" }),
      [],
      ["MONDAY"],
      [],
    );
    expect(score).toBe(1);
  });

  it("skips start-day fallback when volunteer has no days", () => {
    const score = scoreOpportunity(
      opp({ availabilityDays: [], startDate: "2024-01-01" }),
      [],
      [],
      [],
    );
    expect(score).toBe(0);
  });

  it("adds +3 for CATEGORY preference match", () => {
    const score = scoreOpportunity(
      opp({ charity: { category: "HEALTH" } }),
      [],
      [],
      [{ type: "CATEGORY", value: "HEALTH" }],
    );
    expect(score).toBe(3);
  });

  it("adds +2 for CITY preference match", () => {
    const score = scoreOpportunity(
      opp({ location: "Jeddah" }),
      [],
      [],
      [{ type: "CITY", value: "Jeddah" }],
    );
    expect(score).toBe(2);
  });

  it("accumulates all match types", () => {
    const score = scoreOpportunity(
      opp({
        requiredSkills:   ["React"],
        availabilityDays: ["MONDAY"],
        location:         "Riyadh",
        charity:          { category: "EDUCATION" },
      }),
      ["React"],
      ["MONDAY"],
      [
        { type: "CATEGORY", value: "EDUCATION" },
        { type: "CITY",     value: "Riyadh" },
      ],
    );
    expect(score).toBe(2 + 3 + 3 + 2); // skill + day + category + city
  });
});
