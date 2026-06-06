import { expect, test } from "@playwright/test";

test("タスクを作成して表示する", async ({ page }, testInfo) => {
  const taskName = `E2Eタスク-${testInfo.project.name}-${Date.now()}`;

  await page.goto("/");
  await page.getByLabel("新しいタスク").fill(taskName);
  await page.getByRole("button", { name: "追加" }).click();

  await expect(
    page
      .getByRole("region", { name: "タスク一覧" })
      .getByText(taskName, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "計測を始める" }),
  ).toBeVisible();
});

test("任意のタスクを計測開始して停止する", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium");
  const taskName = `計測タスク-${Date.now()}`;

  await page.goto("/");
  await page.getByLabel("新しいタスク").fill(taskName);
  await page.getByRole("button", { name: "追加" }).click();
  const task = page.getByRole("listitem").filter({ hasText: taskName });

  await task.getByLabel("今日の目標（分）").fill("1");
  await task.getByRole("button", { name: "保存" }).click();
  await task.getByRole("button", { name: "このタスクを計測" }).click();
  await expect(
    page.getByRole("button", { name: "計測を止める" }),
  ).toBeVisible();
  await expect(page.getByText("目標 1分")).toBeVisible();
  await page.waitForTimeout(1_100);
  await page.getByRole("button", { name: "計測を止める" }).click();

  await expect(
    page.getByRole("button", { name: "計測を始める" }),
  ).toBeVisible();
  await expect(task.getByText(/今日 [1-9]\d*秒/)).toBeVisible();
});
