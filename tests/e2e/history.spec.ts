import { expect, test } from "@playwright/test";

test("履歴ページへの遷移と戻るボタンの動作確認", async ({ page }) => {
  /* メイン画面にアクセスする */
  await page.goto("/");

  /* ヘッダー内にある「履歴」リンクをクリックして履歴画面に遷移する */
  await page.getByRole("link", { name: "履歴" }).click();

  /* 遷移先のURLが /history であることを検証する */
  await expect(page).toHaveURL(/\/history$/);

  /* 画面に必要な要素（ストリーク数、カレンダー）が正しく描画されていることを確認する */
  await expect(page.getByText("現在の継続日数")).toBeVisible();
  await expect(page.getByText("最長継続日数")).toBeVisible();
  await expect(page.getByText("過去3ヶ月のカレンダー")).toBeVisible();

  /* 戻るリンクをクリックしてメイン画面に戻る */
  await page.getByRole("link", { name: "戻る" }).click();

  /* 戻り先のURLがトップ画面（/）であることを検証する */
  await expect(page).toHaveURL(/\/$/);
});
