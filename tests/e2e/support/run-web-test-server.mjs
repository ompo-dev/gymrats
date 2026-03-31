import { spawn } from "node:child_process";

const apiBaseUrl =
  process.env.PLAYWRIGHT_API_BASE_URL || "http://127.0.0.1:3001";

const command =
  process.platform === "win32"
    ? [
        "cmd.exe",
        [
          "/c",
          "npm",
          "--prefix",
          "apps/web",
          "run",
          "dev:next",
          "--",
          "--hostname",
          "127.0.0.1",
          "--port",
          process.env.PLAYWRIGHT_WEB_PORT || "3000",
        ],
      ]
    : [
        "npm",
        [
          "--prefix",
          "apps/web",
          "run",
          "dev:next",
          "--",
          "--hostname",
          "127.0.0.1",
          "--port",
          process.env.PLAYWRIGHT_WEB_PORT || "3000",
        ],
      ];

const child = spawn(command[0], command[1], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "development",
    NEXT_PUBLIC_API_URL: apiBaseUrl,
    API_INTERNAL_URL: apiBaseUrl,
    BETTER_AUTH_URL: apiBaseUrl,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
