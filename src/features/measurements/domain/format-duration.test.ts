import { describe, expect, it } from "vitest";

import { formatDuration, formatMinutes } from "./format-duration";

describe("formatDuration", () => {
  it("秒数を時分秒形式にする", () => {
    expect(formatDuration(3_661)).toBe("01:01:01");
  });
});

describe("formatMinutes", () => {
  it("1分未満は秒で表示する", () => {
    expect(formatMinutes(42)).toBe("42秒");
  });

  it("1時間未満は分で表示する", () => {
    expect(formatMinutes(1_200)).toBe("20分");
  });

  it("時間と分を表示する", () => {
    expect(formatMinutes(4_200)).toBe("1時間10分");
  });

  it("端数の分がない場合は時間だけ表示する", () => {
    expect(formatMinutes(7_200)).toBe("2時間");
  });
});
