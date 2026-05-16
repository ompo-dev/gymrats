import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile, parseArgs } from "./lib.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..", "..", "..");
const migrationsDir = path.join(rootDir, "packages", "db", "prisma", "migrations");

const WEEKLY_PLAN_DESCRIPTION_MIGRATION =
  "20250226120000_add_weekly_plan_description";
const WEEKLY_PLAN_CREATE_MIGRATION = "20260227010400_add_weekly_plan";
const INIT_MIGRATION = "20251203214532_init";

function listMigrationDirectories() {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        /^\d+_/.test(entry.name) &&
        fs.existsSync(path.join(migrationsDir, entry.name, "migration.sql")),
    )
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function detectStaticRisk(migrations) {
  const issues = [];
  const descriptionIndex = migrations.indexOf(WEEKLY_PLAN_DESCRIPTION_MIGRATION);
  const weeklyPlanIndex = migrations.indexOf(WEEKLY_PLAN_CREATE_MIGRATION);

  if (
    descriptionIndex !== -1 &&
    weeklyPlanIndex !== -1 &&
    descriptionIndex < weeklyPlanIndex
  ) {
    issues.push({
      code: "WEEKLY_PLAN_ORDER",
      message:
        "A migration de description de weekly_plans aparece antes da migration que cria a tabela.",
    });
  }

  const initPath = path.join(migrationsDir, INIT_MIGRATION, "migration.sql");
  if (fs.existsSync(initPath)) {
    const initSql = fs.readFileSync(initPath, "utf8");
    if (/\bDATETIME\b/i.test(initSql)) {
      issues.push({
        code: "DATETIME_IN_POSTGRES_CHAIN",
        message:
          "A migration init contem DATETIME em uma cadeia marcada como PostgreSQL.",
      });
    }
  }

  return issues;
}

async function readAppliedMigrationsFromDb(connectionString) {
  const { Client } = await import("pg");
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const tableCheck = await client.query(
      `SELECT to_regclass('public._prisma_migrations') AS table_name`,
    );
    const tableName = tableCheck.rows[0]?.table_name;
    if (!tableName) {
      return {
        hasTable: false,
        applied: [],
      };
    }

    const rows = await client.query(
      `SELECT migration_name FROM "_prisma_migrations" ORDER BY finished_at NULLS LAST, migration_name`,
    );

    return {
      hasTable: true,
      applied: rows.rows
        .map((row) => row.migration_name)
        .filter((value) => typeof value === "string"),
    };
  } finally {
    await client.end();
  }
}

function getConnectionString() {
  return process.env.DIRECT_URL || process.env.DATABASE_URL || "";
}

function printTrackGuidance(appliedMigrationsSet, dbStateKnown) {
  if (!dbStateKnown) {
    console.error(
      "[migration:safety] Trilha recomendada: indeterminada (estado de _prisma_migrations indisponivel).",
    );
    console.error(
      "[migration:safety] Rode novamente com acesso ao banco para definir Trilha A/B antes de qualquer `prisma migrate deploy`.",
    );
    return;
  }

  const riskyApplied =
    appliedMigrationsSet.has(WEEKLY_PLAN_DESCRIPTION_MIGRATION) ||
    appliedMigrationsSet.has(INIT_MIGRATION);

  if (riskyApplied) {
    console.error("[migration:safety] Trilha recomendada: A (ambiente ja aplicado).");
    console.error(
      "[migration:safety] Nao reescrever migrations historicas ja aplicadas; usar resolve/baseline controlado por ambiente.",
    );
    return;
  }

  console.error(
    "[migration:safety] Trilha recomendada: B (ambiente sem aplicacao completa da cadeia legada).",
  );
  console.error(
    "[migration:safety] Corrigir estrategia antes de usar prisma migrate deploy em ambientes novos.",
  );
}

export async function runPrismaMigrationSafetyCheck(options = {}) {
  const requireDbState = options.requireDbState === true;
  const migrations = listMigrationDirectories();
  const staticIssues = detectStaticRisk(migrations);

  let dbState = { hasTable: false, applied: [] };
  let dbStateKnown = false;
  const connectionString = getConnectionString();

  if (connectionString) {
    try {
      dbState = await readAppliedMigrationsFromDb(connectionString);
      dbStateKnown = true;
    } catch (error) {
      if (requireDbState) {
        throw error;
      }
      console.warn("[migration:safety] Aviso: nao foi possivel ler _prisma_migrations.", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else if (requireDbState) {
    throw new Error("DIRECT_URL ou DATABASE_URL e obrigatorio para safety-check.");
  }

  if (staticIssues.length === 0) {
    console.log("[migration:safety] OK: nenhuma inconsistência critica detectada.");
    return { ok: true };
  }

  console.error("[migration:safety] Falha: inconsistencias criticas detectadas.");
  for (const issue of staticIssues) {
    console.error(`- [${issue.code}] ${issue.message}`);
  }

  printTrackGuidance(new Set(dbState.applied), dbStateKnown);
  return { ok: false, issues: staticIssues, dbState };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { flags } = parseArgs();
  const envFile = flags.get("env-file");
  if (envFile) {
    loadEnvFile(envFile);
  }

  const result = await runPrismaMigrationSafetyCheck({
    requireDbState: false,
  });

  if (!result.ok) {
    process.exit(1);
  }
}
