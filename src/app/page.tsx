import Link from "next/link";

import {
  createTask,
  saveContinuityReflection,
  setDailyGoal,
  startMeasurementFromForm,
  stopMeasurementFromForm,
  updateTask,
} from "./actions";
import { ArchiveTaskForm } from "./archive-task-form";
import { AuthControls } from "./auth-controls";
import styles from "./page.module.css";
import { TimerControls } from "./timer-controls";

import { formatMinutes } from "@/features/measurements/domain/format-duration";
import { getDashboardData } from "@/server/local-dashboard";

export const dynamic = "force-dynamic";

type HomeProps = {
  readonly searchParams: Promise<{
    readonly memo?: string;
    readonly memoStatus?: string;
  }>;
};

/**
 * 習慣カウンターアプリのメイン画面（ホームページ）です。
 * @responsibility: ユーザーのダッシュボード情報を取得し、タスク一覧や目標達成状況、ストップウォッチを提示する。
 */
export default async function Home({ searchParams }: HomeProps) {
  /* ダッシュボードのデータを一括で取得する */
  const { memo, memoStatus } = await searchParams;
  const dashboard = await getDashboardData();
  const hasNoTasks = dashboard.tasks.length === 0;
  const selectedReflection = dashboard.reflections.find(
    (reflection) => reflection.id === memo,
  );
  const isEditorOpen = memo === "new" || selectedReflection !== undefined;

  return (
    <main className={`${styles.page} ${styles.dashboardPage}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.date}>{dashboard.dateLabel}</p>
          <h1>今日の積み上げ</h1>
        </div>
        <div className={styles.headerActions}>
          <Link href="/history" className={styles.historyLink}>
            履歴
          </Link>
          <AuthControls
            isGuest={dashboard.isGuest}
            userName={dashboard.currentUserName}
          />
        </div>
      </header>

      <div className={styles.dashboardWorkspace}>
        <div className={styles.dashboardMain}>
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

          <section
            className={styles.tasksSection}
            aria-labelledby="tasks-title"
          >
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
                    <details className={styles.taskEdit}>
                      <summary>編集・削除</summary>
                      <form action={updateTask} className={styles.editForm}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <label>
                          <span>タスク名</span>
                          <input
                            name="name"
                            maxLength={80}
                            required
                            defaultValue={task.name}
                          />
                        </label>
                        <button type="submit">名前を変更</button>
                      </form>
                      <ArchiveTaskForm
                        taskId={task.id}
                        taskName={task.name}
                        disabled={
                          dashboard.activeMeasurement?.taskId === task.id
                        }
                      />
                    </details>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className={styles.reflectionSection}>
          <div className={styles.reflectionHeading}>
            <p className={styles.label}>自己分析</p>
            <h2>継続失敗対策メモ</h2>
          </div>
          <Link href="/?memo=new" className={styles.addReflectionButton}>
            メモを追加
          </Link>
          {memoStatus === "saved" ? (
            <p className={styles.saveStatus} role="status">
              メモを保存しました
            </p>
          ) : null}

          <div className={styles.reflectionList}>
            {dashboard.reflections.length === 0 ? (
              <p className={styles.reflectionEmpty}>
                まだメモはありません。気づいたことを残しておきましょう。
              </p>
            ) : (
              dashboard.reflections.map((reflection) => (
                <Link
                  key={reflection.id}
                  href={`/?memo=${reflection.id}`}
                  className={styles.reflectionItem}
                >
                  <span>{reflection.updatedAtLabel}</span>
                  <strong>
                    {reflection.obstacle === ""
                      ? "つまずいたことは未記入"
                      : reflection.obstacle}
                  </strong>
                  <p>
                    {reflection.nextAction === ""
                      ? "次回の対策は未記入"
                      : reflection.nextAction}
                  </p>
                </Link>
              ))
            )}
          </div>

          {isEditorOpen ? (
            <div className={styles.reflectionEditor}>
              <div className={styles.reflectionEditorHeader}>
                <h3>
                  {selectedReflection === undefined
                    ? "メモを追加"
                    : "メモを編集"}
                </h3>
                <Link href="/" aria-label="編集画面を閉じる">
                  ×
                </Link>
              </div>
              <form
                action={saveContinuityReflection}
                className={styles.reflectionForm}
              >
                {selectedReflection !== undefined ? (
                  <input
                    type="hidden"
                    name="reflectionId"
                    value={selectedReflection.id}
                  />
                ) : null}
                <label>
                  <span>つまずいたこと</span>
                  <textarea
                    name="obstacle"
                    maxLength={1_000}
                    rows={5}
                    defaultValue={selectedReflection?.obstacle}
                    placeholder="例: 帰宅後に疲れて、そのまま休んでしまった"
                  />
                </label>
                <label>
                  <span>次回の対策</span>
                  <textarea
                    name="nextAction"
                    maxLength={1_000}
                    rows={5}
                    defaultValue={selectedReflection?.nextAction}
                    placeholder="例: 帰宅したら休む前に、まず5分だけ始める"
                  />
                </label>
                <button type="submit">メモを保存</button>
              </form>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
