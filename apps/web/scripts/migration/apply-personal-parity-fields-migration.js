/**
 * Script para adicionar colunas CREF, pixKey e a tabela personal_membership_plans.
 *
 * Execute: node scripts/migration/apply-personal-parity-fields-migration.js
 * Depois: npx prisma generate
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log(
      "📦 Aplicando migration de paridade pro Personal (Personals table + Plans)...\n",
    );

    const commands = [
      `ALTER TABLE "personals" ADD COLUMN IF NOT EXISTS "cref" TEXT UNIQUE`,
      `ALTER TABLE "personals" ADD COLUMN IF NOT EXISTS "pixKey" TEXT`,
      `ALTER TABLE "personals" ADD COLUMN IF NOT EXISTS "pixKeyType" TEXT`,
      `CREATE TABLE IF NOT EXISTS "personal_membership_plans" (
          "id" TEXT NOT NULL,
          "personalId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "type" TEXT NOT NULL,
          "price" DOUBLE PRECISION NOT NULL,
          "duration" INTEGER NOT NULL,
          "benefits" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "personal_membership_plans_pkey" PRIMARY KEY ("id")
      )`,
      `ALTER TABLE "personal_membership_plans" DROP CONSTRAINT IF EXISTS "personal_membership_plans_personalId_fkey"`,
      `ALTER TABLE "personal_membership_plans" ADD CONSTRAINT "personal_membership_plans_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "personals"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    ];

    console.log(`Executando ${commands.length} comando(s) SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      try {
        await prisma.$executeRawUnsafe(commands[i]);
        console.log(
          `✅ Comando ${i + 1}/${commands.length} executado com sucesso`,
        );
      } catch (error) {
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate")
        ) {
          console.log(
            `⚠️  Comando ${i + 1}/${commands.length} ignorado (tabela/coluna já existe)`,
          );
        } else {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log("\n✅ Migration aplicada com sucesso!");
    console.log("📝 Em seguida, execute: npx prisma generate");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
