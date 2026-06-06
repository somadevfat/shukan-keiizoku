type StreakResult = {
  readonly currentStreak: number;
  readonly longestStreak: number;
};

/**
 * YYYY-MM-DD 形式の日付文字列を UTC 基準の日数インデックス（整数）に変換します。
 * @responsibility: タイムゾーンのズレを防ぎ、日付文字列を一意の整数値（日数）に変換する。
 * @param dateStr: "YYYY-MM-DD" 形式の日付文字列
 * @return: 1970-01-01からの日数（無効な形式の場合はNaN）
 */
function toDayIndex(dateStr: string): number {
  const parts = dateStr.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (year === undefined || month === undefined || day === undefined) {
    return NaN;
  }

  /* UTCのタイムスタンプを生成し、1日の総ミリ秒数（86,400,000）で除算して整数値を算出する */
  const ms = Date.UTC(year, month - 1, day);
  return Math.floor(ms / 86_400_000);
}

/**
 * 活動履歴の日付リストから、現在継続日数（ストリーク数）と過去最長継続日数を算出します。
 * @responsibility: 日付の連続性をインデックス比較により高精度で計算し、現在のストリークおよび最長記録を判定する。
 * @param activeDates: 習慣タスクに取り組んだローカル日付のリスト（例: ["2026-06-01", "2026-06-02"]）
 * @param today: 基準となる今日のローカル日付（"YYYY-MM-DD" 形式）
 * @return: 現在継続日数と最長継続日数を含むオブジェクト
 */
export function calculateStreak(
  activeDates: readonly string[],
  today: string,
): StreakResult {
  /* 活動履歴が空の場合は継続日数・最長日数ともに0を返す */
  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  /* 日付文字列を日数インデックスに変換し、重複排除と昇順でのソートを行う */
  const dayIndices = Array.from(
    new Set(activeDates.map(toDayIndex).filter((index) => !isNaN(index))),
  ).sort((a, b) => a - b);

  /* 有効な日付データが存在しない場合は初期値を返す */
  if (dayIndices.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  /* 最長継続日数（longestStreak）を計算する */
  let longestStreak = 0;
  let currentBlock = 0;
  let prevIndex: number | null = null;

  for (const index of dayIndices) {
    if (prevIndex === null) {
      /* 初回のループではブロックカウントを1に初期化する */
      currentBlock = 1;
    } else if (index === prevIndex + 1) {
      /* 連番であれば現在の継続カウントを増やす */
      currentBlock += 1;
    } else {
      /* 連番が途切れた場合は最長記録を更新し、ブロックカウントを1にリセットする */
      longestStreak = Math.max(longestStreak, currentBlock);
      currentBlock = 1;
    }
    prevIndex = index;
  }
  /* ループ終了後に最後のブロックについて最長記録の更新を行う */
  longestStreak = Math.max(longestStreak, currentBlock);

  /* 現在継続日数（currentStreak）を計算する */
  const todayIndex = toDayIndex(today);
  const yesterdayIndex = todayIndex - 1;

  /* 活動履歴に今日、または昨日の活動日が含まれているかチェックする */
  const hasToday = dayIndices.includes(todayIndex);
  const hasYesterday = dayIndices.includes(yesterdayIndex);

  /* 今日と昨日のどちらも活動履歴に存在しない場合は継続が途切れているため0日とする */
  if (!hasToday && !hasYesterday) {
    return { currentStreak: 0, longestStreak };
  }

  /* 今日活動がある場合は今日、そうでない場合は昨日を起点にして過去方向へ遡る */
  let currentStreak = 0;
  let targetIndex = hasToday ? todayIndex : yesterdayIndex;

  /* 活動履歴を新しい日付順（降順）にしてループを回す */
  const reversedIndices = [...dayIndices].reverse();
  for (const index of reversedIndices) {
    if (index === targetIndex) {
      /* 期待する連番が見つかった場合は継続日数を加算し、次の探索対象（1日前）に移る */
      currentStreak += 1;
      targetIndex -= 1;
    } else if (index < targetIndex) {
      /* 期待する日付インデックスを飛び越えた場合、ストリークが途切れたとみなしループを抜ける */
      break;
    }
  }

  return { currentStreak, longestStreak };
}
