/**
 * Script para criar a tabela mobile_installations usada pelo shell mobile.
 *
 * Execute:
 * - npm run migration:apply -- --script=apply-mobile-installations-migration.js
 * - node apps/web/scripts/migration/apply-mobile-installations-migration.js
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

const createTableSql = `CREATE TABLE IF NOT EXISTS "mobile_installations" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "expoPushToken" TEXT,
  "pushPermission" TEXT NOT NULL DEFAULT 'undetermined',
  "capabilities" JSONB,
  "appVersion" TEXT,
  "deviceName" TEXT,
  "locale" TEXT,
  "timezone" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mobile_installations_pkey" PRIMARY KEY ("id")
)`;

const columnDefinitions = [
  ['"userId"', "TEXT"],
  ['"platform"', "TEXT"],
  ['"expoPushToken"', "TEXT"],
  ['"pushPermission"', "TEXT"],
  ['"capabilities"', "JSONB"],
  ['"appVersion"', "TEXT"],
  ['"deviceName"', "TEXT"],
  ['"locale"', "TEXT"],
  ['"timezone"', "TEXT"],
  ['"active"', "BOOLEAN"],
  ['"lastSeenAt"', "TIMESTAMP(3)"],
  ['"createdAt"', "TIMESTAMP(3)"],
  ['"updatedAt"', "TIMESTAMP(3)"],
];

const normalizationSql = [
  `UPDATE "mobile_installations" SET "pushPermission" = 'undetermined' WHERE "pushPermission" IS NULL`,
  `UPDATE "mobile_installations" SET "active" = true WHERE "active" IS NULL`,
  `UPDATE "mobile_installations" SET "lastSeenAt" = CURRENT_TIMESTAMP WHERE "lastSeenAt" IS NULL`,
  `UPDATE "mobile_installations" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL`,
  `UPDATE "mobile_installations" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL`,
  `ALTER TABLE "mobile_installations" ALTER COLUMN "pushPermission" SET DEFAULT 'undetermined'`,
  `ALTER TABLE "mobile_installations" ALTER COLUMN "active" SET DEFAULT true`,
  `ALTER TABLE "mobile_installations" ALTER COLUMN "lastSeenAt" SET DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE "mobile_installations" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE "mobile_installations" ALTER COLUMN "updatedAt" DROP DEFAULT`,
];

const indexSql = [
  `CREATE INDEX IF NOT EXISTS "mobile_installations_userId_active_idx" ON "mobile_installations"("userId", "active")`,
  `CREATE INDEX IF NOT EXISTS "mobile_installations_expoPushToken_idx" ON "mobile_installations"("expoPushToken")`,
];

const foreignKeySql = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mobile_installations_userId_fkey'
  ) THEN
    ALTER TABLE "mobile_installations"
    ADD CONSTRAINT "mobile_installations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;
`;

async function ensureTable() {
  console.log('\n[migration] garantindo tabela "mobile_installations"');
  await prisma.$executeRawUnsafe(createTableSql);

  for (const [columnName, columnType] of columnDefinitions) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "mobile_installations" ADD COLUMN IF NOT EXISTS ${columnName} ${columnType}`,
    );
  }

  for (const statement of normalizationSql) {
    await prisma.$executeRawUnsafe(statement);
  }

  for (const statement of indexSql) {
    await prisma.$executeRawUnsafe(statement);
  }

  await prisma.$executeRawUnsafe(foreignKeySql);
}

async function printValidation() {
  const results = await prisma.$queryRawUnsafe(`
    SELECT
      column_name AS "columnName",
      data_type AS "dataType"
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mobile_installations'
    ORDER BY ordinal_position ASC
  `);

  console.log('\n[migration] colunas encontradas em "mobile_installations":');
  for (const row of results) {
    console.log(`- ${row.columnName}: ${row.dataType}`);
  }
}

async function applyMigration() {
  console.log("[migration] aplicando mobile installations...\n");
  await ensureTable();
  await printValidation();
  console.log('\n[migration] tabela "mobile_installations" pronta');
}

if (require.main === module) {
  applyMigration()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error(
        "\n[migration] erro ao aplicar mobile installations:",
        error.message,
      );
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { applyMigration };
