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

export default async function Home() {
  const dashboard = await getDashboardData();
  const activeTask =
    dashboard.tasks.find(
      (task) => task.id === dashboard.activeMeasurement?.taskId,
    ) ??
    dashboard.tasks[0] ??
    null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.date}>{dashboard.dateLabel}</p>
          <h1>今日の積み上げ</h1>
        </div>
        <span className={styles.profile} aria-label="ローカル利用者">
          L
        </span>
      </header>

      {activeTask === null ? (
        <section className={styles.emptyState}>
          <p className={styles.label}>最初のタスク</p>
          <h2>続けたいことを登録しましょう</h2>
          <p>
            登録すると、ストップウォッチで実際の取り組み時間を記録できます。
          </p>
        </section>
      ) : (
        <section className={styles.timer} aria-labelledby="current-task">
          <div className={styles.timerHeading}>
            <div>
              <p className={styles.label}>
                {dashboard.activeMeasurement === null
                  ? "次に取り組むタスク"
                  : "計測中"}
              </p>
              <h2 id="current-task">{activeTask.name}</h2>
            </div>
          </div>

          <TimerControls
            taskId={activeTask.id}
            activeMeasurement={dashboard.activeMeasurement}
            startAction={startMeasurementFromForm}
            stopAction={stopMeasurementFromForm}
          />

          <div className={styles.progressBlock}>
            <div className={styles.progressCopy}>
              <span>今日 {formatMinutes(activeTask.todaySeconds)}</span>
              <span>
                目標{" "}
                {activeTask.goalSeconds === null
                  ? "未設定"
                  : formatMinutes(activeTask.goalSeconds)}
              </span>
            </div>
            {activeTask.goalSeconds !== null && (
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label="今日の目標達成率"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(
                  100,
                  Math.round(
                    (activeTask.todaySeconds / activeTask.goalSeconds) * 100,
                  ),
                )}
              >
                <span
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (activeTask.todaySeconds / activeTask.goalSeconds) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
            )}
            <p className={styles.comparison}>
              {activeTask.comparisonPercentage === null
                ? "今日の目標を設定すると、昨日との比較を表示します。"
                : `昨日の実績に対して ${activeTask.comparisonPercentage >= 0 ? "+" : ""}${activeTask.comparisonPercentage}% の目標です。`}
            </p>
          </div>
        </section>
      )}

      <section className={styles.tasksSection} aria-labelledby="tasks-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.label}>習慣</p>
            <h2 id="tasks-title">タスク一覧</h2>
          </div>
        </div>

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

        <ul className={styles.taskList}>
          {dashboard.tasks.map((task) => (
            <li key={task.id}>
              <div>
                <strong>{task.name}</strong>
                <span>今日 {formatMinutes(task.todaySeconds)}</span>
                {dashboard.activeMeasurement?.taskId !== task.id && (
                  <form action={startMeasurementFromForm}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <button
                      className={styles.compactStartButton}
                      type="submit"
                      disabled={dashboard.activeMeasurement !== null}
                    >
                      このタスクを計測
                    </button>
                  </form>
                )}
              </div>
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
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
