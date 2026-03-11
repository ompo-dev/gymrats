import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
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

  const requested = [...scriptFlags, ...positionalScripts].map(normalizeScriptName);

  if (requested.length === 0) {
    return [];
  }

  const invalid = requested.filter((name) => !availableMigrations.includes(name));

  if (invalid.length > 0) {
    throw new Error(
      `Scripts de migration nao encontrados: ${invalid.join(", ")}`,
    );
  }

  return requested;
}

function runScript(scriptName) {
  console.log(`\n[migration] executando ${scriptName}`);

  const result = spawnSync(process.execPath, [path.join(__dirname, scriptName)], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 0) !== 0) {
    process.exit(result.status ?? 1);
  }
}

const availableMigrations = getAvailableMigrations();
const selectedScripts = selectScripts(availableMigrations);

if (shouldList || (!shouldRunAll && selectedScripts.length === 0)) {
  console.log("Migrations custom disponiveis em apps/web/scripts/migration:");

  for (const scriptName of availableMigrations) {
    console.log(`- ${scriptName}`);
  }

  if (!shouldList && selectedScripts.length === 0) {
    console.log(
      '\nUse "--all" para executar tudo ou "--script=<arquivo>" para escolher scripts especificos.',
    );
  }

  process.exit(0);
}

if (shouldDryRun) {
  console.log("Scripts selecionados:");
  for (const scriptName of selectedScripts) {
    console.log(`- ${scriptName}`);
  }
  process.exit(0);
}

console.log(`[migration] ${selectedScripts.length} script(s) selecionado(s)`);

for (const scriptName of selectedScripts) {
  runScript(scriptName);
}

console.log("\n[migration] execucao concluida");
