/**
 * Script para aplicar migration de chave PIX da academia e withdraws
 * Execute: node scripts/migration/apply-gym-pix-withdraw-migration.js
 *
 * Adiciona:
 * - gyms: pixKey, pixKeyType (para receber withdraws dos pagamentos dos alunos)
 * - payments: abacatePayBillingId, withdrawnAt, withdrawId
 * - gym_withdraws: tabela de saques para academias
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log(
      "📦 Aplicando migration de chave PIX e withdraws para academias...\n",
    );

    const commands = [
      // 1. Adicionar campos de chave PIX em gyms
      `ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "pixKey" TEXT`,
      `ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "pixKeyType" TEXT`,

      // 2. Adicionar campos AbacatePay/withdraw em payments
      `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "abacatePayBillingId" TEXT`,
      `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "withdrawnAt" TIMESTAMP`,
      `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "withdrawId" TEXT`,

      // 3. Criar índice único em abacatePayBillingId (permite múltiplos NULL)
      `CREATE UNIQUE INDEX IF NOT EXISTS "payments_abacatePayBillingId_key" ON "payments"("abacatePayBillingId")`,

      // 4. Criar tabela gym_withdraws
      `CREATE TABLE IF NOT EXISTS "gym_withdraws" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "gymId" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "pixKey" TEXT NOT NULL,
        "pixKeyType" TEXT NOT NULL,
        "externalId" TEXT NOT NULL UNIQUE,
        "abacateId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "paymentIds" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completedAt" TIMESTAMP,
        CONSTRAINT "gym_withdraws_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,

      // 5. Criar índices em gym_withdraws
      `CREATE INDEX IF NOT EXISTS "gym_withdraws_gymId_idx" ON "gym_withdraws"("gymId")`,
      `CREATE INDEX IF NOT EXISTS "gym_withdraws_status_idx" ON "gym_withdraws"("status")`,
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
          error.message.includes("does not exist") ||
          (error.message.includes("column") &&
            error.message.includes("already exists")) ||
          (error.message.includes("table") &&
            error.message.includes("already exists")) ||
          (error.message.includes("relation") &&
            error.message.includes("already exists"))
        ) {
          console.log(
            `⚠️  Comando ${i + 1}/${commands.length} ignorado (já existe ou não necessário)`,
          );
        } else {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log("\n✅ Migration aplicada com sucesso!");
    console.log("📝 Execute: npx prisma generate");
    console.log("\n📋 Resumo das mudanças:");
    console.log("   - Campos pixKey e pixKeyType adicionados em gyms");
    console.log(
      "   - Campos abacatePayBillingId, withdrawnAt, withdrawId adicionados em payments",
    );
    console.log("   - Tabela gym_withdraws criada");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
