/**
 * Migration: adicionar coluna radiusKm em boost_campaigns (alcance em km para anúncios por localização).
 * Execute: node scripts/migration/apply-boost-campaign-radius-km-migration.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log(
      "📦 Aplicando migration: coluna radiusKm em boost_campaigns...\n",
    );

    const commands = [
      `ALTER TABLE "boost_campaigns" ADD COLUMN IF NOT EXISTS "radiusKm" INTEGER NOT NULL DEFAULT 5`,
    ];

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
          (error.message.includes("column") &&
            error.message.includes("already exists"))
        ) {
          console.log(
            `⚠️  Coluna "radiusKm" já existe em boost_campaigns. Nada a fazer.`,
          );
        } else {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log("\n✅ Migration aplicada com sucesso!");
    console.log("📝 Execute: npx prisma generate");
    console.log(
      "\n📋 Resumo: coluna radiusKm (default 5 km) adicionada em boost_campaigns.",
    );
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
