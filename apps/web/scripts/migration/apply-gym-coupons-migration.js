/**
 * Script para aplicar migration de gym_coupons (cupons de academia) diretamente no banco
 * Execute: node scripts/migration/apply-gym-coupons-migration.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("📦 Aplicando migration de gym_coupons...\n");

    const commands = [
      // Criar tabela de gym_coupons
      `CREATE TABLE IF NOT EXISTS "gym_coupons" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "gymId" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "notes" TEXT,
        "discountType" TEXT NOT NULL,
        "discountValue" DOUBLE PRECISION NOT NULL,
        "maxUses" INTEGER NOT NULL DEFAULT -1,
        "currentUses" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "expiresAt" TIMESTAMP,
        "abacatePayId" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "gym_coupons_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS "gym_coupons_gymId_idx" ON "gym_coupons"("gymId")`,
      `CREATE INDEX IF NOT EXISTS "gym_coupons_code_idx" ON "gym_coupons"("code")`,
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

    console.log("\n✅ Migration de gym_coupons aplicada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
