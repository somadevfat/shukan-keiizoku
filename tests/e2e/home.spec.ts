import { expect, test } from "@playwright/test";

/* 各テスト終了後にローカルユーザーのタスクデータを削除してDBをクリーンな状態に戻す */
test.afterEach(async ({ request }) => {
  await request.delete("/api/e2e/cleanup");
});

test("タスクを作成して表示する", async ({ page }, testInfo) => {
  const taskName = `E2Eタスク-${testInfo.project.name}-${Date.now()}`;

  await page.goto("/");
  await page.getByLabel("新しいタスク").fill(taskName);
  await page.getByRole("button", { name: "追加" }).click();

  /* 作成したタスクのリストアイテムを特定する */
  const task = page.getByRole("listitem").filter({ hasText: taskName });

  await expect(task.getByText(taskName, { exact: true })).toBeVisible();

  /* 該当するタスクカードの中にのみ「計測を始める」ボタンが存在することを確認する */
  await expect(
    task.getByRole("button", { name: "計測を始める" }),
  ).toBeVisible();
});

test("タスク名を編集して削除する", async ({ page }, testInfo) => {
  const taskName = `編集前-${testInfo.project.name}-${Date.now()}`;
  const updatedName = `編集後-${testInfo.project.name}-${Date.now()}`;

  await page.goto("/");
  await page.getByLabel("新しいタスク").fill(taskName);
  await page.getByRole("button", { name: "追加" }).click();
  const task = page.getByRole("listitem").filter({ hasText: taskName });

  await task.getByText("編集・削除").click();
  await task.getByLabel("タスク名").fill(updatedName);
  await task.getByRole("button", { name: "名前を変更" }).click();

  const updatedTask = page
    .getByRole("listitem")
    .filter({ hasText: updatedName });
  await expect(
    updatedTask.getByText(updatedName, { exact: true }),
  ).toBeVisible();

  await updatedTask.getByText("編集・削除").click();
  await updatedTask.getByText("削除", { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "タスクを削除しますか？" });
  await expect(dialog).toContainText(updatedName);
  await dialog.getByRole("button", { name: "削除する" }).click();

  await expect(page.getByText(updatedName, { exact: true })).toHaveCount(0);
});

test("タスク削除の確認をキャンセルできる", async ({ page }, testInfo) => {
  const taskName = `削除キャンセル-${testInfo.project.name}-${Date.now()}`;

  await page.goto("/");
  await page.getByLabel("新しいタスク").fill(taskName);
  await page.getByRole("button", { name: "追加" }).click();
  const task = page.getByRole("listitem").filter({ hasText: taskName });

  await task.getByText("編集・削除").click();
  await task.getByText("削除", { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "タスクを削除しますか？" });
  await dialog.getByText("キャンセル", { exact: true }).click();

  await expect(dialog).toHaveCount(0);
  await expect(task.getByText(taskName, { exact: true })).toBeVisible();
});
