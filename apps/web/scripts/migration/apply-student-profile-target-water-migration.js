/**
 * Migration: adicionar coluna targetWater em student_profiles (meta diária de água).
 * Execute: node scripts/migration/apply-student-profile-target-water-migration.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log(
      "📦 Aplicando migration: coluna targetWater em student_profiles...\n",
    );

    const commands = [
      `ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "targetWater" INTEGER`,
      `UPDATE "student_profiles" SET "targetWater" = 3000 WHERE "targetWater" IS NULL`,
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
            `⚠️  Coluna "targetWater" já existe em student_profiles. Nada a fazer.`,
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
      "\n📋 Resumo: coluna targetWater adicionada em student_profiles (default lógico 3000ml).",
    );
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
