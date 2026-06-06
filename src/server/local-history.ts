import "server-only";

import { formatInTimeZone } from "date-fns-tz";

import { calculateStreak } from "@/features/streaks/domain/calculate-streak";
import { db } from "@/server/db";
import { ensureLocalUser } from "@/server/local-dashboard";

export type DailyTaskActivity = {
  readonly taskId: string;
  readonly taskName: string;
  readonly totalSeconds: number;
};

export type DailyHistoryItem = {
  readonly localDateStr: string; // YYYY-MM-DD
  readonly totalSeconds: number; // その日の全タスク合計秒数
  readonly activities: readonly DailyTaskActivity[];
};

export type HistoryData = {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly activeDates: readonly string[]; // 取り組みのあったローカル日付のリスト（昇順）
  readonly dailyHistory: readonly DailyHistoryItem[]; // 日付ごとの詳細実績（降順）
};

/**
 * タイムゾーンを考慮して、ローカルユーザーの全取り組み履歴およびストリーク情報を取得します。
 * @responsibility: データベースからセッションを全取得し、ローカル日付ごとに実績秒数を集計してストリーク結果とともに返す。
 * @param now: 基準となる現在の時間（テスト用の引数、デフォルトは現在のシステム時刻）
 * @return: 継続日数および日別実績データを含む HistoryData オブジェクト
 */
export async function getHistoryData(now = new Date()): Promise<HistoryData> {
  /* ローカルユーザーレコードが存在することを確認し取得する */
  const user = await ensureLocalUser();

  /* 削除されていないすべての計測セッションを最新順に取得する */
  const sessions = await db.measurementSession.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { startedAt: "desc" },
    include: { task: true },
  });

  /* セッションの開始時刻をローカル日付文字列（YYYY-MM-DD）に変換して重複排除する */
  const activeDateSet = new Set<string>();
  sessions.forEach((session) => {
    const dateStr = formatInTimeZone(
      session.startedAt,
      user.timeZone,
      "yyyy-MM-dd",
    );
    activeDateSet.add(dateStr);
  });

  /* ストリーク計算用に昇順ソートした配列を作成する */
  const activeDates = Array.from(activeDateSet).sort();

  /* 今日のローカル日付文字列を算出する */
  const todayStr = formatInTimeZone(now, user.timeZone, "yyyy-MM-dd");

  /* ドメインの純粋関数を呼び出してストリーク数を計算する */
  const { currentStreak, longestStreak } = calculateStreak(
    activeDates,
    todayStr,
  );

  /* 日付・タスクごとの取り組み秒数を集計するためのテンポラリマップ */
  const dailyGroups: {
    [date: string]: {
      [taskId: string]: { name: string; seconds: number };
    };
  } = {};

  sessions.forEach((session) => {
    /* 停止時刻が設定されていない（現在計測中の）セッションは実績集計の対象外とする */
    if (session.stoppedAt === null) {
      return;
    }

    const dateStr = formatInTimeZone(
      session.startedAt,
      user.timeZone,
      "yyyy-MM-dd",
    );
    const seconds = Math.max(
      0,
      Math.floor(
        (session.stoppedAt.getTime() - session.startedAt.getTime()) / 1_000,
      ),
    );

    /* 計測時間が1秒未満のデータは集計に含まない */
    if (seconds <= 0) {
      return;
    }

    if (!dailyGroups[dateStr]) {
      dailyGroups[dateStr] = {};
    }

    const taskId = session.taskId;
    const taskName = session.task.name;

    if (!dailyGroups[dateStr][taskId]) {
      dailyGroups[dateStr][taskId] = { name: taskName, seconds: 0 };
    }

    dailyGroups[dateStr][taskId].seconds += seconds;
  });

  /* 集計マップをソートおよび構造化して日別履歴配列を作成する（最新日付が先頭となるように降順ソート） */
  const dailyHistory: DailyHistoryItem[] = Object.keys(dailyGroups)
    .sort((a, b) => b.localeCompare(a))
    .map((dateStr) => {
      const taskGroup = dailyGroups[dateStr] ?? {};
      const activities: DailyTaskActivity[] = Object.entries(taskGroup).map(
        ([taskId, info]) => ({
          taskId,
          taskName: info.name,
          totalSeconds: info.seconds,
        }),
      );

      /* その日の合計秒数を計算する */
      const totalSeconds = activities.reduce(
        (sum, act) => sum + act.totalSeconds,
        0,
      );

      return {
        localDateStr: dateStr,
        totalSeconds,
        activities,
      };
    });

  return {
    currentStreak,
    longestStreak,
    activeDates,
    dailyHistory,
  };
}
