type CompletedSession = {
  readonly startedAt: Date;
  readonly stoppedAt: Date | null;
};

export function sumCompletedSeconds(
  sessions: readonly CompletedSession[],
): number {
  return sessions.reduce((total, session) => {
    if (session.stoppedAt === null) {
      return total;
    }

    const durationSeconds = Math.floor(
      (session.stoppedAt.getTime() - session.startedAt.getTime()) / 1_000,
    );

    return total + Math.max(0, durationSeconds);
  }, 0);
}
