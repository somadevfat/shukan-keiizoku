import { describe, expect, it } from "vitest";

import { calculateActivityLevel } from "./calculate-activity-level";

describe("calculateActivityLevel", () => {
  it.each([
    { seconds: 0, expected: 0 },
    { seconds: 1, expected: 1 },
    { seconds: 899, expected: 1 },
    { seconds: 900, expected: 2 },
    { seconds: 1_799, expected: 2 },
    { seconds: 1_800, expected: 3 },
    { seconds: 3_599, expected: 3 },
    { seconds: 3_600, expected: 4 },
  ] as const)("$seconds秒の活動レベルは$expected", ({ seconds, expected }) => {
    expect(calculateActivityLevel(seconds)).toBe(expected);
  });
});
