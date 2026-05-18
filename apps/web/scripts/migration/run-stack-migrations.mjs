import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..", "..", "..");

const args = process.argv.slice(2);
const scriptFlags = args
  .filter((arg) => arg.startsWith("--script="))
  .map((arg) => arg.slice("--script=".length))
  .filter(Boolean);
const positionalScripts = args.filter((arg) => !arg.startsWith("--"));
const shouldList = args.includes("--list");
const shouldRunAll = args.includes("--all");
const shouldDryRun = args.includes("--dry-run");

const KNOWN_DEPENDENCIES = Object.freeze({
  "apply-boost-campaign-engagement-migration.js": [
    "apply-boost-campaign-migration.js",
  ],
  "apply-boost-campaign-radius-km-migration.js": [
    "apply-boost-campaign-migration.js",
  ],
  "apply-own-period-backup-migration.js": ["apply-subscriptions-migration.js"],
  "apply-referral-student-code-migration.js": ["apply-referral-migration.js"],
  "apply-subscription-billing-period-migration.js": [
    "apply-subscriptions-migration.js",
  ],
  "apply-weekly-plan-description-migration.js": [
    "apply-weekly-plan-migration.js",
  ],
});

function getAvailableMigrations() {
  return readdirSync(__dirname)
    .filter((name) => /^apply-.*-migration\.js$/i.test(name))
    .sort((left, right) => left.localeCompare(right));
}

function normalizeScriptName(name) {
  if (name.endsWith(".js")) {
    return name;
  }

  return `${name}.js`;
}

function selectScripts(availableMigrations) {
  if (shouldRunAll) {
    return availableMigrations;
  }

  const requested = [...scriptFlags, ...positionalScripts].map(
    normalizeScriptName,
  );

  if (requested.length === 0) {
    return [];
  }

  const invalid = requested.filter(
    (name) => !availableMigrations.includes(name),
  );

  if (invalid.length > 0) {
    throw new Error(
      `Scripts de migration nao encontrados: ${invalid.join(", ")}`,
    );
  }

  return [...new Set(requested)];
}

