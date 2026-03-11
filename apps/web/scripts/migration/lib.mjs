import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..", "..", "..");
const schemaPath = path.join("packages", "db", "prisma", "schema.prisma");

function stripWrappingQuotes(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const flags = new Map();
  const positionals = [];

  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const [key, rawValue] = arg.slice(2).split("=", 2);
      flags.set(key, rawValue ?? "true");
      continue;
    }

    positionals.push(arg);
  }

  return { flags, positionals };
}

export function loadEnvFile(envFilePath) {
  const absolutePath = path.isAbsolute(envFilePath)
    ? envFilePath
    : path.join(rootDir, envFilePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Arquivo de ambiente nao encontrado: ${envFilePath}`);
  }

  const contents = readFileSync(absolutePath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = stripWrappingQuotes(trimmed.slice(separatorIndex + 1));

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function getMigrationEnv() {
  const directUrl = process.env.DIRECT_URL
    ? stripWrappingQuotes(process.env.DIRECT_URL)
    : "";
  const databaseUrl = process.env.DATABASE_URL
    ? stripWrappingQuotes(process.env.DATABASE_URL)
    : "";
  const resolvedDatabaseUrl = directUrl || databaseUrl;

  if (!resolvedDatabaseUrl) {
    throw new Error(
      "DATABASE_URL ou DIRECT_URL e obrigatorio para rodar migrations.",
    );
  }

  return {
    ...process.env,
    DATABASE_URL: resolvedDatabaseUrl,
  };
}

export function runPrisma(commandArgs, customEnv = process.env) {
  const result = spawnSync(
    "bun",
    ["x", "prisma", ...commandArgs, "--schema", schemaPath],
    {
      cwd: rootDir,
      stdio: "inherit",
      env: customEnv,
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

export function printMigrationContext() {
  const usingDirectUrl = Boolean(process.env.DIRECT_URL);
  console.log(
    `[migration] usando ${usingDirectUrl ? "DIRECT_URL" : "DATABASE_URL"} para operar o Prisma`,
  );
}
