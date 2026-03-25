/**
 * Migration: BoostCampaign para personal (gymId opcional, personalId) + tabela personal_student_payments
 *
 * Execute: node scripts/migration/apply-boost-personal-and-payments-migration.js
 * Depois: npx prisma generate
 *
 * Resumo:
 * - boost_campaigns: gymId passa a ser opcional, adiciona personalId
 * - personal_student_payments: nova tabela para pagamentos de assinatura do aluno ao personal
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
    console.log(
      "📦 Aplicando migration: BoostCampaign personal + personal_student_payments...\n",
    );

    // 1. boost_campaigns: tornar gymId opcional
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "boost_campaigns" ALTER COLUMN "gymId" DROP NOT NULL`,
      );
      console.log("✅ boost_campaigns.gymId passou a ser opcional");
    } catch (err) {
      if (
        err.message?.includes("does not exist") ||
        err.message?.includes("syntax")
      ) {
        throw err;
      }
      console.log(`⚠️  gymId já opcional ou erro: ${err.message}`);
    }

    // 2. boost_campaigns: adicionar coluna personalId
    await runSql(
      `ALTER TABLE "boost_campaigns" ADD COLUMN IF NOT EXISTS "personalId" TEXT`,
      "Coluna personalId adicionada em boost_campaigns",
    );

    // 3. boost_campaigns: adicionar FK para personals (se não existir)
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'boost_campaigns_personalId_fkey'
          ) THEN
            ALTER TABLE "boost_campaigns"
            ADD CONSTRAINT "boost_campaigns_personalId_fkey"
            FOREIGN KEY ("personalId") REFERENCES "personals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log("✅ FK boost_campaigns_personalId_fkey");
    } catch (err) {
      if (
        err.message?.includes("already exists") ||
        err.message?.includes("duplicate")
      ) {
        console.log("⚠️  FK personalId já existe");
      } else {
        throw err;
      }
    }

    // 4. boost_campaigns: índice em personalId
    await runSql(
      `CREATE INDEX IF NOT EXISTS "boost_campaigns_personalId_idx" ON "boost_campaigns"("personalId")`,
      "Índice boost_campaigns_personalId",
    );

    // 5. Criar tabela personal_student_payments
    await runSql(
      `CREATE TABLE IF NOT EXISTS "personal_student_payments" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "personalId" TEXT NOT NULL,
        "studentId" TEXT NOT NULL,
        "planId" TEXT NOT NULL,
        "assignmentId" TEXT,
        "amount" DOUBLE PRECISION NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "abacatePayBillingId" TEXT UNIQUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "personal_student_payments_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "personals"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "personal_student_payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "personal_student_payments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "personal_membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )`,
      "Tabela personal_student_payments criada",
    );

    await runSql(
      `CREATE INDEX IF NOT EXISTS "personal_student_payments_personalId_idx" ON "personal_student_payments"("personalId")`,
      "Índice personal_student_payments_personalId",
    );
    await runSql(
      `CREATE INDEX IF NOT EXISTS "personal_student_payments_studentId_idx" ON "personal_student_payments"("studentId")`,
      "Índice personal_student_payments_studentId",
    );

    console.log("\n✅ Migration aplicada com sucesso!");
    console.log("📝 Execute: npx prisma generate");
    console.log("\n📋 Resumo:");
    console.log("   - boost_campaigns: gymId opcional, personalId adicionado");
    console.log("   - personal_student_payments: nova tabela criada");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
