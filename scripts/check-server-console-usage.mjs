import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const ROOT = process.cwd();
const TARGET_DIRECTORIES = [
  "apps/api/src",
  "apps/bridge/src",
  "apps/cron/src",
  "apps/worker/src",
  "apps/web/cache-handlers",
  "packages",
];
const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs"]);
const CONSOLE_PATTERN = /\bconsole\.(log|warn|error|info|debug)\b/;

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }

    if ([...FILE_EXTENSIONS].some((extension) => fullPath.endsWith(extension))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const findings = [];

  for (const target of TARGET_DIRECTORIES) {
    const absoluteTarget = resolve(ROOT, target);
    const info = await stat(absoluteTarget).catch(() => null);
    if (!info?.isDirectory()) {
      continue;
    }

    const files = await collectFiles(absoluteTarget);

    for (const file of files) {
      const content = await readFile(file, "utf8");
      const lines = content.split(/\r?\n/);

      for (const [index, line] of lines.entries()) {
        if (!CONSOLE_PATTERN.test(line)) {
          continue;
        }

        findings.push(`${relative(ROOT, file)}:${index + 1}:${line.trim()}`);
      }
    }
  }

  if (findings.length > 0) {
    console.error("Server/runtime files still use console.* directly:");
    for (const finding of findings) {
      console.error(finding);
    }
    process.exitCode = 1;
    return;
  }

  console.log("No direct console.* usage found in server/runtime scopes.");
}

await main();
