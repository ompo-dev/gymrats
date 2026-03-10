/**
 * Adiciona a coluna sourceLibraryPlanId na tabela weekly_plans.
 * Usada para identificar qual plano da biblioteca está "EM USO" (plano ativo clonado).
 *
 * Uso: node scripts/migration/apply-source-library-plan-id-migration.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applySourceLibraryPlanIdMigration() {
  console.log("📚 Adicionando coluna sourceLibraryPlanId em weekly_plans...");

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "weekly_plans" 
      ADD COLUMN IF NOT EXISTS "sourceLibraryPlanId" TEXT;
    `);

    console.log("✅ Coluna sourceLibraryPlanId adicionada com sucesso!");
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applySourceLibraryPlanIdMigration();
