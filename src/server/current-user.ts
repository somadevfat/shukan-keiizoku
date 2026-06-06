import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth";
import { db } from "@/server/db";

const LOCAL_USER_EMAIL = "local@example.invalid";
const DEFAULT_TIME_ZONE = "Asia/Tokyo";

async function ensureLocalUser() {
  return db.user.upsert({
    where: { email: LOCAL_USER_EMAIL },
    update: {},
    create: {
      email: LOCAL_USER_EMAIL,
      name: "ローカル利用者",
      timeZone: DEFAULT_TIME_ZONE,
    },
  });
}

export async function requireCurrentUser() {
  const localUserBypassEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.AUTH_BYPASS_LOCAL_USER === "true";
  const bypassRequiresHeader =
    process.env.AUTH_BYPASS_REQUIRE_HEADER === "true";
  const hasBypassHeader = (await headers()).get("x-e2e-local-user") === "true";

  if (localUserBypassEnabled && (!bypassRequiresHeader || hasBypassHeader)) {
    return ensureLocalUser();
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (email === null || email === undefined) {
    redirect("/signin");
  }

  return db.user.findUniqueOrThrow({ where: { email } });
}
