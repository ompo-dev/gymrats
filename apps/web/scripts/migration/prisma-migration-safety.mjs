import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile, parseArgs } from "./lib.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..", "..", "..");
const migrationsDir = path.join(
  rootDir,
  "packages",
  "db",
  "prisma",
  "migrations",
);

const WEEKLY_PLAN_DESCRIPTION_MIGRATION =
  "20250226120000_add_weekly_plan_description";
const WEEKLY_PLAN_CREATE_MIGRATION = "20260227010400_add_weekly_plan";
const INIT_MIGRATION = "20251203214532_init";

function parseBooleanFlag(value, defaultValue) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalizedValue = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["0", "false", "no", "n", "off"].includes(normalizedValue)) {
    return false;
  }

  throw new Error(`Valor booleano invalido: ${value}`);
}

function normalizeTrack(value) {
  const normalizedValue = String(value ?? "auto")
    .trim()
    .toUpperCase();

  if (normalizedValue === "AUTO") {
    return "auto";
  }

  if (normalizedValue === "A" || normalizedValue === "B") {
    return normalizedValue;
  }

  throw new Error(
    `Track de migration invalida: ${value}. Use "auto", "A" ou "B".`,
  );
}

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
  const descriptionIndex = migrations.indexOf(
    WEEKLY_PLAN_DESCRIPTION_MIGRATION,
  );
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

function inferTrackFromDb(appliedMigrationsSet) {
  const riskyApplied =
    appliedMigrationsSet.has(WEEKLY_PLAN_DESCRIPTION_MIGRATION) ||
    appliedMigrationsSet.has(INIT_MIGRATION);

  return riskyApplied ? "A" : "B";
}

function printTrackGuidance({
  requestedTrack,
  inferredTrack,
  effectiveTrack,
  dbStateKnown,
  failOnIndeterminate,
}) {
  console.error(
    `[migration:safety] Track solicitada: ${requestedTrack.toUpperCase()}`,
  );

  if (dbStateKnown) {
    console.error(
      `[migration:safety] Track inferida por banco: ${inferredTrack}`,
    );
  } else {
    console.error(
      "[migration:safety] Track inferida por banco: indisponivel (sem leitura de _prisma_migrations).",
    );
  }

  if (effectiveTrack) {
    console.error(`[migration:safety] Track efetiva: ${effectiveTrack}`);
    return;
  }

  console.error("[migration:safety] Track efetiva: indeterminada.");
  if (failOnIndeterminate) {
    console.error(
      "[migration:safety] Falha por configuracao: indeterminacao nao permitida sem track explicita.",
    );
  } else {
    console.error(
      "[migration:safety] Modo advisory: nao bloqueado. Defina track A/B no ambiente para gate estrito.",
    );
  }
}

function buildTrackDecision({
  requestedTrack,
  inferredTrack,
  dbStateKnown,
  staticIssues,
  failOnIndeterminate,
}) {
  const effectiveTrack =
    requestedTrack === "auto" ? inferredTrack : requestedTrack;

  if (staticIssues.length === 0) {
    return {
      ok: true,
      mode: "clean",
      effectiveTrack,
      inferredTrack,
      advisory: false,
    };
  }

  if (effectiveTrack === "A") {
    return {
      ok: true,
      mode: "track_a_guardrail",
      effectiveTrack,
      inferredTrack,
      advisory: true,
      message:
        "Inconsistencias estaticas detectadas, mas track A permite continuidade com baseline/resolve por ambiente.",
    };
  }

  if (effectiveTrack === "B") {
    return {
      ok: false,
      mode: "track_b_block",
      effectiveTrack,
      inferredTrack,
      advisory: false,
      message:
        "Inconsistencias estaticas detectadas na track B. Corrija cadeia/estrategia antes de `prisma migrate deploy`.",
    };
  }

  const blocked = failOnIndeterminate || dbStateKnown;
  return {
    ok: !blocked,
    mode: blocked ? "indeterminate_block" : "indeterminate_advisory",
    effectiveTrack: null,
    inferredTrack,
    advisory: !blocked,
    message: blocked
      ? "Nao foi possivel determinar track efetiva automaticamente; defina PRISMA_MIGRATION_TRACK=A|B para decisao explicita."
      : "Estado real nao inferivel automaticamente; safety check em modo advisory.",
  };
}

export async function runPrismaMigrationSafetyCheck(options = {}) {
  const requireDbState = options.requireDbState === true;
  const requestedTrack = normalizeTrack(
    options.track ?? process.env.PRISMA_MIGRATION_TRACK ?? "auto",
  );
  const failOnIndeterminate = parseBooleanFlag(
    options.failOnIndeterminate ??
      process.env.PRISMA_MIGRATION_SAFETY_FAIL_ON_INDETERMINATE ??
      "false",
    false,
  );

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
      console.warn(
        "[migration:safety] Aviso: nao foi possivel ler _prisma_migrations.",
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  } else if (requireDbState) {
    throw new Error(
      "DIRECT_URL ou DATABASE_URL e obrigatorio para safety-check.",
    );
  }

  const inferredTrack = dbStateKnown
    ? inferTrackFromDb(new Set(dbState.applied))
    : null;

  const decision = buildTrackDecision({
    requestedTrack,
    inferredTrack,
    dbStateKnown,
    staticIssues,
    failOnIndeterminate,
  });

  if (staticIssues.length === 0) {
    console.log(
      "[migration:safety] OK: nenhuma inconsistencia critica detectada.",
    );
    return {
      ok: true,
      issues: [],
      dbState,
      dbStateKnown,
      requestedTrack,
      inferredTrack,
      effectiveTrack: decision.effectiveTrack,
      mode: decision.mode,
      advisory: decision.advisory,
    };
  }

  console.error(
    "[migration:safety] Atencao: inconsistencias estaticas detectadas.",
  );
  for (const issue of staticIssues) {
    console.error(`- [${issue.code}] ${issue.message}`);
  }

  printTrackGuidance({
    requestedTrack,
    inferredTrack,
    effectiveTrack: decision.effectiveTrack,
    dbStateKnown,
    failOnIndeterminate,
  });

  console.error(`[migration:safety] Decisao: ${decision.message}`);
  if (decision.ok) {
    console.error(
      "[migration:safety] Resultado: nao bloqueante para este contexto.",
    );
  } else {
    console.error("[migration:safety] Resultado: bloqueante.");
  }

  return {
    ok: decision.ok,
    issues: staticIssues,
    dbState,
    dbStateKnown,
    requestedTrack,
    inferredTrack,
    effectiveTrack: decision.effectiveTrack,
    mode: decision.mode,
    advisory: decision.advisory,
    message: decision.message,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { flags } = parseArgs();
  const envFile = flags.get("env-file");
  if (envFile) {
    loadEnvFile(envFile);
  }

  const track = flags.get("track");
  const failOnIndeterminate = flags.get("fail-on-indeterminate");
  const requireDbState = flags.get("require-db-state");

  const result = await runPrismaMigrationSafetyCheck({
    requireDbState:
      requireDbState === undefined
        ? false
        : parseBooleanFlag(requireDbState, false),
    track: track ?? undefined,
    failOnIndeterminate:
      failOnIndeterminate === undefined
        ? undefined
        : parseBooleanFlag(failOnIndeterminate, false),
  });

  if (!result.ok) {
    process.exit(1);
  }
}
