import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const repoRoot = process.cwd();
const webRoot = path.join(repoRoot, "apps/web");
const componentsRoot = path.join(webRoot, "components");

const SOURCE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
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
    files.push(entryPath);
  }

  return files;
}

function toRepoRelative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}

function normalizeAbsolute(filePath) {
  return path.normalize(filePath);
}

function isSourceFile(filePath) {
  return SOURCE_EXTENSIONS.some((extension) => filePath.endsWith(extension));
}

function isTrackedComponent(filePath) {
  const relativePath = toRepoRelative(filePath);

  if (!relativePath.startsWith("apps/web/components/")) {
    return false;
  }

  if (!relativePath.endsWith(".tsx")) {
    return false;
  }

  if (
    relativePath.endsWith(".stories.tsx") ||
    relativePath.endsWith(".fixture.tsx") ||
    relativePath.endsWith("/index.tsx") ||
    relativePath.includes("/storybook/")
  ) {
    return false;
  }

  return true;
}

function tryResolveFile(basePath) {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return normalizeAbsolute(basePath);
  }

  for (const extension of SOURCE_EXTENSIONS) {
    const withExtension = `${basePath}${extension}`;
    if (fs.existsSync(withExtension) && fs.statSync(withExtension).isFile()) {
      return normalizeAbsolute(withExtension);
    }
  }

  if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
    for (const extension of SOURCE_EXTENSIONS) {
      const indexPath = path.join(basePath, `index${extension}`);
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        return normalizeAbsolute(indexPath);
      }
    }
  }

  return null;
}

function resolveInternalImport(fromFile, specifier) {
  if (!specifier) {
    return null;
  }

  let targetBasePath = null;

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    targetBasePath = path.resolve(path.dirname(fromFile), specifier);
  } else if (specifier.startsWith("@/")) {
    targetBasePath = path.resolve(webRoot, specifier.slice(2));
  } else {
    return null;
  }

  return tryResolveFile(targetBasePath);
}

