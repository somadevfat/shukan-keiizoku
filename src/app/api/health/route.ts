import { NextResponse } from "next/server";

import { db } from "@/server/db";

export async function GET(): Promise<NextResponse> {
  try {
    await db.user.findFirst({ select: { id: true } });

    return NextResponse.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { headers: { "Cache-Control": "no-store" }, status: 503 },
    );
  }
}
