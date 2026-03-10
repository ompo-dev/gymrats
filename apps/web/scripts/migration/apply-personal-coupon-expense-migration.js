/**
 * Migration: criar tabelas personal_coupons e personal_expenses para área financeira do personal.
 * Execute: node scripts/migration/apply-personal-coupon-expense-migration.js
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
    console.log(
      "📦 Aplicando migration: personal_coupons e personal_expenses...\n",
    );

    // 1. Criar tabela personal_coupons
    await runSql(
      `CREATE TABLE IF NOT EXISTS "personal_coupons" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "personalId" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "notes" TEXT,
        "discountType" TEXT NOT NULL,
        "discountValue" DOUBLE PRECISION NOT NULL,
        "maxUses" INTEGER NOT NULL DEFAULT -1,
        "currentUses" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "personal_coupons_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "personals" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      "Tabela personal_coupons criada",
    );

    await runSql(
      `CREATE INDEX IF NOT EXISTS "personal_coupons_personalId_idx" ON "personal_coupons"("personalId")`,
      "Índice personal_coupons_personalId",
    );

    await runSql(
      `CREATE INDEX IF NOT EXISTS "personal_coupons_code_idx" ON "personal_coupons"("code")`,
      "Índice personal_coupons_code",
    );

    // 2. Criar tabela personal_expenses
    await runSql(
      `CREATE TABLE IF NOT EXISTS "personal_expenses" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "personalId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "description" TEXT,
        "amount" DOUBLE PRECISION NOT NULL,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "category" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "personal_expenses_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "personals" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      "Tabela personal_expenses criada",
    );

    await runSql(
      `CREATE INDEX IF NOT EXISTS "personal_expenses_personalId_idx" ON "personal_expenses"("personalId")`,
      "Índice personal_expenses_personalId",
    );

    console.log("\n✅ Migration aplicada com sucesso!");
    console.log("📝 Execute: npx prisma generate");
    console.log("\n📋 Resumo:");
    console.log("   - Tabela personal_coupons (cupons do personal)");
    console.log("   - Tabela personal_expenses (despesas do personal)");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
