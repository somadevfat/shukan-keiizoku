"use server";

import { revalidatePath } from "next/cache";
import { formatInTimeZone } from "date-fns-tz";
import { z } from "zod";

import { db } from "@/server/db";
import { ensureLocalUser } from "@/server/local-dashboard";

const taskNameSchema = z.string().trim().min(1).max(80);
const idSchema = z.string().min(1);
const goalMinutesSchema = z.coerce.number().int().min(1).max(1_440);

export async function createTask(formData: FormData): Promise<void> {
  const name = taskNameSchema.parse(formData.get("name"));
  const user = await ensureLocalUser();

  await db.habitTask.create({
    data: { name, userId: user.id },
  });

  revalidatePath("/");
}

export async function setDailyGoal(formData: FormData): Promise<void> {
  const taskId = idSchema.parse(formData.get("taskId"));
  const goalMinutes = goalMinutesSchema.parse(formData.get("goalMinutes"));
  const user = await ensureLocalUser();
  const task = await db.habitTask.findFirstOrThrow({
    where: { id: taskId, userId: user.id, archivedAt: null },
  });
  const localDate = new Date(
    `${formatInTimeZone(new Date(), user.timeZone, "yyyy-MM-dd")}T00:00:00.000Z`,
  );

  await db.dailyGoal.upsert({
    where: {
      taskId_localDate: {
        taskId: task.id,
        localDate,
      },
    },
    update: { goalSeconds: goalMinutes * 60 },
    create: {
      userId: user.id,
      taskId: task.id,
      localDate,
      goalSeconds: goalMinutes * 60,
    },
  });

  revalidatePath("/");
}

export async function startMeasurement(taskIdInput: string): Promise<void> {
  const taskId = idSchema.parse(taskIdInput);
  const user = await ensureLocalUser();

  await db.$transaction(async (transaction) => {
    await transaction.habitTask.findFirstOrThrow({
      where: { id: taskId, userId: user.id, archivedAt: null },
    });
    const active = await transaction.measurementSession.findFirst({
      where: { userId: user.id, stoppedAt: null, deletedAt: null },
    });

    if (active !== null) {
      throw new Error("すでに計測中のタスクがあります。");
    }

    await transaction.measurementSession.create({
      data: {
        userId: user.id,
        taskId,
        startedAt: new Date(),
      },
    });
  });

  revalidatePath("/");
}

export async function stopMeasurement(
  measurementIdInput: string,
): Promise<void> {
  const measurementId = idSchema.parse(measurementIdInput);
  const user = await ensureLocalUser();

  await db.measurementSession.updateMany({
    where: {
      id: measurementId,
      userId: user.id,
      stoppedAt: null,
      deletedAt: null,
    },
    data: { stoppedAt: new Date() },
  });

  revalidatePath("/");
}

export async function startMeasurementFromForm(
  formData: FormData,
): Promise<void> {
  await startMeasurement(idSchema.parse(formData.get("taskId")));
}

export async function stopMeasurementFromForm(
  formData: FormData,
): Promise<void> {
  await stopMeasurement(idSchema.parse(formData.get("measurementId")));
}
