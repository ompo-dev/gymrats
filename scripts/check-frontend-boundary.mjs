import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const rootDir = process.cwd();
const webDir = join(rootDir, "apps", "web");

const includedRoots = [
  join(webDir, "components"),
  join(webDir, "hooks"),
  join(webDir, "stores"),
  join(webDir, "app"),
];

const ignoredPathParts = [
  `${join("apps", "web", "app", "api")}`,
  `${join("apps", "web", "server")}`,
  `${join("apps", "web", ".next")}`,
  `${join("node_modules")}`,
];

const forbiddenImports = [
  "@gymrats/db",
  "@prisma/client",
  "@gymrats/workflows",
  "@gymrats/cache",
  "bullmq",
  "@/lib/db",
  "@/lib/queue",
  "@/lib/services/",
  "@/server/",
];

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (!/\.(ts|tsx)$/.test(entry.name)) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function shouldIgnore(filePath, source) {
  const normalized = relative(rootDir, filePath);

  if (ignoredPathParts.some((part) => normalized.includes(part))) {
    return true;
  }

  if (source.includes('"use server"') || source.includes("'use server'")) {
    return true;
  }

  if (normalized.endsWith(".test.ts") || normalized.endsWith(".test.tsx")) {
    return true;
  }

  if (normalized.endsWith(".spec.ts") || normalized.endsWith(".spec.tsx")) {
    return true;
  }

  if (normalized.endsWith("route.ts") || normalized.endsWith("route.tsx")) {
    return true;
  }

  if (/actions(\.[\w-]+)?\.ts$/.test(normalized.replaceAll("\\", "/"))) {
    return true;
  }

  const normalizedSource = source.toLowerCase();
  const isExplicitClient =
    normalizedSource.includes('"use client"') ||
    normalizedSource.includes("'use client'");

  if (
    normalized.includes(`${join("apps", "web", "app")}`) &&
    !isExplicitClient
  ) {
    return true;
  }

  return false;
}

const violations = [];

for (const scopeRoot of includedRoots) {
  if (!statSync(scopeRoot, { throwIfNoEntry: false })) {
    continue;
  }

  for (const filePath of walk(scopeRoot)) {
    const source = readFileSync(filePath, "utf8");

    if (shouldIgnore(filePath, source)) {
      continue;
    }

    const importLines = source.split(/\r?\n/);
    importLines.forEach((line, index) => {
      const hit = forbiddenImports.find((token) => line.includes(token));
      if (!hit) {
        return;
      }

      violations.push({
        file: relative(rootDir, filePath),
        line: index + 1,
        token: hit,
        source: line.trim(),
      });
    });
  }
}

if (violations.length > 0) {
  console.error("Frontend boundary violations found:\n");
  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line} imports ${violation.token}\n  ${violation.source}`,
    );
  }
  process.exit(1);
}

console.log("Frontend boundary check passed.");
