import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const rootDir = process.cwd();
const webDir = join(rootDir, "apps", "web");

const includedRoots = [
  join(webDir, "app"),
  join(webDir, "components"),
  join(webDir, "hooks"),
  join(webDir, "lib"),
  join(webDir, "stores"),
];

const ignoredPathParts = [
  `${join("apps", "web", ".next")}`,
  `${join("apps", "web", "app", "api")}`,
  `${join("apps", "web", "components", "storybook")}`,
  `${join("apps", "web", "server")}`,
  `${join("node_modules")}`,
];

const forbiddenImports = [
  "@gymrats/db",
  "@prisma/client",
  "@gymrats/workflows",
  "@gymrats/cache",
  "@tanstack/react-query",
  "bullmq",
  "@/components/providers/query-provider",
  "@/lib/db",
  "@/lib/queue",
  "@/lib/api/client",
  "@/lib/api/server",
  "@/lib/services/",
  "@/server/",
];

const forbiddenPatterns = [
  { label: "HydrationBoundary", regex: /\bHydrationBoundary\b/ },
  { label: "dehydrate(", regex: /\bdehydrate\s*\(/ },
  { label: "QueryClient", regex: /\bQueryClient\b/ },
  { label: "useQuery(", regex: /\buseQuery\s*\(/ },
  { label: "useMutation(", regex: /\buseMutation\s*\(/ },
  { label: "useQueryClient(", regex: /\buseQueryClient\s*\(/ },
  { label: "invalidateQueries(", regex: /\binvalidateQueries\s*\(/ },
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

function isClientAppFile(normalizedPath, source) {
  if (!normalizedPath.includes(`${join("apps", "web", "app")}`)) {
    return true;
  }

  return (
    source.includes('"use client"') ||
    source.includes("'use client'")
  );
}

function isExplicitClientSource(source) {
  return source.includes('"use client"') || source.includes("'use client'");
}

function shouldIgnore(filePath, source) {
  const normalized = relative(rootDir, filePath);
  const posixNormalized = normalized.replaceAll("\\", "/");
  const explicitClient = isExplicitClientSource(source);

  if (ignoredPathParts.some((part) => normalized.includes(part))) {
    return true;
  }

  if (
    posixNormalized.includes("/lib/actions/") ||
    posixNormalized.includes("apps/web/lib/actions/") ||
    posixNormalized.includes("/lib/readers/") ||
    posixNormalized.includes("apps/web/lib/readers/") ||
    posixNormalized.includes("/lib/query/bootstrap-runtime") ||
    posixNormalized.includes("apps/web/lib/query/bootstrap-runtime") ||
    posixNormalized.includes("/storybook/")
  ) {
    return true;
  }

  if (
    posixNormalized.includes("apps/web/lib/") &&
    !explicitClient &&
    !posixNormalized.endsWith("/client.ts")
  ) {
    return true;
  }

  if (source.includes('"use server"') || source.includes("'use server'")) {
    return true;
  }

  if (source.includes('import "server-only"') || source.includes("import 'server-only'")) {
    return true;
  }

  if (
    normalized.endsWith(".test.ts") ||
    normalized.endsWith(".test.tsx") ||
    normalized.endsWith(".spec.ts") ||
    normalized.endsWith(".spec.tsx") ||
    normalized.endsWith(".stories.ts") ||
    normalized.endsWith(".stories.tsx")
  ) {
    return true;
  }

  if (normalized.endsWith("route.ts") || normalized.endsWith("route.tsx")) {
    return true;
  }

  if (!isClientAppFile(normalized, source)) {
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
      const hit = forbiddenImports.find((token) => {
        if (token === "@/lib/api/client") {
          return /["']@\/lib\/api\/client["']/.test(line);
        }

        if (token === "@/lib/api/server") {
          return /["']@\/lib\/api\/server["']/.test(line);
        }

        if (token === "@/components/providers/query-provider") {
          return /["']@\/components\/providers\/query-provider["']/.test(line);
        }

        return line.includes(token);
      });

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

    forbiddenPatterns.forEach(({ label, regex }) => {
      source.split(/\r?\n/).forEach((line, index) => {
        if (!regex.test(line)) {
          return;
        }

        violations.push({
          file: relative(rootDir, filePath),
          line: index + 1,
          token: label,
          source: line.trim(),
        });
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
