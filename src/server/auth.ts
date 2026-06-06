import "server-only";

import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies } from "next/headers";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/server/db";
import {
  GUEST_COOKIE_NAME,
  mergeGuestDataIntoUser,
} from "@/server/guest-identity";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  ...(process.env.AUTH_SECRET === undefined
    ? {}
    : { secret: process.env.AUTH_SECRET }),
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn({ user }) {
      const guestToken = (await cookies()).get(GUEST_COOKIE_NAME)?.value;

      if (guestToken !== undefined) {
        await mergeGuestDataIntoUser(guestToken, user.id);
      }

      return true;
    },
  },
};
