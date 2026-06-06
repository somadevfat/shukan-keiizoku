import { expect, test } from "@playwright/test";

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
