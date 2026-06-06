import {
  eachDayOfInterval,
  endOfMonth,
  getDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import Link from "next/link";

import styles from "../page.module.css";

import { formatMinutes } from "@/features/measurements/domain/format-duration";
import { getHistoryData } from "@/server/local-history";

export const dynamic = "force-dynamic";

/**
 * 過去3ヶ月分の月間カレンダーグリッドをレンダリングします。
 * @responsibility: 特定の月について曜日グリッドを作成し、活動日の丸いハイライト表示を適用する。
 * @param monthDate: レンダリング対象の月を表すDateオブジェクト
 * @param activeDates: 取り組み実績が存在する日付（YYYY-MM-DD）のリスト
 * @return: レンダリングされたJSX要素
 */
function renderCalendar(monthDate: Date, activeDates: readonly string[]) {
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

          const isActive = activeDates.includes(dayKey);

          return (
            <span
              key={dayKey}
              className={`${styles.calendarDay} ${isActive ? styles.activeDay : ""}`}
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
export default async function HistoryPage() {
  const now = new Date();
  const historyData = await getHistoryData(now);

  /* 過去3ヶ月分（当月、1ヶ月前、2ヶ月前）のカレンダーを取得する */
  const monthsToRender = [now, subMonths(now, 1), subMonths(now, 2)];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.date}>積み上げの軌跡</p>
          <h1>継続履歴</h1>
        </div>
        <Link href="/" className={styles.backButton}>
          戻る
        </Link>
      </header>

      {/* ストリーク指標（現在継続日数・最長継続日数）のサマリーカード */}
      <section className={styles.streakSection}>
        <div className={styles.streakCardContainer}>
          <div className={styles.streakCard}>
            <span className={styles.streakEmoji} role="img" aria-label="炎">
              🔥
            </span>
            <div>
              <p className={styles.streakValue}>
                {historyData.currentStreak}日
              </p>
              <p className={styles.streakLabel}>現在の継続日数</p>
            </div>
          </div>
          <div className={styles.streakCard}>
            <span
              className={styles.streakEmoji}
              role="img"
              aria-label="トロフィー"
            >
              🏆
            </span>
            <div>
              <p className={styles.streakValue}>
                {historyData.longestStreak}日
              </p>
              <p className={styles.streakLabel}>最長継続日数</p>
            </div>
          </div>
        </div>
      </section>

      {/* 直近3ヶ月のカレンダー表示セクション */}
      <section className={styles.calendarSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.label}>活動</p>
            <h2>過去3ヶ月のカレンダー</h2>
          </div>
        </div>
        <div className={styles.calendarMonths}>
          {monthsToRender.map((month) =>
            renderCalendar(month, historyData.activeDates),
          )}
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
