import { archiveTask } from "./actions";
import styles from "./page.module.css";

type ArchiveTaskFormProps = {
  readonly taskId: string;
  readonly taskName: string;
  readonly disabled: boolean;
};

export function ArchiveTaskForm({
  taskId,
  taskName,
  disabled,
}: ArchiveTaskFormProps) {
  const confirmationId = `archive-confirmation-${taskId}`;

  return (
    <div className={styles.archiveForm}>
      <p>削除後も計測履歴は保持されます。</p>
      {disabled ? (
        <button type="button" disabled>
          削除
        </button>
      ) : (
        <label className={styles.archiveTrigger} htmlFor={confirmationId}>
          削除
        </label>
      )}

      <input
        className={styles.confirmToggle}
        id={confirmationId}
        type="checkbox"
      />
      <div
        className={styles.confirmOverlay}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`archive-title-${taskId}`}
      >
        <div className={styles.confirmDialog}>
          <h3 id={`archive-title-${taskId}`}>タスクを削除しますか？</h3>
          <p>
            「{taskName}
            」を一覧から削除します。これまでの計測履歴は保持されます。
          </p>
          <div className={styles.confirmActions}>
            <label htmlFor={confirmationId}>キャンセル</label>
            <form action={archiveTask}>
              <input type="hidden" name="taskId" value={taskId} />
              <input type="hidden" name="confirmation" value="archive" />
              <button type="submit" className={styles.confirmDeleteButton}>
                削除する
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
