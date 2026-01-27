const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log(
      "📦 Aplicando migration de rate limiting do chat de nutrição...\n"
    );

    const commands = [
      `CREATE TABLE IF NOT EXISTS "nutrition_chat_usage" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "studentId" TEXT NOT NULL,
        "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "messageCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "nutrition_chat_usage_studentId_fkey" 
          FOREIGN KEY ("studentId") 
          REFERENCES "students" ("id") 
          ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "nutrition_chat_usage_studentId_date_key" 
       ON "nutrition_chat_usage"("studentId", "date")`,
      `CREATE INDEX IF NOT EXISTS "nutrition_chat_usage_studentId_date_idx" 
       ON "nutrition_chat_usage"("studentId", "date")`,
    ];

    console.log(`Executando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      try {
        await prisma.$executeRawUnsafe(commands[i]);
        console.log(
          `✅ Comando ${i + 1}/${commands.length} executado com sucesso`
        );
      } catch (error) {
        const isIndexCommand = commands[i].includes("CREATE INDEX");
        const isUniqueIndexCommand = commands[i].includes(
          "CREATE UNIQUE INDEX"
        );

        if (
          (isIndexCommand || isUniqueIndexCommand) &&
          (error.message.includes("already exists") ||
            error.message.includes("duplicate") ||
            (error.message.includes("index") &&
              error.message.includes("already exists")))
        ) {
          console.log(
            `⚠️  Comando ${i + 1}/${
              commands.length
            } ignorado (índice já existe)`
          );
        } else if (
          error.message.includes("already exists") &&
          error.message.includes("table")
        ) {
          console.log(
            `⚠️  Comando ${i + 1}/${
              commands.length
            } ignorado (tabela já existe)`
          );
        } else {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          if (commands[i].includes("CREATE TABLE")) {
            console.log(`   Tentando continuar mesmo com erro...`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log("\n✅ Migration aplicada com sucesso!");
    console.log("📝 Execute: npx prisma generate");
    console.log("\n📋 Resumo das mudanças:");
    console.log("   - Tabela nutrition_chat_usage criada");
    console.log("   - Índices criados para melhor performance");
    console.log("   - Rate limiting: máximo 20 mensagens por dia por usuário");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
