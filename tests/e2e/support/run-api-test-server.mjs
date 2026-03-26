import { spawn } from "node:child_process";

const command =
  process.platform === "win32"
    ? ["cmd.exe", ["/c", "npm", "--prefix", "apps/api", "run", "start"]]
    : ["npm", ["--prefix", "apps/api", "run", "start"]];

const child = spawn(command[0], command[1], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || "test",
    PORT: process.env.PLAYWRIGHT_API_PORT || "3001",
    CRON_SECRET: process.env.CRON_SECRET || "gymrats-e2e-cron-secret",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
