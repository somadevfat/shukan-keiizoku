import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import Link from "next/link";

import styles from "../page.module.css";

import { calculateActivityLevel } from "@/features/history/domain/calculate-activity-level";
import { formatMinutes } from "@/features/measurements/domain/format-duration";
import { getHistoryData } from "@/server/local-history";

export const dynamic = "force-dynamic";

/**
 * 月間カレンダーグリッドをレンダリングします。
 * @responsibility: 特定の月について曜日グリッドを作成し、日別実績に応じた色の濃淡を適用する。
 * @param monthDate: レンダリング対象の月を表すDateオブジェクト
 * @param activitySecondsByDate: 日付（YYYY-MM-DD）ごとの実績秒数
 * @return: レンダリングされたJSX要素
 */
function renderCalendar(
  monthDate: Date,
  activitySecondsByDate: ReadonlyMap<string, number>,
) {
  const startOf = startOfMonth(monthDate);
  const endOf = endOfMonth(monthDate);
  const startDay = getDay(startOf); // 0:日, 1:月, ...

  const days = eachDayOfInterval({ start: startOf, end: endOf });
  const yearMonthLabel = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
  }).format(monthDate);

  /* カレンダーの開始曜日（日曜日基準）に合わせた空セル（前月分のパディング）を作成 */
  const emptyCells = Array.from({ length: startDay });

  return (
    <div key={monthDate.toISOString()} className={styles.calendarMonth}>
      <h3 className={styles.calendarMonthTitle}>{yearMonthLabel}</h3>
      <div className={styles.calendarWeekdays}>
        {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
          <span key={day} className={styles.weekday}>
            {day}
          </span>
        ))}
      </div>
      <div className={styles.calendarDaysGrid}>
        {emptyCells.map((_, i) => (
          <span key={`empty-${i}`} className={styles.emptyDay} />
        ))}
        {days.map((day) => {
          const y = day.getFullYear();
          const m = String(day.getMonth() + 1).padStart(2, "0");
          const d = String(day.getDate()).padStart(2, "0");
          const dayKey = `${y}-${m}-${d}`;

          const totalSeconds = activitySecondsByDate.get(dayKey) ?? 0;
          const activityLevel = calculateActivityLevel(totalSeconds);

          return (
            <span
              key={dayKey}
              className={`${styles.calendarDay} ${styles[`activityLevel${activityLevel}`]}`}
              aria-label={`${day.getDate()}日、${totalSeconds === 0 ? "活動なし" : formatMinutes(totalSeconds)}`}
              title={
                totalSeconds === 0 ? "活動なし" : formatMinutes(totalSeconds)
              }
            >
              {day.getDate()}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 継続日数（ストリーク）と過去の取り組み履歴を表示する履歴ページです。
 * @responsibility: 履歴データを取得し、ストリーク統計、月別カレンダー、日別詳細ログを表示する。
 */
type HistoryPageProps = {
  readonly searchParams: Promise<{ readonly month?: string }>;
};

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const now = new Date();
  const { month } = await searchParams;
  const selectedMonth =
    month !== undefined && /^\d{4}-\d{2}$/.test(month)
      ? new Date(`${month}-01T00:00:00`)
      : now;
  const historyData = await getHistoryData(now);
  const activitySecondsByDate = new Map(
    historyData.dailyHistory.map((day) => [day.localDateStr, day.totalSeconds]),
  );
  const previousMonth = format(subMonths(selectedMonth, 1), "yyyy-MM");
  const nextMonth = format(addMonths(selectedMonth, 1), "yyyy-MM");

  return (
    <main className={`${styles.page} ${styles.historyPage}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.date}>積み上げの軌跡</p>
          <h1>継続履歴</h1>
        </div>
        <Link href="/" className={styles.backButton}>
          戻る
        </Link>
      </header>

      <section className={styles.streakSection}>
        <div className={styles.streakCardContainer}>
          <div className={styles.streakCard}>
            <div>
              <p className={styles.streakValue}>
                {historyData.currentStreak}日
              </p>
              <p className={styles.streakLabel}>現在の継続日数</p>
            </div>
            <span className={styles.streakStatus}>継続中</span>
          </div>
          <div className={styles.streakCard}>
            <div>
              <p className={styles.streakValue}>
                {historyData.longestStreak}日
              </p>
              <p className={styles.streakLabel}>最長継続日数</p>
            </div>
            <span className={styles.streakStatus}>自己記録</span>
          </div>
        </div>
      </section>

      <section className={styles.calendarSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.label}>活動</p>
            <h2>月間カレンダー</h2>
          </div>
          <nav
            className={styles.calendarNavigation}
            aria-label="表示月の切り替え"
          >
            <Link href={`/history?month=${previousMonth}`} aria-label="前月">
              ←
            </Link>
            <Link href={`/history?month=${nextMonth}`} aria-label="次月">
              →
            </Link>
          </nav>
        </div>
        <div className={styles.calendarMonths}>
          {renderCalendar(selectedMonth, activitySecondsByDate)}
        </div>
        <div className={styles.activityLegend} aria-label="活動量の凡例">
          <span>少ない</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <i
              key={level}
              className={`${styles.legendCell} ${styles[`activityLevel${level}`]}`}
            />
          ))}
          <span>多い</span>
        </div>
      </section>

      {/* 日別の取り組み詳細一覧（直近順） */}
      <section className={styles.tasksSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.label}>実績</p>
            <h2>日別ログ</h2>
          </div>
        </div>

        {historyData.dailyHistory.length === 0 ? (
          <p className={styles.emptyMessage}>
            まだ計測履歴がありません。タスクの計測を始めましょう！
          </p>
        ) : (
          <ul className={styles.historyList}>
            {historyData.dailyHistory.map((day) => {
              /* 表示用の日付フォーマットを生成 */
              const [y, m, d] = day.localDateStr.split("-").map(Number);
              const formattedDate =
                y !== undefined && m !== undefined && d !== undefined
                  ? `${y}年${m}月${d}日`
                  : day.localDateStr;

              return (
                <li key={day.localDateStr} className={styles.historyItem}>
                  <div className={styles.historyItemHeader}>
                    <span className={styles.historyDate}>{formattedDate}</span>
                    <span className={styles.historyTotal}>
                      合計 {formatMinutes(day.totalSeconds)}
                    </span>
                  </div>
                  <ul className={styles.activityDetailList}>
                    {day.activities.map((act) => (
                      <li
                        key={act.taskId}
                        className={styles.activityDetailItem}
                      >
                        <span>{act.taskName}</span>
                        <strong>{formatMinutes(act.totalSeconds)}</strong>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
