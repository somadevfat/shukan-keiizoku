"use client";

import { useEffect, useState } from "react";

import styles from "./page.module.css";

type TimerControlsProps = {
  readonly taskId: string;
  readonly activeMeasurement: {
    readonly id: string;
    readonly taskId: string;
    readonly startedAt: string;
  } | null;
  readonly startAction: (formData: FormData) => Promise<void>;
  readonly stopAction: (formData: FormData) => Promise<void>;
};

/**
 * 経過時間を `hh:mm:ss` 形式にフォーマットする純粋関数です。
 * @responsibility: 計測開始時刻と現在時刻から経過時間を計算し、視認しやすい文字列に変換する。
 * @param startedAt: 計測開始日時（ISO形式の文字列またはnull）
 * @param now: 現在のタイムスタンプ（ミリ秒）
 * @return: フォーマットされた経過時間（例: "00:05:23"）
 */
function formatElapsed(startedAt: string | null, now: number): string {
  if (startedAt === null) {
    return "00:00:00";
  }

  /* ミリ秒単位の差分から経過秒数を算出し、負数を防ぐために0との最大値をとる */
  const totalSeconds = Math.max(
    0,
    Math.floor((now - new Date(startedAt).getTime()) / 1_000),
  );

  /* 秒数から時・分・秒にそれぞれ分解する */
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  /* 各数値を2桁にゼロパディングしてコロンで連結する */
  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

/**
 * 各タスクの計測開始および停止を行うストップウォッチコンポーネントです。
 * @responsibility: タスクの計測状態に応じて、稼働時間のアクティブ更新と、開始/停止ボタンの制御を担当する。
 * @param props: TimerControlsProps（タスクID、アクティブな計測データ、開始/停止のアクション）
 */
export function TimerControls({
  taskId,
  activeMeasurement,
  startAction,
  stopAction,
}: TimerControlsProps) {
  const [now, setNow] = useState(() => Date.now());
  const isThisTaskActive = activeMeasurement?.taskId === taskId;

  /* 計測がアクティブな場合のみ、1秒ごとに画面描画を更新するためのタイマーを設定する */
  useEffect(() => {
    if (!isThisTaskActive) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [isThisTaskActive]);

  return (
    <div className={styles.inlineTimer}>
      {/* 計測中の場合のみリアルタイムタイマーの数値をインライン表示する */}
      {isThisTaskActive && (
        <span className={styles.time}>
          {formatElapsed(activeMeasurement.startedAt, now)}
        </span>
      )}
      <form action={isThisTaskActive ? stopAction : startAction}>
        {isThisTaskActive ? (
          <input
            type="hidden"
            name="measurementId"
            value={activeMeasurement.id}
          />
        ) : (
          <input type="hidden" name="taskId" value={taskId} />
        )}
        <button
          className={isThisTaskActive ? styles.stopButton : styles.startButton}
          type="submit"
          disabled={activeMeasurement !== null && !isThisTaskActive}
        >
          {isThisTaskActive ? "計測を止める" : "計測を始める"}
        </button>
      </form>
    </div>
  );
}
