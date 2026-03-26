import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const apiBaseURL =
  process.env.PLAYWRIGHT_API_BASE_URL || "http://127.0.0.1:3001";
const shouldManageServers =
  !process.env.PLAYWRIGHT_BASE_URL && !process.env.PLAYWRIGHT_API_BASE_URL;
const cliArgs = process.argv.slice(2);
const isApiOnlyRun = cliArgs.some((arg) => arg.includes("tests/e2e/api"));
const isRuntimeOnlyRun = cliArgs.some((arg) =>
  arg.includes("tests/e2e/runtimes"),
);
const managedServers = shouldManageServers
  ? [
      ...(!isRuntimeOnlyRun
        ? [
            {
              command: "node tests/e2e/support/run-api-test-server.mjs",
              url: `${apiBaseURL}/healthz`,
              timeout: 180_000,
              reuseExistingServer: !process.env.CI,
            },
          ]
        : []),
      ...(!isApiOnlyRun && !isRuntimeOnlyRun
        ? [
            {
              command: "node tests/e2e/support/run-web-test-server.mjs",
              url: baseURL,
              timeout: 180_000,
              reuseExistingServer: !process.env.CI,
            },
          ]
        : []),
    ]
  : undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global.setup.ts",
  timeout: 45_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: managedServers,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
