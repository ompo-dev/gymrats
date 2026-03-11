const { spawn } = require("node:child_process");
const path = require("node:path");

const port = process.env.PORT || "3000";
const hostname = process.env.HOST || "0.0.0.0";
const nextBin = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

const child = spawn(
  process.execPath,
  [nextBin, "start", "-p", String(port), "-H", String(hostname)],
  {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    env: process.env,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
