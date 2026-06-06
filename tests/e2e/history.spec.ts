import { expect, test } from "@playwright/test";

/* 各テスト終了後にローカルユーザーのタスクデータを削除してDBをクリーンな状態に戻す */
test.afterEach(async ({ request }) => {
  await request.delete("/api/e2e/cleanup");
});

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
  await expect(page.getByText("月間カレンダー")).toBeVisible();
  await expect(page.getByLabel("活動量の凡例")).toBeVisible();
  await expect(page.getByText("少ない")).toBeVisible();
  await expect(page.getByText("多い")).toBeVisible();
  await expect(page.getByRole("link", { name: "前月" })).toBeVisible();
  await expect(page.getByRole("link", { name: "次月" })).toBeVisible();

  /* 戻るリンクをクリックしてメイン画面に戻る */
  await page.getByRole("link", { name: "戻る" }).click();

  /* 戻り先のURLがトップ画面（/）であることを検証する */
  await expect(page).toHaveURL(/\/$/);
});

test("計測した日の活動量がカレンダーの色に反映される", async ({
  page,
}, testInfo) => {
  const taskName = `履歴色分け-${testInfo.project.name}-${Date.now()}`;
  const todayLabel = new Intl.DateTimeFormat("ja-JP", {
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date());

  await page.goto("/");
  await page.getByLabel("新しいタスク").fill(taskName);
  await page.getByRole("button", { name: "追加" }).click();

  const task = page.getByRole("listitem").filter({ hasText: taskName });
  await task.getByRole("button", { name: "計測を始める" }).click();
  await page.waitForTimeout(1_100);
  await task.getByRole("button", { name: "計測を止める" }).click();

  await page.getByRole("link", { name: "履歴" }).click();

  const todayCell = page.getByLabel(new RegExp(`^${todayLabel}、[1-9]\\d*秒$`));
  await expect(todayCell).toBeVisible();
  await expect(todayCell).toHaveClass(/activityLevel1/);
  await expect(page.getByText(taskName, { exact: true })).toBeVisible();
});

test("カレンダーの表示月を切り替えられる", async ({ page }) => {
  const currentMonth = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Tokyo",
  }).format(new Date());

  await page.goto("/history");
  await expect(page.getByRole("heading", { name: currentMonth })).toBeVisible();
  await page.getByRole("link", { name: "前月" }).click();

  await expect(page).toHaveURL(/month=\d{4}-\d{2}/);
  await expect(
    page.getByRole("heading", { name: currentMonth }),
  ).not.toBeVisible();
});

test("メイン画面で継続失敗対策メモを追加して一覧から編集できる", async ({
  page,
}) => {
  const obstacle = `予定を詰めすぎた-${Date.now()}`;
  const nextAction = `開始時間を先に確保する-${Date.now()}`;
  const updatedAction = `予定を一つ減らす-${Date.now()}`;

  await page.goto("/");
  await expect(page.getByLabel("つまずいたこと")).toHaveCount(0);
  await page.getByRole("link", { name: "メモを追加" }).click();
  await expect(page.getByRole("heading", { name: "メモを追加" })).toBeVisible();
  await page.getByLabel("つまずいたこと").fill(obstacle);
  await page.getByLabel("次回の対策").fill(nextAction);
  await page.getByRole("button", { name: "メモを保存" }).click();

  await expect(page.getByRole("status")).toHaveText("メモを保存しました");
  await expect(page).toHaveURL(/\?memoStatus=saved$/);
  const savedMemo = page.getByRole("link").filter({ hasText: obstacle });
  await expect(savedMemo).toBeVisible();
  await expect(savedMemo).toContainText(nextAction);

  await savedMemo.click();
  const editorHeading = page.getByRole("heading", { name: "メモを編集" });
  await expect(editorHeading).toBeVisible();
  const memoTop = await savedMemo.evaluate(
    (element) => element.getBoundingClientRect().top,
  );
  const editorTop = await editorHeading.evaluate(
    (element) => element.getBoundingClientRect().top,
  );
  expect(memoTop).toBeLessThan(editorTop);
  await page.getByLabel("次回の対策").fill(updatedAction);
  await page.getByRole("button", { name: "メモを保存" }).click();

  await expect(page.getByText(obstacle, { exact: true })).toBeVisible();
  await expect(page.getByText(updatedAction, { exact: true })).toBeVisible();
});
