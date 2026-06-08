import { expect, test } from "@playwright/test";

test("ログイン画面にGoogleログイン操作を表示する", async ({ page }) => {
  await page.goto("/signin");

  await expect(
    page.getByRole("heading", { name: "今日の積み上げを始める" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Googleでログイン" }),
  ).toBeVisible();
});

test("Auth.jsにGoogleプロバイダーを設定する", async ({ request }) => {
  const response = await request.get("/api/auth/providers");

  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain('"id":"google"');
});

test("ログアウト後にホームへ戻る", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "ログアウト" }).click();

  await expect(page).toHaveURL(/\/$/);
});

test("Cookieがない利用者をゲストとして開始しデータを保持する", async ({
  browser,
}) => {
  const context = await browser.newContext({ extraHTTPHeaders: {} });
  const page = await context.newPage();
  const taskName = `ゲストタスク-${Date.now()}`;

  await page.goto("http://127.0.0.1:3000/");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "ログイン" })).toBeVisible();
  const guestCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "syukan_guest_token",
  );
  expect(guestCookie?.httpOnly).toBe(true);
  expect(guestCookie?.sameSite).toBe("Lax");

  await page.getByLabel("新しいタスク").fill(taskName);
  await page.getByRole("button", { name: "追加" }).click();
  await page.reload();

  const task = page.getByRole("listitem").filter({ hasText: taskName });

  await expect(task.first()).toContainText(taskName);
  await context.request.delete("http://127.0.0.1:3000/api/e2e/cleanup");
  await context.close();
});