function collectDependencies(filePath) {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const dependencies = new Set();

  function addDependency(specifierText) {
    const resolved = resolveInternalImport(filePath, specifierText);
    if (resolved) {
      dependencies.add(resolved);
    }
  }

  function visit(node) {
    if (
      ts.isImportDeclaration(node) ||
      ts.isExportDeclaration(node) ||
      ts.isImportEqualsDeclaration(node)
    ) {
      const moduleSpecifier =
        "moduleSpecifier" in node ? node.moduleSpecifier : undefined;
      if (
        moduleSpecifier &&
        ts.isStringLiteralLike(moduleSpecifier) &&
        moduleSpecifier.text
      ) {
        addDependency(moduleSpecifier.text);
      }
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0
    ) {
      const [firstArgument] = node.arguments;
      if (ts.isStringLiteralLike(firstArgument)) {
        addDependency(firstArgument.text);
      }
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "require" &&
      node.arguments.length > 0
    ) {
      const [firstArgument] = node.arguments;
      if (ts.isStringLiteralLike(firstArgument)) {
        addDependency(firstArgument.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return [...dependencies];
}

function collectRootFiles() {
  const appFiles = walk(path.join(webRoot, "app")).filter(isSourceFile);
  const storybookFiles = [
    ...walk(path.join(webRoot, ".storybook")).filter(isSourceFile),
    ...walk(componentsRoot).filter((filePath) => filePath.endsWith(".stories.tsx")),
  ];
  const testFiles = [
    ...walk(path.join(repoRoot, "tests/e2e/web")).filter(isSourceFile),
    ...walk(path.join(repoRoot, "tests/e2e/support")).filter(isSourceFile),
  ];

  const runtimeRoots = appFiles.filter((filePath) => {
    const normalized = filePath.replaceAll("\\", "/");
    return /\/(page|layout|route|loading|error|not-found|default)\.(t|j)sx?$/.test(
      normalized,
    );
  });

  return {
    runtimeRoots: runtimeRoots.map(normalizeAbsolute),
    storybookRoots: storybookFiles.map(normalizeAbsolute),
    testRoots: testFiles.map(normalizeAbsolute),
  };
}

function traverseReachability(roots, dependencyGraph) {
  const visited = new Set();
  const queue = [...roots];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);
    const dependencies = dependencyGraph.get(current) ?? [];

    for (const dependency of dependencies) {
      if (!visited.has(dependency)) {
        queue.push(dependency);
      }
    }
  }

  return visited;
}

const allWebSourceFiles = [
  ...walk(webRoot).filter(isSourceFile),
  ...walk(path.join(repoRoot, "tests/e2e/web")).filter(isSourceFile),
  ...walk(path.join(repoRoot, "tests/e2e/support")).filter(isSourceFile),
].map(normalizeAbsolute);

const uniqueSourceFiles = [...new Set(allWebSourceFiles)];
const dependencyGraph = new Map();

for (const filePath of uniqueSourceFiles) {
  dependencyGraph.set(filePath, collectDependencies(filePath));
}

const reverseDependencyGraph = new Map();

for (const [sourceFile, dependencies] of dependencyGraph.entries()) {
  for (const dependency of dependencies) {
    const dependents = reverseDependencyGraph.get(dependency) ?? [];
    dependents.push(sourceFile);
    reverseDependencyGraph.set(dependency, dependents);
  }
}

const { runtimeRoots, storybookRoots, testRoots } = collectRootFiles();
const runtimeReachable = traverseReachability(runtimeRoots, dependencyGraph);
const storybookReachable = traverseReachability(storybookRoots, dependencyGraph);
const testReachable = traverseReachability(testRoots, dependencyGraph);

const trackedComponents = uniqueSourceFiles.filter(isTrackedComponent);

const runtimeUsed = [];
const storybookOnly = [];
const testOnly = [];
const fullyUnused = [];

for (const componentFile of trackedComponents) {
  const inRuntime = runtimeReachable.has(componentFile);
  const inStorybook = storybookReachable.has(componentFile);
  const inTests = testReachable.has(componentFile);

  if (inRuntime) {
    runtimeUsed.push(componentFile);
    continue;
  }

  if (inStorybook) {
    storybookOnly.push(componentFile);
    continue;
  }

  if (inTests) {
    testOnly.push(componentFile);
    continue;
  }

  fullyUnused.push(componentFile);
}

function printList(label, files) {
  console.log(label);
  console.log("-".repeat(label.length));
  if (files.length === 0) {
    console.log("None");
  } else {
    for (const filePath of files.sort()) {
      console.log(`- ${toRepoRelative(filePath)}`);
    }
  }
  console.log("");
}

console.log("Web Runtime Reachability Audit");
console.log("==============================");
console.log(`Tracked components: ${trackedComponents.length}`);
console.log(`Runtime reachable: ${runtimeUsed.length}`);
console.log(`Storybook-only: ${storybookOnly.length}`);
console.log(`Test-only: ${testOnly.length}`);
console.log(`Fully unused: ${fullyUnused.length}`);
console.log("");

printList("Fully unused components", fullyUnused);
printList("Storybook-only components", storybookOnly);
printList("Test-only components", testOnly);

if (process.argv.includes("--json")) {
  console.log(
    JSON.stringify(
      {
        trackedComponents: trackedComponents.map(toRepoRelative).sort(),
        runtimeUsed: runtimeUsed.map(toRepoRelative).sort(),
        storybookOnly: storybookOnly.map(toRepoRelative).sort(),
        testOnly: testOnly.map(toRepoRelative).sort(),
        fullyUnused: fullyUnused.map(toRepoRelative).sort(),
      },
      null,
      2,
    ),
  );
}

if (process.argv.includes("--references")) {
  console.log("Storybook-only reverse references");
  console.log("===============================");

  for (const componentFile of storybookOnly.sort()) {
    console.log(toRepoRelative(componentFile));
    const dependents = (reverseDependencyGraph.get(componentFile) ?? [])
      .map(toRepoRelative)
      .sort();

    if (dependents.length === 0) {
      console.log("  - no internal dependents");
      continue;
    }

    for (const dependent of dependents) {
      console.log(`  - ${dependent}`);
    }
  }
}
