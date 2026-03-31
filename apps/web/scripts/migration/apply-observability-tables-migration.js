/**
 * Script para criar as tabelas de observability/telemetry no banco.
 *
 * Execute:
 * - npm run migration:apply -- --script=apply-observability-tables-migration.js
 * - node apps/web/scripts/migration/apply-observability-tables-migration.js
 */

const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const rootDir = path.resolve(__dirname, "..", "..", "..", "..");

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

function loadEnvFileIfPresent(relativeFilePath) {
  const absolutePath = path.join(rootDir, relativeFilePath);

  if (!fs.existsSync(absolutePath)) {
    return;
  }

  const contents = fs.readFileSync(absolutePath, "utf8");

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

function ensureDatabaseEnv() {
  if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    loadEnvFileIfPresent(".env");
    loadEnvFileIfPresent(".env.docker");
  }

  if (!process.env.DATABASE_URL && process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL;
  }

  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }

  if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    throw new Error(
      "DATABASE_URL ou DIRECT_URL nao configurado para a migration.",
    );
  }
}

ensureDatabaseEnv();

const prisma = new PrismaClient();

const tableDefinitions = [
  {
    name: "telemetry_events",
    createSql: `CREATE TABLE IF NOT EXISTS "telemetry_events" (
      "id" TEXT NOT NULL,
      "eventType" TEXT NOT NULL,
      "domain" TEXT NOT NULL,
      "actorId" TEXT,
      "journey" TEXT,
      "requestId" TEXT,
      "releaseId" TEXT,
      "featureFlagSet" TEXT,
      "metricName" TEXT,
      "metricValue" DOUBLE PRECISION,
      "status" TEXT,
      "payload" JSONB,
      "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "telemetry_events_pkey" PRIMARY KEY ("id")
    )`,
    columns: [
      ['"eventType"', "TEXT NOT NULL"],
      ['"domain"', "TEXT NOT NULL"],
      ['"actorId"', "TEXT"],
      ['"journey"', "TEXT"],
      ['"requestId"', "TEXT"],
      ['"releaseId"', "TEXT"],
      ['"featureFlagSet"', "TEXT"],
      ['"metricName"', "TEXT"],
      ['"metricValue"', "DOUBLE PRECISION"],
      ['"status"', "TEXT"],
      ['"payload"', "JSONB"],
      ['"occurredAt"', "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP"],
      ['"createdAt"', "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    ],
    indexes: [
      `CREATE INDEX IF NOT EXISTS "telemetry_events_eventType_occurredAt_idx" ON "telemetry_events"("eventType", "occurredAt")`,
      `CREATE INDEX IF NOT EXISTS "telemetry_events_domain_occurredAt_idx" ON "telemetry_events"("domain", "occurredAt")`,
      `CREATE INDEX IF NOT EXISTS "telemetry_events_releaseId_occurredAt_idx" ON "telemetry_events"("releaseId", "occurredAt")`,
    ],
  },
  {
    name: "telemetry_rollups_minute",
    createSql: `CREATE TABLE IF NOT EXISTS "telemetry_rollups_minute" (
      "id" TEXT NOT NULL,
      "bucketStart" TIMESTAMP(3) NOT NULL,
      "eventType" TEXT NOT NULL,
      "domain" TEXT NOT NULL,
      "releaseId" TEXT,
      "requestCount" INTEGER NOT NULL DEFAULT 0,
      "errorCount" INTEGER NOT NULL DEFAULT 0,
      "avgLatencyMs" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "p50LatencyMs" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "p95LatencyMs" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "metadata" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "telemetry_rollups_minute_pkey" PRIMARY KEY ("id")
    )`,
    columns: [
      ['"bucketStart"', "TIMESTAMP(3) NOT NULL"],
      ['"eventType"', "TEXT NOT NULL"],
      ['"domain"', "TEXT NOT NULL"],
      ['"releaseId"', "TEXT"],
      ['"requestCount"', "INTEGER NOT NULL DEFAULT 0"],
      ['"errorCount"', "INTEGER NOT NULL DEFAULT 0"],
      ['"avgLatencyMs"', "DOUBLE PRECISION NOT NULL DEFAULT 0"],
      ['"p50LatencyMs"', "DOUBLE PRECISION NOT NULL DEFAULT 0"],
      ['"p95LatencyMs"', "DOUBLE PRECISION NOT NULL DEFAULT 0"],
      ['"metadata"', "JSONB"],
      ['"createdAt"', "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP"],
      ['"updatedAt"', "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    ],
    indexes: [
      `CREATE UNIQUE INDEX IF NOT EXISTS "telemetry_rollups_minute_bucketStart_eventType_domain_releaseId_key" ON "telemetry_rollups_minute"("bucketStart", "eventType", "domain", "releaseId")`,
      `CREATE INDEX IF NOT EXISTS "telemetry_rollups_minute_bucketStart_domain_idx" ON "telemetry_rollups_minute"("bucketStart", "domain")`,
    ],
  },
  {
    name: "business_events",
    createSql: `CREATE TABLE IF NOT EXISTS "business_events" (
      "id" TEXT NOT NULL,
      "eventType" TEXT NOT NULL,
      "domain" TEXT NOT NULL,
      "actorId" TEXT,
      "requestId" TEXT,
      "releaseId" TEXT,
      "status" TEXT,
      "payload" JSONB,
      "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "business_events_pkey" PRIMARY KEY ("id")
    )`,
    columns: [
      ['"eventType"', "TEXT NOT NULL"],
      ['"domain"', "TEXT NOT NULL"],
      ['"actorId"', "TEXT"],
      ['"requestId"', "TEXT"],
      ['"releaseId"', "TEXT"],
      ['"status"', "TEXT"],
      ['"payload"', "JSONB"],
      ['"occurredAt"', "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP"],
      ['"createdAt"', "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    ],
    indexes: [
      `CREATE INDEX IF NOT EXISTS "business_events_eventType_occurredAt_idx" ON "business_events"("eventType", "occurredAt")`,
      `CREATE INDEX IF NOT EXISTS "business_events_domain_occurredAt_idx" ON "business_events"("domain", "occurredAt")`,
    ],
  },
];

async function ensureTable(definition) {
  console.log(`\n[migration] garantindo tabela ${definition.name}`);
  await prisma.$executeRawUnsafe(definition.createSql);

  for (const [columnName, columnType] of definition.columns) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${definition.name}" ADD COLUMN IF NOT EXISTS ${columnName} ${columnType}`,
    );
  }

  for (const indexSql of definition.indexes) {
    await prisma.$executeRawUnsafe(indexSql);
  }
}

async function printValidation() {
  const results = await prisma.$queryRawUnsafe(`
    SELECT
      table_name AS "tableName"
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('telemetry_events', 'telemetry_rollups_minute', 'business_events')
    ORDER BY table_name ASC
  `);

  const tableNames = results.map((row) => row.tableName);
  console.log("\n[migration] tabelas encontradas:");
  for (const tableName of tableNames) {
    console.log(`- ${tableName}`);
  }
}

async function applyMigration() {
  console.log("[migration] aplicando observability tables...\n");

  for (const definition of tableDefinitions) {
    await ensureTable(definition);
  }

  await printValidation();
  console.log("\n[migration] observability tables prontas");
}

if (require.main === module) {
  applyMigration()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error(
        "\n[migration] erro ao aplicar observability tables:",
        error.message,
      );
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { applyMigration };
