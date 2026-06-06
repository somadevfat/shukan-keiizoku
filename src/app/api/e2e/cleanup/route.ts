import { NextResponse } from "next/server";

import { db } from "@/server/db";
import { ensureLocalUser } from "@/server/local-dashboard";

/**
 * E2Eテスト専用のクリーンアップエンドポイントです（開発環境のみ有効）。
 * @responsibility: テスト実行後に作成されたゴミデータ（ローカルユーザーの全タスク）を削除し、DBをクリーンな状態に戻す。
 */
export async function DELETE(): Promise<NextResponse> {
  /* 本番環境では絶対に動作させないために環境チェックを最初に行う */
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "このエンドポイントは本番環境では利用できません。" },
      { status: 403 },
    );
  }

  const user = await ensureLocalUser();

  /* ローカルユーザーに紐づく全タスクをカスケード削除する（関連する計測セッション・目標も削除される） */
  await db.habitTask.deleteMany({
    where: { userId: user.id },
  });
  await db.continuityReflection.deleteMany({
    where: { userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