function validateKnownDependencies(availableMigrations) {
  const availableSet = new Set(availableMigrations);
  const invalidScripts = [];
  const invalidDependencies = [];

  for (const [scriptName, dependencies] of Object.entries(KNOWN_DEPENDENCIES)) {
    if (!availableSet.has(scriptName)) {
      invalidScripts.push(scriptName);
      continue;
    }

    for (const dependency of dependencies) {
      if (!availableSet.has(dependency)) {
        invalidDependencies.push(`${scriptName} -> ${dependency}`);
      }
    }
  }

  if (invalidScripts.length > 0 || invalidDependencies.length > 0) {
    const details = [
      invalidScripts.length > 0
        ? `scripts sem arquivo correspondente: ${invalidScripts.join(", ")}`
        : null,
      invalidDependencies.length > 0
        ? `dependencias sem arquivo correspondente: ${invalidDependencies.join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join("; ");
    throw new Error(
      `[migration] preflight falhou: mapa de dependencias invalido (${details}).`,
    );
  }
}

function expandScriptsWithDependencies(selectedScripts, availableMigrations) {
  const availableSet = new Set(availableMigrations);
  const requestedSet = new Set(selectedScripts);
  const expandedSet = new Set(selectedScripts);
  const autoIncludedDependencies = new Set();
  const visiting = new Set();
  const visited = new Set();

  function visit(scriptName) {
    if (visited.has(scriptName)) {
      return;
    }

    if (visiting.has(scriptName)) {
      throw new Error(
        `[migration] preflight falhou: ciclo de dependencias detectado envolvendo ${scriptName}.`,
      );
    }

    visiting.add(scriptName);

    const dependencies = KNOWN_DEPENDENCIES[scriptName] ?? [];
    for (const dependency of dependencies) {
      if (!availableSet.has(dependency)) {
        throw new Error(
          `[migration] preflight falhou: dependencia ausente "${dependency}" (requerida por "${scriptName}").`,
        );
      }

      if (!expandedSet.has(dependency)) {
        expandedSet.add(dependency);
      }

      if (!requestedSet.has(dependency)) {
        autoIncludedDependencies.add(dependency);
      }

      visit(dependency);
    }

    visiting.delete(scriptName);
    visited.add(scriptName);
  }

  for (const scriptName of selectedScripts) {
    visit(scriptName);
  }

  return {
    scripts: [...expandedSet],
    autoIncludedDependencies: [...autoIncludedDependencies].sort(
      (left, right) => left.localeCompare(right),
    ),
  };
}

function orderScriptsByDependencies(scripts, availableMigrations) {
  const scriptSet = new Set(scripts);
  const rankByAlphabeticalOrder = new Map(
    availableMigrations.map((name, index) => [name, index]),
  );
  const indegree = new Map();
  const dependents = new Map();

  for (const scriptName of scripts) {
    indegree.set(scriptName, 0);
    dependents.set(scriptName, []);
  }

  for (const scriptName of scripts) {
    const dependencies = (KNOWN_DEPENDENCIES[scriptName] ?? []).filter(
      (dependency) => scriptSet.has(dependency),
    );

    indegree.set(scriptName, dependencies.length);

    for (const dependency of dependencies) {
      dependents.get(dependency).push(scriptName);
    }
  }

  const ready = scripts
    .filter((scriptName) => (indegree.get(scriptName) ?? 0) === 0)
    .sort(
      (left, right) =>
        (rankByAlphabeticalOrder.get(left) ?? 0) -
        (rankByAlphabeticalOrder.get(right) ?? 0),
    );
  const orderedScripts = [];

  while (ready.length > 0) {
    const current = ready.shift();
    orderedScripts.push(current);

    for (const dependent of dependents.get(current) ?? []) {
      const nextIndegree = (indegree.get(dependent) ?? 1) - 1;
      indegree.set(dependent, nextIndegree);

      if (nextIndegree === 0) {
        ready.push(dependent);
        ready.sort(
          (left, right) =>
            (rankByAlphabeticalOrder.get(left) ?? 0) -
            (rankByAlphabeticalOrder.get(right) ?? 0),
        );
      }
    }
  }

  if (orderedScripts.length !== scripts.length) {
    const unresolved = scripts.filter(
      (scriptName) => (indegree.get(scriptName) ?? 0) > 0,
    );
    throw new Error(
      `[migration] preflight falhou: ciclo de dependencias detectado (${unresolved.join(", ")}).`,
    );
  }

  return orderedScripts;
}

function dependencyLabel(scriptName) {
  const dependencies = KNOWN_DEPENDENCIES[scriptName] ?? [];
  if (dependencies.length === 0) {
    return "";
  }

  return ` (depende de: ${dependencies.join(", ")})`;
}

function runScript(scriptName) {
  console.log(`\n[migration] executando ${scriptName}`);

  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, scriptName)],
    {
      cwd: rootDir,
      stdio: "inherit",
      env: process.env,
      encoding: "utf8",
    },
  );

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 0) !== 0) {
    process.exit(result.status ?? 1);
  }
}

const availableMigrations = getAvailableMigrations();
validateKnownDependencies(availableMigrations);
const selectedScripts = selectScripts(availableMigrations);

if (shouldList || (!shouldRunAll && selectedScripts.length === 0)) {
  console.log("Migrations custom disponiveis em apps/web/scripts/migration:");

  for (const scriptName of availableMigrations) {
    console.log(`- ${scriptName}${dependencyLabel(scriptName)}`);
  }

  if (!shouldList && selectedScripts.length === 0) {
    console.log(
      '\nUse "--all" para executar tudo ou "--script=<arquivo>" para escolher scripts especificos.',
    );
  }

  process.exit(0);
}

const { scripts: expandedScripts, autoIncludedDependencies } =
  expandScriptsWithDependencies(selectedScripts, availableMigrations);
const orderedScripts = orderScriptsByDependencies(
  expandedScripts,
  availableMigrations,
);

if (shouldDryRun) {
  console.log("Scripts selecionados para execucao:");
  for (const scriptName of orderedScripts) {
    console.log(`- ${scriptName}`);
  }

  if (autoIncludedDependencies.length > 0) {
    console.log("\nDependencias adicionadas automaticamente no preflight:");
    for (const dependency of autoIncludedDependencies) {
      console.log(`- ${dependency}`);
    }
  }

  process.exit(0);
}

console.log(
  `[migration] ${orderedScripts.length} script(s) selecionado(s) apos preflight de dependencias`,
);

if (autoIncludedDependencies.length > 0) {
  console.log(
    `[migration] dependencias adicionadas automaticamente: ${autoIncludedDependencies.join(", ")}`,
  );
}

for (const scriptName of orderedScripts) {
  runScript(scriptName);
}

console.log("\n[migration] execucao concluida");
