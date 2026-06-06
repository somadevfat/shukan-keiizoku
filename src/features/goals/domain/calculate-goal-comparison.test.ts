import { describe, expect, it } from "vitest";

import { calculateGoalComparison } from "./calculate-goal-comparison";

describe("calculateGoalComparison", () => {
  it("昨日の実績が0秒の場合は比較不能を返す", () => {
    expect(calculateGoalComparison(0, 600)).toEqual({
      kind: "not-comparable",
    });
  });

  it("今日の目標が昨日の実績より高い場合は正の前日比を返す", () => {
    expect(calculateGoalComparison(1_200, 1_320)).toEqual({
      kind: "comparable",
      percentage: 10,
    });
  });

  it("今日の目標が昨日の実績より低い場合は負の前日比を小数第一位で返す", () => {
    expect(calculateGoalComparison(1_200, 1_100)).toEqual({
      kind: "comparable",
      percentage: -8.3,
    });
  });
});
