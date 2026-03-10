/**
 * Script para aplicar migration de boost campaigns (Anúncios/Impulsionamento) diretamente no banco
 * Execute: node scripts/migration/apply-boost-campaign-migration.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("📦 Aplicando migration de boost campaigns...\n");

    const commands = [
      // Criar tabela de boost_campaigns
      `CREATE TABLE IF NOT EXISTS "boost_campaigns" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "gymId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "primaryColor" TEXT NOT NULL DEFAULT '#E2FF38',
        "durationHours" INTEGER NOT NULL,
        "amountCents" INTEGER NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending_payment',
        "clicks" INTEGER NOT NULL DEFAULT 0,
        "impressions" INTEGER NOT NULL DEFAULT 0,
        "linkedCouponId" TEXT,
        "linkedPlanId" TEXT,
        "abacatePayBillingId" TEXT UNIQUE,
        "startsAt" TIMESTAMP,
        "endsAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "boost_campaigns_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,

      // Criar índices
      `CREATE INDEX IF NOT EXISTS "boost_campaigns_gymId_idx" ON "boost_campaigns"("gymId")`,
      `CREATE INDEX IF NOT EXISTS "boost_campaigns_status_idx" ON "boost_campaigns"("status")`,
    ];

    console.log(`Executando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      try {
        await prisma.$executeRawUnsafe(commands[i]);
        console.log(
          `✅ Comando ${i + 1}/${commands.length} executado com sucesso`,
        );
      } catch (error) {
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("UNIQUE constraint") ||
          (error.message.includes("relation") &&
            error.message.includes("already exists"))
        ) {
          console.log(
            `⚠️  Comando ${i + 1}/${commands.length} ignorado (já existe)`,
          );
        } else {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log("\n✅ Migration aplicada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
