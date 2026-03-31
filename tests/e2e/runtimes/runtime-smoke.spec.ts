import { spawn } from "node:child_process";
import { expect, test } from "@playwright/test";

const workspaceRoot =
  process.env.PLAYWRIGHT_WORKSPACE_ROOT ||
  "C:\\Projects\\Teste\\GymRats-Complete\\gymrats";

function runBunProcess(params: {
  scriptPath: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
}) {
  return new Promise<{
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    output: string;
    timedOut: boolean;
  }>((resolve) => {
    const child = spawn("bun", ["--bun", params.scriptPath], {
      cwd: workspaceRoot,
      env: {
        ...process.env,
        NODE_ENV: "test",
        ...params.env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, params.timeoutMs ?? 10_000);

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });

    child.on("exit", (exitCode, signal) => {
      clearTimeout(timeout);
      resolve({
        exitCode,
        signal,
        output,
        timedOut,
      });
    });
  });
}

test("worker reports startup failure when redis is unavailable", async () => {
  const result = await runBunProcess({
    scriptPath: "apps/worker/src/index.ts",
    env: {
      GYMRATS_RUNTIME_ROLE: "worker",
      REDIS_URL: "redis://127.0.0.1:1",
    },
  });

  expect(result.timedOut).toBeFalsy();
  expect(result.exitCode).not.toBe(0);
  expect(result.output).toContain("ECONNREFUSED 127.0.0.1:1");
  expect(result.output).toContain("[worker] startup failed");
});

test("cron reports database failure against an unreachable database", async () => {
  const result = await runBunProcess({
    scriptPath: "apps/cron/src/index.ts",
    env: {
      GYMRATS_RUNTIME_ROLE: "cron",
      DATABASE_URL: "postgresql://invalid:invalid@127.0.0.1:1/invalid",
    },
  });

  expect(result.timedOut).toBeFalsy();
  expect(result.exitCode).not.toBe(0);
  expect(result.output).toContain("[cron] week-reset failed");
  expect(result.output).toContain("Can't reach database server at `127.0.0.1:1`");
});
