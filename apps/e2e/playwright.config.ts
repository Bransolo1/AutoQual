import { defineConfig } from "@playwright/test";

const webBaseUrl = process.env.WEB_BASE_URL ?? "http://localhost:3000";
const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  expect: { timeout: 10000 },
  retries: 1,
  use: {
    baseURL: webBaseUrl,
    actionTimeout: 15000,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
  metadata: {
    webBaseUrl,
    apiBaseUrl,
  },
});
