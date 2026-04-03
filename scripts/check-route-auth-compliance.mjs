import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const routesRoot = path.join(repoRoot, "apps", "api", "src", "routes");

const SOURCE_FILE = "route.ts";

const explicitRouteClassifications = new Map([
  ["/api/auth/[...all]", "public"],
  ["/api/auth/exchange-one-time-token", "public"],
  ["/api/auth/google/bridge", "public"],
  ["/api/auth/google/start", "public"],
  ["/api/auth/session", "auth"],
  ["/api/auth/sign-in", "public"],
  ["/api/auth/sign-out", "auth"],
  ["/api/auth/sign-up", "public"],
  ["/api/auth/verify-reset-code", "public"],
  ["/api/webhooks/abacatepay", "internal-only"],
]);

const authMatchers = [
  { pattern: /auth:\s*"admin"/, classification: "admin" },
  { pattern: /auth:\s*"gym"/, classification: "gym" },
  { pattern: /auth:\s*"personal"/, classification: "personal" },
  { pattern: /auth:\s*"student"/, classification: "student" },
  { pattern: /auth:\s*"none"/, classification: "public" },
  { pattern: /requireAdmin\(/, classification: "admin" },
  { pattern: /requireGym\(/, classification: "gym" },
  { pattern: /requirePersonal\(/, classification: "personal" },
  { pattern: /requireStudent\(/, classification: "student" },
  { pattern: /requireAuth\(/, classification: "auth" },
];

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name === SOURCE_FILE) {
      files.push(entryPath);
    }
  }

  return files;
}

function toApiRoute(filePath) {
  const routePath = path.relative(routesRoot, filePath).replaceAll("\\", "/");
  const normalized = routePath.replace(/\/route\.ts$/, "").replace(/\/index$/, "");
  return `/api/${normalized}`;
}

function classifyRoute(routePath, source) {
  const explicit = explicitRouteClassifications.get(routePath);
  if (explicit) {
    return explicit;
  }

  if (routePath.startsWith("/api/cron/")) {
    return "internal-only";
  }

  for (const matcher of authMatchers) {
    if (matcher.pattern.test(source)) {
      return matcher.classification;
    }
  }

  if (routePath.startsWith("/api/integrations/")) {
    return "internal-only";
  }

  if (routePath === "/api/swagger") {
    return "public";
  }

  if (routePath === "/api/exercises/search") {
    return "public";
  }

  if (routePath.startsWith("/api/foods/")) {
    return "public";
  }

  if (routePath.startsWith("/api/mobile/installations/")) {
    return "auth";
  }

  if (routePath === "/api/mobile/notifications/test") {
    return "auth";
  }

  if (routePath.startsWith("/api/gym/")) {
    return "gym";
  }

  if (routePath.startsWith("/api/gyms/")) {
    return "gym";
  }

  if (routePath.startsWith("/api/personals/")) {
    return "personal";
  }

  if (routePath.startsWith("/api/students/")) {
    return "student";
  }

  if (routePath.startsWith("/api/nutrition/")) {
    return "student";
  }

  if (routePath.startsWith("/api/workouts/")) {
    return "student";
  }

  if (routePath.startsWith("/api/subscriptions/")) {
    return "student";
  }

  if (routePath === "/api/memberships") {
    return "student";
  }

  if (routePath === "/api/payments") {
    return "student";
  }

  if (routePath.startsWith("/api/payment-methods")) {
    return "auth";
  }

  return null;
}

const routeFiles = walk(routesRoot).sort();
const inventory = [];
const failures = [];

for (const filePath of routeFiles) {
  const source = fs.readFileSync(filePath, "utf8");
  const routePath = toApiRoute(filePath);
  const classification = classifyRoute(routePath, source);
  const relativePath = path.relative(repoRoot, filePath).replaceAll("\\", "/");

  if (!classification) {
    failures.push({ routePath, file: relativePath });
    continue;
  }

  inventory.push({
    routePath,
    classification,
    file: relativePath,
  });
}

inventory.sort((left, right) => left.routePath.localeCompare(right.routePath));

console.log("Route auth inventory:");
for (const entry of inventory) {
  console.log(`${entry.classification.padEnd(13)} ${entry.routePath}`);
}

if (failures.length > 0) {
  console.error("\nRoutes missing explicit auth/public/internal classification:");
  for (const failure of failures) {
    console.error(`- ${failure.routePath} (${failure.file})`);
  }
  process.exit(1);
}

console.log(`\nValidated ${inventory.length} route files.`);
