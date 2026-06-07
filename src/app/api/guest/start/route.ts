import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  createGuestIdentity,
  findGuestUser,
  GUEST_COOKIE_NAME,
} from "@/server/guest-identity";

function getHomeUrl(request: Request): URL {
  const appBaseUrl = process.env.NEXTAUTH_URL;

  if (appBaseUrl !== undefined) {
    return new URL("/", appBaseUrl);
  }

  return new URL("/", request.url);
}

export async function GET(request: Request): Promise<NextResponse> {
  const currentToken = (await cookies()).get(GUEST_COOKIE_NAME)?.value;
  const currentGuest =
    currentToken === undefined ? null : await findGuestUser(currentToken);
  const response = NextResponse.redirect(getHomeUrl(request));

  if (currentGuest !== null) {
    return response;
  }

  const { token } = await createGuestIdentity();

  response.cookies.set(GUEST_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
