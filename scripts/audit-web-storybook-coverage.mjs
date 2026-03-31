import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const componentsRoot = path.join(repoRoot, "apps/web/components");

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

const allFiles = walk(componentsRoot).map(toRepoRelative);
const componentFiles = allFiles.filter((filePath) => {
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

const missingStoryFiles = componentFiles.filter((componentFile) => {
  const expectedStoryFile = componentFile.endsWith(".screen.tsx")
    ? componentFile.replace(/\.screen\.tsx$/, ".screen.stories.tsx")
    : componentFile.replace(/\.tsx$/, ".stories.tsx");

  return !allFiles.includes(expectedStoryFile);
});

const coveredCount = componentFiles.length - missingStoryFiles.length;
const coverageRatio =
  componentFiles.length === 0 ? 1 : coveredCount / componentFiles.length;

console.log("Web Storybook Coverage Audit");
console.log("============================");
console.log(`Tracked components: ${componentFiles.length}`);
console.log(`Covered by colocated stories: ${coveredCount}`);
console.log(`Missing stories: ${missingStoryFiles.length}`);
console.log(`Coverage: ${Math.round(coverageRatio * 100)}%`);
console.log("");

if (missingStoryFiles.length > 0) {
  console.log("Missing component stories");
  console.log("------------------------");

  for (const filePath of missingStoryFiles) {
    console.log(`- ${filePath}`);
  }
}

if (process.argv.includes("--fail-on-missing") && missingStoryFiles.length > 0) {
  process.exitCode = 1;
}

