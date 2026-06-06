import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";

import { db } from "@/server/db";

export const GUEST_COOKIE_NAME = "syukan_guest_token";

export function hashGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createGuestIdentity() {
  const token = randomBytes(32).toString("base64url");
  const user = await db.user.create({
    data: {
      email: `guest-${randomUUID()}@guest.invalid`,
      name: "ゲスト利用者",
      guestIdentity: {
        create: { tokenHash: hashGuestToken(token) },
      },
    },
  });

  return { token, user };
}

export async function findGuestUser(token: string) {
  const identity = await db.guestIdentity.findUnique({
    where: { tokenHash: hashGuestToken(token) },
    include: { user: true },
  });

  return identity?.user ?? null;
}

export async function mergeGuestDataIntoUser(
  token: string,
  targetUserId: string,
): Promise<void> {
  const guestUser = await findGuestUser(token);

  if (guestUser === null || guestUser.id === targetUserId) {
    return;
  }

  await db.$transaction(async (transaction) => {
    const targetActiveMeasurement =
      await transaction.measurementSession.findFirst({
        where: {
          userId: targetUserId,
          stoppedAt: null,
          deletedAt: null,
        },
      });

    if (targetActiveMeasurement !== null) {
      await transaction.measurementSession.updateMany({
        where: {
          userId: guestUser.id,
          stoppedAt: null,
          deletedAt: null,
        },
        data: { stoppedAt: new Date() },
      });
    }

    await transaction.habitTask.updateMany({
      where: { userId: guestUser.id },
      data: { userId: targetUserId },
    });
    await transaction.measurementSession.updateMany({
      where: { userId: guestUser.id },
      data: { userId: targetUserId },
    });
    await transaction.dailyGoal.updateMany({
      where: { userId: guestUser.id },
      data: { userId: targetUserId },
    });
    await transaction.continuityReflection.updateMany({
      where: { userId: guestUser.id },
      data: { userId: targetUserId },
    });
    await transaction.user.delete({ where: { id: guestUser.id } });
  });
}
