import "server-only";

import { endOfDay, startOfDay, subDays } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

import { calculateGoalComparison } from "@/features/goals/domain/calculate-goal-comparison";
import { sumCompletedSeconds } from "@/features/measurements/domain/sum-completed-seconds";
import { requireCurrentUser } from "@/server/current-user";
import { db } from "@/server/db";

export type DashboardTask = {
  readonly id: string;
  readonly name: string;
  readonly todaySeconds: number;
  readonly yesterdaySeconds: number;
  readonly goalSeconds: number | null;
  readonly comparisonPercentage: number | null;
};

export type ActiveMeasurement = {
  readonly id: string;
  readonly taskId: string;
  readonly startedAt: string;
};

export type DashboardData = {
  readonly currentUserName: string;
  readonly dateLabel: string;
  readonly tasks: readonly DashboardTask[];
  readonly activeMeasurement: ActiveMeasurement | null;
  readonly reflections: readonly {
    readonly id: string;
    readonly obstacle: string;
    readonly nextAction: string;
    readonly updatedAtLabel: string;
  }[];
};

function getDayRange(now: Date, timeZone: string, offsetDays: number) {
  const zonedDate = subDays(toZonedTime(now, timeZone), offsetDays);
  const localDateParts = formatInTimeZone(zonedDate, timeZone, "yyyy-MM-dd")
    .split("-")
    .map(Number);
  const [year, month, day] = localDateParts;

  if (year === undefined || month === undefined || day === undefined) {
    throw new Error("ローカル日付を算出できませんでした。");
  }

  return {
    start: fromZonedTime(startOfDay(zonedDate), timeZone),
    end: fromZonedTime(endOfDay(zonedDate), timeZone),
    localDate: new Date(Date.UTC(year, month - 1, day)),
  };
}

export async function getDashboardData(
  now = new Date(),
): Promise<DashboardData> {
  const user = await requireCurrentUser();
  const today = getDayRange(now, user.timeZone, 0);
  const yesterday = getDayRange(now, user.timeZone, 1);

  const [tasks, activeMeasurement, reflection] = await Promise.all([
    db.habitTask.findMany({
      where: { userId: user.id, archivedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        dailyGoals: {
          where: { localDate: today.localDate },
          take: 1,
        },
        measurementSessions: {
          where: {
            deletedAt: null,
            startedAt: { gte: yesterday.start, lte: today.end },
          },
        },
      },
    }),
    db.measurementSession.findFirst({
      where: { userId: user.id, stoppedAt: null, deletedAt: null },
      orderBy: { startedAt: "desc" },
    }),
    db.continuityReflection.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    currentUserName: user.name ?? user.email,
    dateLabel: new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "long",
      timeZone: user.timeZone,
    }).format(now),
    activeMeasurement:
      activeMeasurement === null
        ? null
        : {
            id: activeMeasurement.id,
            taskId: activeMeasurement.taskId,
            startedAt: activeMeasurement.startedAt.toISOString(),
          },
    reflections: reflection.map((item) => ({
      id: item.id,
      obstacle: item.obstacle,
      nextAction: item.nextAction,
      updatedAtLabel: new Intl.DateTimeFormat("ja-JP", {
        month: "numeric",
        day: "numeric",
        timeZone: user.timeZone,
      }).format(item.updatedAt),
    })),
    tasks: tasks.map((task) => {
      const todaySeconds = sumCompletedSeconds(
        task.measurementSessions.filter(
          (session) =>
            session.startedAt >= today.start && session.startedAt <= today.end,
        ),
      );
      const yesterdaySeconds = sumCompletedSeconds(
        task.measurementSessions.filter(
          (session) =>
            session.startedAt >= yesterday.start &&
            session.startedAt <= yesterday.end,
        ),
      );
      const goalSeconds = task.dailyGoals[0]?.goalSeconds ?? null;
      const comparison =
        goalSeconds === null
          ? null
          : calculateGoalComparison(yesterdaySeconds, goalSeconds);

      return {
        id: task.id,
        name: task.name,
        todaySeconds,
        yesterdaySeconds,
        goalSeconds,
        comparisonPercentage:
          comparison?.kind === "comparable" ? comparison.percentage : null,
      };
    }),
  };
}
