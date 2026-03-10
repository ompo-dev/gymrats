/**
 * Script para aplicar migration de histórico de peso
 * Execute: node scripts/apply-weight-history-migration.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("📦 Aplicando migration de histórico de peso...\n");

    const commands = [
      // 1. Criar tabela de histórico de peso
      `CREATE TABLE IF NOT EXISTS "weight_history" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "studentId" TEXT NOT NULL,
        "weight" REAL NOT NULL,
        "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "notes" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "weight_history_studentId_fkey" 
          FOREIGN KEY ("studentId") 
          REFERENCES "students" ("id") 
          ON DELETE CASCADE ON UPDATE CASCADE
      )`,

      // 2. Criar índices para melhor performance
      `CREATE INDEX IF NOT EXISTS "weight_history_studentId_date_idx" 
       ON "weight_history"("studentId", "date")`,
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
          (error.message.includes("table") &&
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
    console.log("   - Tabela weight_history criada");
    console.log("   - Índices criados para melhor performance");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
