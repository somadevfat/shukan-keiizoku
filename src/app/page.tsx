import Link from "next/link";

import {
  createTask,
  setDailyGoal,
  startMeasurementFromForm,
  stopMeasurementFromForm,
} from "./actions";
import styles from "./page.module.css";
import { TimerControls } from "./timer-controls";

import { formatMinutes } from "@/features/measurements/domain/format-duration";
import { getDashboardData } from "@/server/local-dashboard";

export const dynamic = "force-dynamic";

/**
 * 習慣カウンターアプリのメイン画面（ホームページ）です。
 * @responsibility: ユーザーのダッシュボード情報を取得し、タスク一覧や目標達成状況、ストップウォッチを提示する。
 */
export default async function Home() {
  /* ダッシュボードのデータを一括で取得する */
  const dashboard = await getDashboardData();
  const hasNoTasks = dashboard.tasks.length === 0;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.date}>{dashboard.dateLabel}</p>
          <h1>今日の積み上げ</h1>
        </div>
        <div className={styles.headerActions}>
          <Link href="/history" className={styles.historyLink}>
            履歴
          </Link>
          <span className={styles.profile} aria-label="ローカル利用者">
            L
          </span>
        </div>
      </header>

      {/* タスクが1つも存在しない場合のみ、初期化を促すガイド表示を表示する */}
      {hasNoTasks ? (
        <section className={styles.emptyState}>
          <p className={styles.label}>最初のタスク</p>
          <h2>続けたいことを登録しましょう</h2>
          <p>
            登録すると、ストップウォッチで実際の取り組み時間を記録できます。
          </p>
        </section>
      ) : null}

      <section className={styles.tasksSection} aria-labelledby="tasks-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.label}>習慣</p>
            <h2 id="tasks-title">タスク一覧</h2>
          </div>
        </div>

        {/* 新しい習慣タスクを作成するフォーム */}
        <form action={createTask} className={styles.createForm}>
          <label>
            <span>新しいタスク</span>
            <input
              name="name"
              maxLength={80}
              required
              placeholder="例: 英語の学習"
            />
          </label>
          <button type="submit">追加</button>
        </form>

        {/* 登録された習慣タスクをカード形式で列挙するリスト */}
        <ul className={styles.taskList}>
          {dashboard.tasks.map((task) => (
            <li key={task.id} className={styles.taskCard}>
              <div className={styles.taskInfo}>
                <div className={styles.taskHeader}>
                  <strong className={styles.taskName}>{task.name}</strong>
                  <span className={styles.taskTime}>
                    今日 {formatMinutes(task.todaySeconds)}
                  </span>
                </div>

                {/* 各タスク個別のストップウォッチコントロールを設置 */}
                <div className={styles.timerWrapper}>
                  <TimerControls
                    taskId={task.id}
                    activeMeasurement={dashboard.activeMeasurement}
                    startAction={startMeasurementFromForm}
                    stopAction={stopMeasurementFromForm}
                  />
                </div>

                {/* 目標時間および進捗率、昨日との実績比（目標が設定されている場合のみ表示） */}
                {task.goalSeconds !== null && (
                  <div className={styles.progressBlock}>
                    <div className={styles.progressCopy}>
                      <span>目標 {formatMinutes(task.goalSeconds)}</span>
                      <span>
                        達成率{" "}
                        {Math.min(
                          100,
                          Math.round(
                            (task.todaySeconds / task.goalSeconds) * 100,
                          ),
                        )}
                        %
                      </span>
                    </div>
                    <div
                      className={styles.progressTrack}
                      role="progressbar"
                      aria-label={`${task.name}の今日の目標達成率`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(
                        100,
                        Math.round(
                          (task.todaySeconds / task.goalSeconds) * 100,
                        ),
                      )}
                    >
                      <span
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (task.todaySeconds / task.goalSeconds) * 100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                    {task.comparisonPercentage !== null && (
                      <p className={styles.comparison}>
                        昨日の実績に対して{" "}
                        {task.comparisonPercentage >= 0 ? "+" : ""}
                        {task.comparisonPercentage}% の目標です。
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 日別の目標時間を設定するフォームセクション */}
              <div className={styles.goalSection}>
                <form action={setDailyGoal} className={styles.goalForm}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <label>
                    <span>今日の目標（分）</span>
                    <input
                      type="number"
                      name="goalMinutes"
                      min={1}
                      max={1_440}
                      required
                      defaultValue={
                        task.goalSeconds === null
                          ? undefined
                          : task.goalSeconds / 60
                      }
                    />
                  </label>
                  <button type="submit">保存</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
