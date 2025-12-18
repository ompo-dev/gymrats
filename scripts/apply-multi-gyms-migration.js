/**
 * Script para aplicar migration de múltiplas academias por usuário
 * Execute: node scripts/apply-multi-gyms-migration.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("📦 Aplicando migration de múltiplas academias...\n");

    const commands = [
      // 1. Adicionar coluna isActive na tabela gyms
      `ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true`,

      // 2. Adicionar coluna activeGymId na tabela users
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "activeGymId" TEXT`,

      // 3. Popular activeGymId com o gym atual de cada usuário
      `UPDATE "users" SET "activeGymId" = (
        SELECT "id" FROM "gyms" WHERE "gyms"."userId" = "users"."id" LIMIT 1
      ) WHERE EXISTS (
        SELECT 1 FROM "gyms" WHERE "gyms"."userId" = "users"."id"
      )`,

      // 4. Remover constraint UNIQUE de userId em gyms (se existir)
      `DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'gyms_userId_key'
        ) THEN
          ALTER TABLE "gyms" DROP CONSTRAINT "gyms_userId_key";
        END IF;
      END $$`,

      // 5. Criar índice no userId para melhor performance
      `CREATE INDEX IF NOT EXISTS "gyms_userId_idx" ON "gyms"("userId")`,

      // 6. Criar tabela de preferências do usuário para academias
      `CREATE TABLE IF NOT EXISTS "gym_user_preferences" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "lastActiveGymId" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "gym_user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,

      // 7. Popular tabela de preferências com dados existentes
      `INSERT INTO "gym_user_preferences" ("id", "userId", "lastActiveGymId", "createdAt", "updatedAt")
      SELECT 
        'pref_' || "id",
        "id",
        "activeGymId",
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM "users"
      WHERE "role" = 'GYM' OR EXISTS (SELECT 1 FROM "gyms" WHERE "gyms"."userId" = "users"."id")
      ON CONFLICT ("userId") DO NOTHING`,
    ];

    console.log(`Executando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      try {
        await prisma.$executeRawUnsafe(commands[i]);
        console.log(
          `✅ Comando ${i + 1}/${commands.length} executado com sucesso`
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
            `⚠️  Comando ${i + 1}/${
              commands.length
            } ignorado (já existe ou não necessário)`
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
    console.log("   - Usuários GYM agora podem ter múltiplas academias");
    console.log(
      "   - Campo isActive adicionado para controlar academias ativas"
    );
    console.log(
      "   - Campo activeGymId adicionado para rastrear academia selecionada"
    );
    console.log("   - Tabela gym_user_preferences criada para preferências");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
