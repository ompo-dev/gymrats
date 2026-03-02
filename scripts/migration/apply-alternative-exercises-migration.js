/**
 * Script para aplicar migration de exercícios alternativos
 * Execute: node scripts/apply-alternative-exercises-migration.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("📦 Aplicando migration de exercícios alternativos...\n");

    const commands = [
      // 1. Adicionar coluna educationalId na tabela workout_exercises
      `ALTER TABLE "workout_exercises" ADD COLUMN IF NOT EXISTS "educationalId" TEXT`,

      // 2. Criar tabela de exercícios alternativos
      `CREATE TABLE IF NOT EXISTS "alternative_exercises" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "workoutExerciseId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "reason" TEXT NOT NULL,
        "educationalId" TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "alternative_exercises_workoutExerciseId_fkey" 
          FOREIGN KEY ("workoutExerciseId") 
          REFERENCES "workout_exercises" ("id") 
          ON DELETE CASCADE ON UPDATE CASCADE
      )`,

      // 3. Criar índice para melhor performance
      `CREATE INDEX IF NOT EXISTS "alternative_exercises_workoutExerciseId_idx" 
       ON "alternative_exercises"("workoutExerciseId")`,
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
    console.log("   - Campo educationalId adicionado em workout_exercises");
    console.log("   - Tabela alternative_exercises criada");
    console.log("   - Índices criados para melhor performance");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
