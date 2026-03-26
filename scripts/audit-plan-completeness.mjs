import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(entryPath));
      continue;
    }

    files.push(entryPath);
  }

  return files;
}

function toRepoRelative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}

function countWhere(files, predicate) {
  return files.filter(predicate).length;
}

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

const webAppFiles = walk(path.join(repoRoot, "apps/web/app")).map(toRepoRelative);
const webComponentFiles = walk(path.join(repoRoot, "apps/web/components")).map(
  toRepoRelative,
);
const webScreenFiles = walk(path.join(repoRoot, "apps/web/components/screens")).map(
  toRepoRelative,
);
const mobileRouteFiles = walk(path.join(repoRoot, "apps/mobile/app")).map(
  toRepoRelative,
);
const mobileScreenFiles = walk(path.join(repoRoot, "apps/mobile/src/screens")).map(
  toRepoRelative,
);
const webFiles = walk(path.join(repoRoot, "apps/web")).map(toRepoRelative);
const e2eWebFiles = walk(path.join(repoRoot, "tests/e2e/web")).map(toRepoRelative);
const e2eApiFiles = walk(path.join(repoRoot, "tests/e2e/api")).map(toRepoRelative);
const e2eRuntimeFiles = walk(path.join(repoRoot, "tests/e2e/runtimes")).map(
  toRepoRelative,
);
const maestroFiles = walk(path.join(repoRoot, "apps/mobile/.maestro")).map(
  toRepoRelative,
);

const webPages = webAppFiles.filter((filePath) => filePath.endsWith("/page.tsx"));
const webLayouts = webAppFiles.filter((filePath) => filePath.endsWith("/layout.tsx"));
const canonicalWebScreens = webScreenFiles.filter((filePath) =>
  filePath.endsWith(".screen.tsx"),
);
const trackedWebComponents = webComponentFiles.filter((filePath) => {
  if (!filePath.endsWith(".tsx")) {
    return false;
  }

  if (
    filePath.endsWith(".stories.tsx") ||
    filePath.endsWith(".fixture.tsx") ||
    filePath.endsWith("/index.tsx") ||
    filePath.includes("/storybook/")
  ) {
    return false;
  }

  return true;
});
const webStories = webFiles.filter(
  (filePath) =>
    filePath.endsWith(".stories.tsx") || filePath.endsWith(".stories.ts"),
);
const trackedWebComponentsMissingStories = trackedWebComponents.filter(
  (componentFile) => {
    const expectedStoryFile = componentFile.endsWith(".screen.tsx")
      ? componentFile.replace(/\.screen\.tsx$/, ".screen.stories.tsx")
      : componentFile.replace(/\.tsx$/, ".stories.tsx");

    return !webComponentFiles.includes(expectedStoryFile);
  },
);
const trackedWebComponentsCoveredByStories =
  trackedWebComponents.length - trackedWebComponentsMissingStories.length;
const mobileRoutes = mobileRouteFiles.filter(
  (filePath) => filePath.endsWith(".tsx") && !filePath.endsWith("/_layout.tsx"),
);
const nativeMobileScreens = mobileScreenFiles.filter((filePath) =>
  filePath.endsWith(".tsx"),
);
const e2eWebSpecs = e2eWebFiles.filter((filePath) => filePath.endsWith(".spec.ts"));
const e2eApiSpecs = e2eApiFiles.filter((filePath) => filePath.endsWith(".spec.ts"));
const e2eRuntimeSpecs = e2eRuntimeFiles.filter((filePath) =>
  filePath.endsWith(".spec.ts"),
);
const maestroFlows = maestroFiles.filter((filePath) => filePath.endsWith(".yaml"));

const studentSurfaceCandidates = webAppFiles
  .filter(
    (filePath) =>
      filePath.includes("apps/web/app/student/_") &&
      filePath.endsWith(".tsx") &&
      !filePath.includes("/components/"),
  )
  .sort();

const studentCanonicalScreenNames = new Set(
  canonicalWebScreens
    .filter((filePath) => filePath.includes("components/screens/student/"))
    .map((filePath) =>
      path
        .basename(filePath, ".screen.tsx")
        .replace(/^student-/, "")
        .replace(/-/g, " "),
    ),
);

const legacyStudentHotspots = studentSurfaceCandidates.filter((relativePath) => {
  const normalized = path.basename(relativePath, ".tsx").replace(/-/g, " ");
  const sanitized = normalized.replace(/page|view|content/g, "").trim();

  return ![...studentCanonicalScreenNames].some(
    (screenName) =>
      sanitized.includes(screenName) || screenName.includes(sanitized),
  );
});

const uiArchitectureProgress = clamp(
  (canonicalWebScreens.length / Math.max(webPages.length, 1)) * 0.75 +
    (nativeMobileScreens.length / Math.max(mobileRoutes.length, 1)) * 0.25,
);
const storybookProgress = clamp(
  trackedWebComponentsCoveredByStories / Math.max(trackedWebComponents.length, 1),
);
const e2eProgress = clamp(
  (e2eWebSpecs.length + e2eApiSpecs.length + e2eRuntimeSpecs.length + maestroFlows.length) /
    Math.max(webPages.length + mobileRoutes.length, 1),
);
const overallProgress = clamp(
  uiArchitectureProgress * 0.5 + storybookProgress * 0.2 + e2eProgress * 0.3,
);

function asPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function phaseStatus(progressValue) {
  if (progressValue >= 0.95) {
    return "near-complete";
  }

  if (progressValue >= 0.5) {
    return "in-progress";
  }

  return "early";
}

console.log("Monorepo Plan Audit");
console.log("===================");
console.log(`Web pages: ${webPages.length}`);
console.log(`Web layouts: ${webLayouts.length}`);
console.log(`Canonical web screens (.screen.tsx): ${canonicalWebScreens.length}`);
console.log(`Tracked web components: ${trackedWebComponents.length}`);
console.log(
  `Tracked web components with colocated stories: ${trackedWebComponentsCoveredByStories}`,
);
console.log(`Web stories: ${webStories.length}`);
console.log(`Mobile routes: ${mobileRoutes.length}`);
console.log(`Native mobile screens: ${nativeMobileScreens.length}`);
console.log(`E2E web spec files: ${e2eWebSpecs.length}`);
console.log(`E2E api spec files: ${e2eApiSpecs.length}`);
console.log(`E2E runtime spec files: ${e2eRuntimeSpecs.length}`);
console.log(`Maestro flows: ${maestroFlows.length}`);
console.log("");
console.log("Heuristic progress");
console.log("------------------");
console.log(
  `Phase 1 UI refactor: ${phaseStatus(uiArchitectureProgress)} (${asPercent(uiArchitectureProgress)})`,
);
console.log(
  `Phase 2 Storybook: ${phaseStatus(storybookProgress)} (${asPercent(storybookProgress)})`,
);
console.log(
  `Phase 3 E2E mesh: ${phaseStatus(e2eProgress)} (${asPercent(e2eProgress)})`,
);
console.log(
  `Overall heuristic estimate: ${phaseStatus(overallProgress)} (${asPercent(overallProgress)})`,
);
console.log("");
console.log("Likely remaining student legacy hotspots");
console.log("---------------------------------------");

if (legacyStudentHotspots.length === 0) {
  console.log("None detected by heuristic.");
} else {
  for (const hotspot of legacyStudentHotspots) {
    console.log(`- ${hotspot}`);
  }
}
