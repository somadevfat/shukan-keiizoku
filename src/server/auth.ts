import "server-only";

import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/server/db";

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
};
