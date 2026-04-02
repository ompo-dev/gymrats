/**
 * Script para aplicar policies de seguranca e RLS no banco.
 *
 * Execute:
 * - npm run migration:apply:script -- --script=apply-security-rls-migration.js
 * - node apps/web/scripts/migration/apply-security-rls-migration.js
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

const auditLogStatements = {
  createEnum: `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'AuditLogResult'
      ) THEN
        CREATE TYPE "AuditLogResult" AS ENUM ('SUCCESS', 'FAILURE');
      END IF;
    END
  $$`,
  createTable: `CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "targetId" TEXT,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT,
    "requestId" TEXT,
    "payload" JSONB,
    "result" "AuditLogResult" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
  )`,
  columns: [
    ['"action"', "TEXT NOT NULL"],
    ['"actorId"', "TEXT"],
    ['"targetId"', "TEXT"],
    ['"ip"', "TEXT NOT NULL"],
    ['"userAgent"', "TEXT"],
    ['"requestId"', "TEXT"],
    ['"payload"', "JSONB"],
    ['"result"', '"AuditLogResult" NOT NULL DEFAULT \'SUCCESS\''],
    ['"occurredAt"', "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    ['"createdAt"', "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP"],
  ],
  indexes: [
    `CREATE INDEX IF NOT EXISTS "audit_logs_action_occurredAt_idx" ON "audit_logs"("action", "occurredAt")`,
    `CREATE INDEX IF NOT EXISTS "audit_logs_actorId_occurredAt_idx" ON "audit_logs"("actorId", "occurredAt")`,
  ],
};

const policyDefinitions = [
  {
    tableName: "students",
    statements: [
      `ALTER TABLE "students" ENABLE ROW LEVEL SECURITY`,
      `DROP POLICY IF EXISTS "students_self_select" ON "students"`,
      `CREATE POLICY "students_self_select" ON "students"
        FOR SELECT
        USING ("userId" = auth.uid()::text)`,
      `DROP POLICY IF EXISTS "students_self_update" ON "students"`,
      `CREATE POLICY "students_self_update" ON "students"
        FOR UPDATE
        USING ("userId" = auth.uid()::text)
        WITH CHECK ("userId" = auth.uid()::text)`,
    ],
  },
  {
    tableName: "workout_history",
    statements: [
      `ALTER TABLE "workout_history" ENABLE ROW LEVEL SECURITY`,
      `DROP POLICY IF EXISTS "workout_history_self_access" ON "workout_history"`,
      `CREATE POLICY "workout_history_self_access" ON "workout_history"
        FOR ALL
        USING (
          "studentId" IN (
            SELECT s.id FROM "students" s WHERE s."userId" = auth.uid()::text
          )
        )
        WITH CHECK (
          "studentId" IN (
            SELECT s.id FROM "students" s WHERE s."userId" = auth.uid()::text
          )
        )`,
    ],
  },
  {
    tableName: "payments",
    statements: [
      `ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY`,
      `DROP POLICY IF EXISTS "payments_self_access" ON "payments"`,
      `CREATE POLICY "payments_self_access" ON "payments"
        FOR ALL
        USING (
          "studentId" IN (
            SELECT s.id FROM "students" s WHERE s."userId" = auth.uid()::text
          )
        )
        WITH CHECK (
          "studentId" IN (
            SELECT s.id FROM "students" s WHERE s."userId" = auth.uid()::text
          )
        )`,
    ],
  },
  {
    tableName: "gym_memberships",
    statements: [
      `ALTER TABLE "gym_memberships" ENABLE ROW LEVEL SECURITY`,
      `DROP POLICY IF EXISTS "gym_memberships_self_access" ON "gym_memberships"`,
      `CREATE POLICY "gym_memberships_self_access" ON "gym_memberships"
        FOR ALL
        USING (
          "studentId" IN (
            SELECT s.id FROM "students" s WHERE s."userId" = auth.uid()::text
          )
        )
        WITH CHECK (
          "studentId" IN (
            SELECT s.id FROM "students" s WHERE s."userId" = auth.uid()::text
          )
        )`,
    ],
  },
  {
    tableName: "gyms",
    statements: [
      `ALTER TABLE "gyms" ENABLE ROW LEVEL SECURITY`,
      `DROP POLICY IF EXISTS "gyms_public_read" ON "gyms"`,
      `CREATE POLICY "gyms_public_read" ON "gyms"
        FOR SELECT
        USING (true)`,
      `DROP POLICY IF EXISTS "gyms_owner_write" ON "gyms"`,
      `CREATE POLICY "gyms_owner_write" ON "gyms"
        FOR ALL
        USING ("userId" = auth.uid()::text)
        WITH CHECK ("userId" = auth.uid()::text)`,
    ],
  },
  {
    tableName: "personals",
    statements: [
      `ALTER TABLE "personals" ENABLE ROW LEVEL SECURITY`,
      `DROP POLICY IF EXISTS "personals_owner_access" ON "personals"`,
      `CREATE POLICY "personals_owner_access" ON "personals"
        FOR ALL
        USING ("userId" = auth.uid()::text)
        WITH CHECK ("userId" = auth.uid()::text)`,
    ],
  },
  {
    tableName: "audit_logs",
    statements: [
      `ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY`,
      `DROP POLICY IF EXISTS "audit_logs_insert_only" ON "audit_logs"`,
      `CREATE POLICY "audit_logs_insert_only" ON "audit_logs"
        FOR INSERT
        WITH CHECK (true)`,
    ],
  },
];

async function runStatement(sql) {
  await prisma.$executeRawUnsafe(sql);
}

async function tableExists(tableName) {
  const result = await prisma.$queryRawUnsafe(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS "exists"
    `,
    tableName,
  );

  return Boolean(result?.[0]?.exists);
}

async function ensureAuditLogs() {
  console.log("[migration] garantindo tabela audit_logs");
  await runStatement(auditLogStatements.createEnum);
  await runStatement(auditLogStatements.createTable);

  for (const [columnName, columnType] of auditLogStatements.columns) {
    await runStatement(
      `ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS ${columnName} ${columnType}`,
    );
  }

  for (const indexSql of auditLogStatements.indexes) {
    await runStatement(indexSql);
  }
}

async function applyPolicies(tableName, statements) {
  const exists = await tableExists(tableName);

  if (!exists) {
    console.log(`[migration] pulando ${tableName}: tabela inexistente`);
    return;
  }

  console.log(`[migration] aplicando policies em ${tableName}`);
  for (const sql of statements) {
    await runStatement(sql);
  }
}

async function printValidation() {
  const policies = await prisma.$queryRawUnsafe(`
    SELECT
      schemaname AS "schemaName",
      tablename AS "tableName",
      policyname AS "policyName"
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'students',
        'workout_history',
        'payments',
        'gym_memberships',
        'gyms',
        'personals',
        'audit_logs'
      )
    ORDER BY tablename ASC, policyname ASC
  `);

  console.log("\n[migration] policies encontradas:");
  for (const row of policies) {
    console.log(`- ${row.tableName}: ${row.policyName}`);
  }
}

async function applyMigration() {
  console.log("[migration] aplicando security RLS...\n");

  await ensureAuditLogs();

  for (const definition of policyDefinitions) {
    await applyPolicies(definition.tableName, definition.statements);
  }

  await printValidation();
  console.log("\n[migration] security RLS pronta");
}

if (require.main === module) {
  applyMigration()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("\n[migration] erro ao aplicar security RLS:", error.message);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { applyMigration };
