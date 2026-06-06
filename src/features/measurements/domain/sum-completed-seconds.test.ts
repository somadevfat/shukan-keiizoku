import { describe, expect, it } from "vitest";

import { sumCompletedSeconds } from "./sum-completed-seconds";

describe("sumCompletedSeconds", () => {
  it("完了した計測時間を合計する", () => {
    expect(
      sumCompletedSeconds([
        {
          startedAt: new Date("2026-06-06T00:00:00.000Z"),
          stoppedAt: new Date("2026-06-06T00:10:00.000Z"),
        },
        {
          startedAt: new Date("2026-06-06T01:00:00.000Z"),
          stoppedAt: new Date("2026-06-06T01:05:00.000Z"),
        },
      ]),
    ).toBe(900);
  });

  it("計測中のセッションは合計しない", () => {
    expect(
      sumCompletedSeconds([
        {
          startedAt: new Date("2026-06-06T00:00:00.000Z"),
          stoppedAt: null,
        },
      ]),
    ).toBe(0);
  });

  it("終了時刻が開始時刻より前の不正な時間は0秒として扱う", () => {
    expect(
      sumCompletedSeconds([
        {
          startedAt: new Date("2026-06-06T00:10:00.000Z"),
          stoppedAt: new Date("2026-06-06T00:00:00.000Z"),
        },
      ]),
    ).toBe(0);
  });
});
