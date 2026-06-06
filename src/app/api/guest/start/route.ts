import { NextResponse } from "next/server";

import {
  createGuestIdentity,
  GUEST_COOKIE_NAME,
} from "@/server/guest-identity";

export async function GET(request: Request): Promise<NextResponse> {
  const { token } = await createGuestIdentity();
  const response = NextResponse.redirect(new URL("/", request.url));

  response.cookies.set(GUEST_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
