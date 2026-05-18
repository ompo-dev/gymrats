/**
 * Migration operacional RES-002: hardening do secretHash de access_devices.
 *
 * Execute:
 * - npm run migration:apply -- --script=apply-access-device-secret-hash-hardening-migration.js
 * - node apps/web/scripts/migration/apply-access-device-secret-hash-hardening-migration.js
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
    throw new Error("DATABASE_URL ou DIRECT_URL nao configurado para a migration.");
  }
}

ensureDatabaseEnv();

const prisma = new PrismaClient();

async function applyMigration() {
  console.log("[migration] aplicando hardening de access_devices.secretHash...");

  await prisma.$executeRawUnsafe(`
    UPDATE "access_devices"
    SET "secretHash" = md5(random()::text || clock_timestamp()::text || "id")
    WHERE "secretHash" IS NULL OR btrim("secretHash") = ''
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "access_devices"
    ALTER COLUMN "secretHash" SET NOT NULL
  `);

  const rows = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS "withoutSecret"
    FROM "access_devices"
    WHERE "secretHash" IS NULL OR btrim("secretHash") = ''
  `);

  const withoutSecret = Array.isArray(rows)
    ? (rows[0]?.withoutSecret ?? 0)
    : (rows?.withoutSecret ?? 0);

  console.log(`[migration] access_devices sem secretHash apos hardening: ${withoutSecret}`);
  console.log("[migration] hardening de access_devices.secretHash concluido");
}

if (require.main === module) {
  applyMigration()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("[migration] erro ao aplicar hardening de secretHash:", error.message);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { applyMigration };