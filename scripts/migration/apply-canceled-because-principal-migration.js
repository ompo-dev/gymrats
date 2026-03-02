/**
 * Script para adicionar coluna canceledBecausePrincipalCanceled na tabela gym_subscriptions.
 * Quando a academia principal cancela, as demais são marcadas com esta flag; ao reassinar a principal,
 * as outras são restauradas (se o período não tiver expirado).
 *
 * Execute: node scripts/migration/apply-canceled-because-principal-migration.js
 * Depois: npx prisma generate
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log(
      "📦 Aplicando migration canceledBecausePrincipalCanceled (gym_subscriptions)...\n",
    );

    const commands = [
      `ALTER TABLE "gym_subscriptions" ADD COLUMN IF NOT EXISTS "canceledBecausePrincipalCanceled" BOOLEAN`,
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
            `⚠️  Comando ${i + 1}/${commands.length} ignorado (coluna já existe)`,
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
