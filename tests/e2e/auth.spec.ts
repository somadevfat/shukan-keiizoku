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

test("ローカル利用モードでもログアウト操作を表示する", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "ログアウト" })).toBeVisible();
});

test("未認証利用者をログイン画面へ移動する", async ({ browser }) => {
  const context = await browser.newContext({ extraHTTPHeaders: {} });
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:3000/");

  await expect(page).toHaveURL(/\/signin$/);
  await context.close();
});
