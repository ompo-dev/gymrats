const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("📦 Aplicando migration de tipo de workout...\n");

    const commands = [
      `ALTER TABLE "workouts" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'strength'`,
      `UPDATE "workouts" SET "type" = 'cardio' WHERE "muscleGroup" = 'cardio'`,
      `UPDATE "workouts" SET "type" = 'flexibility' WHERE "muscleGroup" = 'funcional'`,
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
          (error.message.includes("column") &&
            error.message.includes("already exists"))
        ) {
          console.log(
            `⚠️  Comando ${i + 1}/${commands.length} ignorado (já existe)`
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
    console.log("   - Campo type adicionado na tabela workouts");
    console.log("   - Workouts existentes atualizados com tipo correto");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
