/**
 * Script para criar as tabelas de presenca unificada e backfill do historico
 * legado de check-ins.
 *
 * Execute:
 * - npm run migration:apply -- --script=apply-access-presence-migration.js
 * - node apps/web/scripts/migration/apply-access-presence-migration.js
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

const enumStatements = [
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccessSubjectType') THEN
      CREATE TYPE "AccessSubjectType" AS ENUM ('STUDENT', 'PERSONAL');
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccessTransport') THEN
      CREATE TYPE "AccessTransport" AS ENUM ('webhook', 'bridge', 'manual');
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccessDeviceStatus') THEN
      CREATE TYPE "AccessDeviceStatus" AS ENUM ('active', 'paused', 'offline', 'error');
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccessDirection') THEN
      CREATE TYPE "AccessDirection" AS ENUM ('entry', 'exit', 'unknown');
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccessEventSource') THEN
      CREATE TYPE "AccessEventSource" AS ENUM ('device', 'manual_gym', 'manual_personal', 'legacy_import', 'app_mobile');
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccessEventStatus') THEN
      CREATE TYPE "AccessEventStatus" AS ENUM ('pending_match', 'applied', 'duplicate', 'ignored', 'anomalous');
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PresenceSessionStatus') THEN
      CREATE TYPE "PresenceSessionStatus" AS ENUM ('open', 'closed', 'manually_closed', 'anomalous');
    END IF;
  END $$;`,
];

const tableStatements = [
  `CREATE TABLE IF NOT EXISTS "access_devices" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendorKey" TEXT NOT NULL,
    "adapterKey" TEXT NOT NULL DEFAULT 'generic-webhook',
    "hardwareType" TEXT NOT NULL,
    "authModes" JSONB,
    "transport" "AccessTransport" NOT NULL DEFAULT 'webhook',
    "status" "AccessDeviceStatus" NOT NULL DEFAULT 'active',
    "externalDeviceId" TEXT,
    "externalSerial" TEXT,
    "ingestionKey" TEXT NOT NULL,
    "secretHash" TEXT,
    "directionMode" TEXT NOT NULL DEFAULT 'auto',
    "dedupeWindowSeconds" INTEGER NOT NULL DEFAULT 120,
    "payloadTemplate" JSONB,
    "settings" JSONB,
    "lastHeartbeatAt" TIMESTAMP(3),
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "access_devices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "access_devices_ingestionKey_key" UNIQUE ("ingestionKey")
  )`,
  `CREATE TABLE IF NOT EXISTS "access_credential_bindings" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "subjectType" "AccessSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "studentId" TEXT,
    "personalId" TEXT,
    "providerKey" TEXT,
    "deviceId" TEXT,
    "identifierType" TEXT NOT NULL,
    "identifierValue" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "access_credential_bindings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "access_credential_bindings_gym_identifier_key" UNIQUE ("gymId", "identifierType", "identifierValue")
  )`,
  `CREATE TABLE IF NOT EXISTS "access_raw_events" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "deviceId" TEXT,
    "providerKey" TEXT,
    "providerEventId" TEXT,
    "sourceIp" TEXT,
    "signatureValid" BOOLEAN,
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processingError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "access_raw_events_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "access_events" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "deviceId" TEXT,
    "rawEventId" TEXT,
    "subjectType" "AccessSubjectType",
    "subjectId" TEXT,
    "studentId" TEXT,
    "personalId" TEXT,
    "subjectName" TEXT,
    "source" "AccessEventSource" NOT NULL,
    "status" "AccessEventStatus" NOT NULL DEFAULT 'applied',
    "confidence" TEXT NOT NULL DEFAULT 'exact',
    "providerKey" TEXT,
    "providerEventId" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "identifierType" TEXT,
    "identifierValue" TEXT,
    "directionReceived" "AccessDirection" NOT NULL DEFAULT 'unknown',
    "directionResolved" "AccessDirection" NOT NULL DEFAULT 'unknown',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "actorUserId" TEXT,
    "actorRole" TEXT,
    "manualReason" TEXT,
    "legacyCheckInId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "access_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "access_events_dedupeKey_key" UNIQUE ("dedupeKey"),
    CONSTRAINT "access_events_legacyCheckInId_key" UNIQUE ("legacyCheckInId")
  )`,
  `CREATE TABLE IF NOT EXISTS "presence_sessions" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "subjectType" "AccessSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "studentId" TEXT,
    "personalId" TEXT,
    "subjectName" TEXT,
    "status" "PresenceSessionStatus" NOT NULL DEFAULT 'open',
    "entryAt" TIMESTAMP(3) NOT NULL,
    "exitAt" TIMESTAMP(3),
    "openedBySource" "AccessEventSource" NOT NULL,
    "closedBySource" "AccessEventSource",
    "entryDeviceId" TEXT,
    "exitDeviceId" TEXT,
    "inferenceFlags" JSONB,
    "legacyCheckInId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "presence_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "presence_sessions_legacyCheckInId_key" UNIQUE ("legacyCheckInId")
  )`,
];

const indexStatements = [
  `CREATE INDEX IF NOT EXISTS "access_devices_gym_status_idx" ON "access_devices"("gymId", "status")`,
  `CREATE INDEX IF NOT EXISTS "access_devices_gym_vendor_idx" ON "access_devices"("gymId", "vendorKey")`,
  `CREATE INDEX IF NOT EXISTS "access_bindings_gym_subject_idx" ON "access_credential_bindings"("gymId", "subjectType", "subjectId")`,
  `CREATE INDEX IF NOT EXISTS "access_bindings_student_idx" ON "access_credential_bindings"("studentId")`,
  `CREATE INDEX IF NOT EXISTS "access_bindings_personal_idx" ON "access_credential_bindings"("personalId")`,
  `CREATE INDEX IF NOT EXISTS "access_raw_events_gym_received_idx" ON "access_raw_events"("gymId", "receivedAt")`,
  `CREATE INDEX IF NOT EXISTS "access_raw_events_device_received_idx" ON "access_raw_events"("deviceId", "receivedAt")`,
  `CREATE INDEX IF NOT EXISTS "access_raw_events_provider_event_idx" ON "access_raw_events"("providerEventId")`,
  `CREATE INDEX IF NOT EXISTS "access_events_gym_occurred_idx" ON "access_events"("gymId", "occurredAt")`,
  `CREATE INDEX IF NOT EXISTS "access_events_gym_status_occurred_idx" ON "access_events"("gymId", "status", "occurredAt")`,
  `CREATE INDEX IF NOT EXISTS "access_events_student_occurred_idx" ON "access_events"("studentId", "occurredAt")`,
  `CREATE INDEX IF NOT EXISTS "access_events_personal_occurred_idx" ON "access_events"("personalId", "occurredAt")`,
  `CREATE INDEX IF NOT EXISTS "presence_sessions_gym_status_idx" ON "presence_sessions"("gymId", "status")`,
  `CREATE INDEX IF NOT EXISTS "presence_sessions_gym_subject_idx" ON "presence_sessions"("gymId", "subjectType", "subjectId")`,
  `CREATE INDEX IF NOT EXISTS "presence_sessions_student_status_idx" ON "presence_sessions"("studentId", "status")`,
  `CREATE INDEX IF NOT EXISTS "presence_sessions_personal_status_idx" ON "presence_sessions"("personalId", "status")`,
];

const foreignKeyStatements = [
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_devices_gymId_fkey') THEN
      ALTER TABLE "access_devices"
      ADD CONSTRAINT "access_devices_gymId_fkey"
      FOREIGN KEY ("gymId") REFERENCES "gyms"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_bindings_gymId_fkey') THEN
      ALTER TABLE "access_credential_bindings"
      ADD CONSTRAINT "access_bindings_gymId_fkey"
      FOREIGN KEY ("gymId") REFERENCES "gyms"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_bindings_studentId_fkey') THEN
      ALTER TABLE "access_credential_bindings"
      ADD CONSTRAINT "access_bindings_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "students"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_bindings_personalId_fkey') THEN
      ALTER TABLE "access_credential_bindings"
      ADD CONSTRAINT "access_bindings_personalId_fkey"
      FOREIGN KEY ("personalId") REFERENCES "personals"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_bindings_deviceId_fkey') THEN
      ALTER TABLE "access_credential_bindings"
      ADD CONSTRAINT "access_bindings_deviceId_fkey"
      FOREIGN KEY ("deviceId") REFERENCES "access_devices"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_raw_events_gymId_fkey') THEN
      ALTER TABLE "access_raw_events"
      ADD CONSTRAINT "access_raw_events_gymId_fkey"
      FOREIGN KEY ("gymId") REFERENCES "gyms"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_raw_events_deviceId_fkey') THEN
      ALTER TABLE "access_raw_events"
      ADD CONSTRAINT "access_raw_events_deviceId_fkey"
      FOREIGN KEY ("deviceId") REFERENCES "access_devices"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_events_gymId_fkey') THEN
      ALTER TABLE "access_events"
      ADD CONSTRAINT "access_events_gymId_fkey"
      FOREIGN KEY ("gymId") REFERENCES "gyms"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_events_deviceId_fkey') THEN
      ALTER TABLE "access_events"
      ADD CONSTRAINT "access_events_deviceId_fkey"
      FOREIGN KEY ("deviceId") REFERENCES "access_devices"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_events_rawEventId_fkey') THEN
      ALTER TABLE "access_events"
      ADD CONSTRAINT "access_events_rawEventId_fkey"
      FOREIGN KEY ("rawEventId") REFERENCES "access_raw_events"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_events_studentId_fkey') THEN
      ALTER TABLE "access_events"
      ADD CONSTRAINT "access_events_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "students"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_events_personalId_fkey') THEN
      ALTER TABLE "access_events"
      ADD CONSTRAINT "access_events_personalId_fkey"
      FOREIGN KEY ("personalId") REFERENCES "personals"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'presence_sessions_gymId_fkey') THEN
      ALTER TABLE "presence_sessions"
      ADD CONSTRAINT "presence_sessions_gymId_fkey"
      FOREIGN KEY ("gymId") REFERENCES "gyms"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'presence_sessions_studentId_fkey') THEN
      ALTER TABLE "presence_sessions"
      ADD CONSTRAINT "presence_sessions_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "students"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'presence_sessions_personalId_fkey') THEN
      ALTER TABLE "presence_sessions"
      ADD CONSTRAINT "presence_sessions_personalId_fkey"
      FOREIGN KEY ("personalId") REFERENCES "personals"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,
];

const backfillStatements = [
  `INSERT INTO "presence_sessions" (
    "id", "gymId", "subjectType", "subjectId", "studentId", "subjectName",
    "status", "entryAt", "exitAt", "openedBySource", "closedBySource",
    "legacyCheckInId", "createdAt", "updatedAt"
  )
  SELECT
    'legacy-session-' || c."id",
    c."gymId",
    'STUDENT'::"AccessSubjectType",
    c."studentId",
    c."studentId",
    c."studentName",
    CASE WHEN c."checkOut" IS NULL THEN 'open'::"PresenceSessionStatus" ELSE 'closed'::"PresenceSessionStatus" END,
    c."timestamp",
    c."checkOut",
    'legacy_import'::"AccessEventSource",
    CASE WHEN c."checkOut" IS NULL THEN NULL ELSE 'legacy_import'::"AccessEventSource" END,
    c."id",
    c."timestamp",
    COALESCE(c."checkOut", c."timestamp")
  FROM "check_ins" c
  INNER JOIN "students" s ON s."id" = c."studentId"
  WHERE NOT EXISTS (
    SELECT 1 FROM "presence_sessions" p WHERE p."legacyCheckInId" = c."id"
  )`,
  `INSERT INTO "access_events" (
    "id", "gymId", "subjectType", "subjectId", "studentId", "subjectName",
    "source", "status", "confidence", "providerKey", "providerEventId",
    "dedupeKey", "identifierType", "identifierValue", "directionReceived",
    "directionResolved", "occurredAt", "metadata", "legacyCheckInId",
    "createdAt", "updatedAt"
  )
  SELECT
    'legacy-entry-' || c."id",
    c."gymId",
    'STUDENT'::"AccessSubjectType",
    c."studentId",
    c."studentId",
    c."studentName",
    'legacy_import'::"AccessEventSource",
    'applied'::"AccessEventStatus",
    'legacy',
    'legacy_checkins',
    c."id",
    'legacy-entry:' || c."id",
    'legacy_checkin',
    c."studentId",
    'entry'::"AccessDirection",
    'entry'::"AccessDirection",
    c."timestamp",
    jsonb_build_object('legacy', true),
    c."id",
    c."timestamp",
    c."timestamp"
  FROM "check_ins" c
  INNER JOIN "students" s ON s."id" = c."studentId"
  WHERE NOT EXISTS (
    SELECT 1 FROM "access_events" e WHERE e."dedupeKey" = 'legacy-entry:' || c."id"
  )`,
  `INSERT INTO "access_events" (
    "id", "gymId", "subjectType", "subjectId", "studentId", "subjectName",
    "source", "status", "confidence", "providerKey", "providerEventId",
    "dedupeKey", "identifierType", "identifierValue", "directionReceived",
    "directionResolved", "occurredAt", "metadata", "createdAt", "updatedAt"
  )
  SELECT
    'legacy-exit-' || c."id",
    c."gymId",
    'STUDENT'::"AccessSubjectType",
    c."studentId",
    c."studentId",
    c."studentName",
    'legacy_import'::"AccessEventSource",
    'applied'::"AccessEventStatus",
    'legacy',
    'legacy_checkins',
    c."id" || '-exit',
    'legacy-exit:' || c."id",
    'legacy_checkout',
    c."studentId",
    'exit'::"AccessDirection",
    'exit'::"AccessDirection",
    c."checkOut",
    jsonb_build_object('legacy', true),
    c."checkOut",
    c."checkOut"
  FROM "check_ins" c
  INNER JOIN "students" s ON s."id" = c."studentId"
  WHERE c."checkOut" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM "access_events" e WHERE e."dedupeKey" = 'legacy-exit:' || c."id"
    )`,
];

async function runStatements(label, statements) {
  console.log(`\n[migration] ${label}`);
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

async function printValidation() {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name AS "tableName"
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'access_devices',
        'access_credential_bindings',
        'access_raw_events',
        'access_events',
        'presence_sessions'
      )
    ORDER BY table_name ASC
  `);

  const counts = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT COUNT(*) FROM "access_events")::int AS "accessEvents",
      (SELECT COUNT(*) FROM "presence_sessions")::int AS "presenceSessions",
      (SELECT COUNT(*) FROM "check_ins")::int AS "legacyCheckIns",
      (
        SELECT COUNT(*) FROM "check_ins" c
        LEFT JOIN "students" s ON s."id" = c."studentId"
        WHERE s."id" IS NULL
      )::int AS "skippedLegacyCheckIns"
  `);

  console.log("\n[migration] tabelas encontradas:");
  for (const table of tables) {
    console.log(`- ${table.tableName}`);
  }

  const snapshot = Array.isArray(counts) ? counts[0] : counts;
  console.log("\n[migration] contagens:");
  console.log(`- access_events: ${snapshot.accessEvents}`);
  console.log(`- presence_sessions: ${snapshot.presenceSessions}`);
  console.log(`- check_ins: ${snapshot.legacyCheckIns}`);
  console.log(`- check_ins pulados por aluno orfao: ${snapshot.skippedLegacyCheckIns}`);
}

async function applyMigration() {
  console.log("[migration] aplicando access presence...\n");
  await runStatements("garantindo enums", enumStatements);
  await runStatements("garantindo tabelas", tableStatements);
  await runStatements("garantindo indices", indexStatements);
  await runStatements("garantindo foreign keys", foreignKeyStatements);
  await runStatements("executando backfill legado", backfillStatements);
  await printValidation();
  console.log("\n[migration] access presence pronto");
}

if (require.main === module) {
  applyMigration()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("\n[migration] erro ao aplicar access presence:", error.message);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { applyMigration };
