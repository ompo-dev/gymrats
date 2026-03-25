/**
 * Script para aplicar migration da entidade Personal (personal trainers)
 * Execute: node scripts/migration/apply-personal-entity-migration.js
 *
 * Esta migration:
 * 1. Adiciona PERSONAL ao enum UserRole
 * 2. Cria tabela personals (perfil 1:1 com User)
 * 3. Cria tabela personal_subscriptions
 * 4. Cria enum GymPersonalAffiliationStatus e tabela gym_personal_affiliations
 * 5. Cria enums StudentPersonalAssignedBy, StudentPersonalAssignmentStatus e tabela student_personal_assignments
 *
 * Após executar: npx prisma generate
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function runSql(cmd, description) {
  try {
    await prisma.$executeRawUnsafe(cmd);
    console.log(`✅ ${description}`);
    return true;
  } catch (err) {
    const msg = err.message || "";
    if (
      msg.includes("already exists") ||
      msg.includes("duplicate") ||
      msg.includes("IF NOT EXISTS")
    ) {
      console.log(`⚠️  ${description} (já existe, ignorado)`);
      return true;
    }
    throw err;
  }
}

async function applyMigration() {
  try {
    console.log("📦 Aplicando migration da entidade Personal...\n");

    // 1. Adicionar PERSONAL ao enum UserRole
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PERSONAL'`,
      );
      console.log("✅ PERSONAL adicionado ao enum UserRole");
    } catch (err) {
      if (
        err.message?.includes("syntax") ||
        err.message?.includes("IF NOT EXISTS")
      ) {
        try {
          await prisma.$executeRawUnsafe(
            `ALTER TYPE "UserRole" ADD VALUE 'PERSONAL'`,
          );
          console.log("✅ PERSONAL adicionado ao enum UserRole");
        } catch (e2) {
          if (
            e2.message?.includes("already exists") ||
            e2.message?.includes("duplicate")
          ) {
            console.log("⚠️  PERSONAL já existe no enum UserRole");
          } else throw e2;
        }
      } else if (
        err.message?.includes("already exists") ||
        err.message?.includes("duplicate")
      ) {
        console.log("⚠️  PERSONAL já existe no enum UserRole");
      } else {
        throw err;
      }
    }

    // 2. Criar tabela personals
    await runSql(
      `CREATE TABLE IF NOT EXISTS "personals" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "avatar" TEXT,
        "bio" TEXT,
        "address" TEXT,
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "atendimentoPresencial" BOOLEAN NOT NULL DEFAULT true,
        "atendimentoRemoto" BOOLEAN NOT NULL DEFAULT true,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "personals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      "Tabela personals criada",
    );

    await runSql(
      `CREATE INDEX IF NOT EXISTS "personals_userId_idx" ON "personals"("userId")`,
      "Índice personals_userId criado",
    );

    // 3. Criar enum e tabela personal_subscriptions
    await runSql(
      `DO $$ BEGIN CREATE TYPE "GymPersonalAffiliationStatus" AS ENUM ('active', 'canceled', 'pending'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      "Enum GymPersonalAffiliationStatus",
    );

    await runSql(
      `CREATE TABLE IF NOT EXISTS "personal_subscriptions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "personalId" TEXT NOT NULL UNIQUE,
        "plan" TEXT NOT NULL,
        "billingPeriod" TEXT NOT NULL DEFAULT 'monthly',
        "status" TEXT NOT NULL DEFAULT 'active',
        "basePrice" DOUBLE PRECISION NOT NULL,
        "effectivePrice" DOUBLE PRECISION,
        "discountPercent" INTEGER,
        "currentPeriodStart" TIMESTAMP(3) NOT NULL,
        "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
        "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
        "canceledAt" TIMESTAMP(3),
        "trialStart" TIMESTAMP(3),
        "trialEnd" TIMESTAMP(3),
        "abacatePayBillingId" TEXT UNIQUE,
        "abacatePayCustomerId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "personal_subscriptions_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "personals" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      "Tabela personal_subscriptions criada",
    );

    // 4. Criar enums e tabela gym_personal_affiliations
    await runSql(
      `DO $$ BEGIN CREATE TYPE "StudentPersonalAssignedBy" AS ENUM ('GYM', 'PERSONAL'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      "Enum StudentPersonalAssignedBy",
    );
    await runSql(
      `DO $$ BEGIN CREATE TYPE "StudentPersonalAssignmentStatus" AS ENUM ('active', 'removed'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      "Enum StudentPersonalAssignmentStatus",
    );

    await runSql(
      `CREATE TABLE IF NOT EXISTS "gym_personal_affiliations" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "personalId" TEXT NOT NULL,
        "gymId" TEXT NOT NULL,
        "status" "GymPersonalAffiliationStatus" NOT NULL DEFAULT 'active',
        "discountPercent" INTEGER,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "gym_personal_affiliations_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "personals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "gym_personal_affiliations_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "gym_personal_affiliations_personalId_gymId_key" UNIQUE ("personalId", "gymId")
      )`,
      "Tabela gym_personal_affiliations criada",
    );

    await runSql(
      `CREATE INDEX IF NOT EXISTS "gym_personal_affiliations_gymId_idx" ON "gym_personal_affiliations"("gymId")`,
      "Índice gym_personal_affiliations_gymId",
    );
    await runSql(
      `CREATE INDEX IF NOT EXISTS "gym_personal_affiliations_personalId_idx" ON "gym_personal_affiliations"("personalId")`,
      "Índice gym_personal_affiliations_personalId",
    );

    // 5. Criar tabela student_personal_assignments
    await runSql(
      `CREATE TABLE IF NOT EXISTS "student_personal_assignments" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "studentId" TEXT NOT NULL,
        "personalId" TEXT NOT NULL,
        "gymId" TEXT,
        "assignedBy" "StudentPersonalAssignedBy" NOT NULL,
        "status" "StudentPersonalAssignmentStatus" NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "student_personal_assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "student_personal_assignments_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "personals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "student_personal_assignments_studentId_personalId_key" UNIQUE ("studentId", "personalId")
      )`,
      "Tabela student_personal_assignments criada",
    );

    await runSql(
      `CREATE INDEX IF NOT EXISTS "student_personal_assignments_studentId_idx" ON "student_personal_assignments"("studentId")`,
      "Índice student_personal_assignments_studentId",
    );
    await runSql(
      `CREATE INDEX IF NOT EXISTS "student_personal_assignments_personalId_idx" ON "student_personal_assignments"("personalId")`,
      "Índice student_personal_assignments_personalId",
    );
    await runSql(
      `CREATE INDEX IF NOT EXISTS "student_personal_assignments_gymId_idx" ON "student_personal_assignments"("gymId")`,
      "Índice student_personal_assignments_gymId",
    );

    console.log("\n✅ Migration da entidade Personal aplicada com sucesso!");
    console.log("📝 Execute: npx prisma generate");
    console.log("\n📋 Resumo:");
    console.log("   - Role PERSONAL no UserRole");
    console.log(
      "   - Tabelas: personals, personal_subscriptions, gym_personal_affiliations, student_personal_assignments",
    );
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
