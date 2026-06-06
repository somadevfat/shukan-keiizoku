import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    extraHTTPHeaders: {
      "x-e2e-local-user": "true",
    },
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command:
      "AUTH_BYPASS_LOCAL_USER=true AUTH_BYPASS_REQUIRE_HEADER=true AUTH_SECRET=e2e-test-secret NEXTAUTH_URL=http://127.0.0.1:3000 npm run dev",
    reuseExistingServer: !process.env.CI,
    url: "http://127.0.0.1:3000",
  },
});
