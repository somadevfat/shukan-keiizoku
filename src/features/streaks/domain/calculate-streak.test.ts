import { describe, expect, it } from "vitest";

import { calculateStreak } from "./calculate-streak";

describe("calculateStreak", () => {
  it("活動履歴が空の場合は継続日数と最長継続日数がともに0であること", () => {
    const today = "2026-06-06";
    const result = calculateStreak([], today);

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it("無効な日付フォーマットが含まれている場合は無視して計算されること", () => {
    const today = "2026-06-06";
    /* "invalid-date" という不正な日付文字列はパース時に除外される */
    const result = calculateStreak(
      ["2026-06-06", "invalid-date", "2026-06-05"],
      today,
    );

    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it("すべての日付が無効なフォーマットの場合は継続日数と最長継続日数がともに0であること", () => {
    const today = "2026-06-06";
    /* 有効な日付インデックスが1件も存在しない場合のガード節が動作することを確認する */
    const result = calculateStreak(["not-a-date", "also-invalid"], today);

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it("今日のみ活動がある場合は継続日数が1であること", () => {
    const today = "2026-06-06";
    const result = calculateStreak(["2026-06-06"], today);

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it("昨日のみ活動がある場合は継続日数が1であること", () => {
    const today = "2026-06-06";
    const result = calculateStreak(["2026-06-05"], today);

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it("昨日から連続しているとき、リスト上で起点より新しい日付はスキップされること", () => {
    const today = "2026-06-06";
    /* activeDates には今日は存在しない（昨日起点）が、06-07のような未来の日付も混入させる
       → 降順ループで targetIndex（06-05インデックス）より大きい日付は読み飛ばされる */
    const result = calculateStreak(
      ["2026-06-07", "2026-06-05", "2026-06-04"],
      today,
    );

    /* 今日は含まれないが昨日（06-05）と一昨日（06-04）から連続しているので継続日数は2 */
    expect(result.currentStreak).toBe(2);
    /* [06-04, 06-05] が最長継続ブロック（2日）。06-07 は独立した1日 */
    expect(result.longestStreak).toBe(2);
  });

  it("今日と昨日の両方に活動がない場合は現在継続日数が0であること", () => {
    const today = "2026-06-06";
    const result = calculateStreak(["2026-06-04", "2026-06-03"], today);

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(2);
  });

  it("飛び石で活動がある場合に現在継続日数と最長継続日数が正しく算出されること", () => {
    const today = "2026-06-06";
    const activeDates = [
      "2026-06-06", // 今日（継続対象）
      "2026-06-05", // 昨日（継続対象）
      "2026-06-03", // 3日前
      "2026-06-02", // 4日前
      "2026-06-01", // 5日前
      "2026-05-30", // 7日前
    ];
    const result = calculateStreak(activeDates, today);

    /* 継続中なのは [06-06, 06-05] の2日間 */
    expect(result.currentStreak).toBe(2);
    /* 最長は [06-03, 06-02, 06-01] の3日間 */
    expect(result.longestStreak).toBe(3);
  });

  it("日付の順序がばらばらであったり重複があっても正しく動作すること", () => {
    const today = "2026-06-06";
    const activeDates = [
      "2026-06-05",
      "2026-06-06",
      "2026-06-05", // 重複
      "2026-06-04",
      "2026-06-01",
      "2026-06-02",
    ];
    const result = calculateStreak(activeDates, today);

    /* 重複を排除して [06-06, 06-05, 06-04] が継続中 */
    expect(result.currentStreak).toBe(3);
    /* [06-06, 06-05, 06-04] および [06-02, 06-01] のブロックがあり、最長は5日間（06-04と06-02の間は06-03が抜けているため途切れる） */
    /* 整理すると、一意ソートは [06-01, 06-02, 06-04, 06-05, 06-06]。 */
    /* ブロック1: [06-01, 06-02] (2日間) */
    /* ブロック2: [06-04, 06-05, 06-06] (3日間) */
    expect(result.longestStreak).toBe(3);
  });
});
