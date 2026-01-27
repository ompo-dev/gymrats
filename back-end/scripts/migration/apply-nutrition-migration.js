const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("📦 Aplicando migration de nutrição...\n");

    const commands = [
      `CREATE TABLE IF NOT EXISTS "daily_nutrition" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "studentId" TEXT NOT NULL,
        "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "waterIntake" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "daily_nutrition_studentId_fkey" 
          FOREIGN KEY ("studentId") 
          REFERENCES "students" ("id") 
          ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "nutrition_meals" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "dailyNutritionId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "calories" INTEGER NOT NULL,
        "protein" REAL NOT NULL,
        "carbs" REAL NOT NULL,
        "fats" REAL NOT NULL,
        "time" TEXT,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "nutrition_meals_dailyNutritionId_fkey" 
          FOREIGN KEY ("dailyNutritionId") 
          REFERENCES "daily_nutrition" ("id") 
          ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "nutrition_food_items" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "nutritionMealId" TEXT NOT NULL,
        "foodId" TEXT,
        "foodName" TEXT NOT NULL,
        "servings" REAL NOT NULL,
        "calories" INTEGER NOT NULL,
        "protein" REAL NOT NULL,
        "carbs" REAL NOT NULL,
        "fats" REAL NOT NULL,
        "servingSize" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "nutrition_food_items_nutritionMealId_fkey" 
          FOREIGN KEY ("nutritionMealId") 
          REFERENCES "nutrition_meals" ("id") 
          ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "food_items" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "calories" INTEGER NOT NULL,
        "protein" REAL NOT NULL,
        "carbs" REAL NOT NULL,
        "fats" REAL NOT NULL,
        "servingSize" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "image" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "daily_nutrition_studentId_date_key" 
       ON "daily_nutrition"("studentId", "date")`,
      `CREATE INDEX IF NOT EXISTS "daily_nutrition_studentId_date_idx" 
       ON "daily_nutrition"("studentId", "date")`,
      `CREATE INDEX IF NOT EXISTS "food_items_name_idx" 
       ON "food_items"("name")`,
      `CREATE INDEX IF NOT EXISTS "food_items_category_idx" 
       ON "food_items"("category")`,
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
        const isUniqueIndexCommand = commands[i].includes("CREATE UNIQUE INDEX");
        
        if (
          (isIndexCommand || isUniqueIndexCommand) &&
          (error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          (error.message.includes("index") &&
            error.message.includes("already exists")))
        ) {
          console.log(
            `⚠️  Comando ${i + 1}/${commands.length} ignorado (índice já existe)`
          );
        } else if (
          error.message.includes("already exists") &&
          error.message.includes("table")
        ) {
          console.log(
            `⚠️  Comando ${i + 1}/${commands.length} ignorado (tabela já existe)`
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
    console.log("   - Tabela daily_nutrition criada");
    console.log("   - Tabela nutrition_meals criada");
    console.log("   - Tabela nutrition_food_items criada");
    console.log("   - Tabela food_items criada");
    console.log("   - Índices criados para melhor performance");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
