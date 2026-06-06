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

function formatElapsed(startedAt: string | null, now: number): string {
  if (startedAt === null) {
    return "00:00:00";
  }

  const totalSeconds = Math.max(
    0,
    Math.floor((now - new Date(startedAt).getTime()) / 1_000),
  );
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

export function TimerControls({
  taskId,
  activeMeasurement,
  startAction,
  stopAction,
}: TimerControlsProps) {
  const [now, setNow] = useState(() => Date.now());
  const isThisTaskActive = activeMeasurement?.taskId === taskId;

  useEffect(() => {
    if (!isThisTaskActive) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [isThisTaskActive]);

  return (
    <>
      <p className={styles.time}>
        {formatElapsed(
          isThisTaskActive ? activeMeasurement.startedAt : null,
          now,
        )}
      </p>
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
    </>
  );
}
