const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyNutritionLibraryMigration() {
  console.log("[migration] Applying nutrition library migration...");

  try {
    console.log("1. Adding activeNutritionPlanId to students...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "students"
      ADD COLUMN IF NOT EXISTS "activeNutritionPlanId" TEXT;
    `);

    console.log("2. Creating nutrition_plans...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "nutrition_plans" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "studentId" TEXT NOT NULL,
        "title" TEXT NOT NULL DEFAULT 'Meu Plano Alimentar',
        "description" TEXT,
        "totalCalories" INTEGER NOT NULL DEFAULT 0,
        "targetProtein" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "targetCarbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "targetFats" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "isLibraryTemplate" BOOLEAN NOT NULL DEFAULT false,
        "createdById" TEXT,
        "creatorType" TEXT,
        "sourceLibraryPlanId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "nutrition_plans_studentId_fkey"
          FOREIGN KEY ("studentId")
          REFERENCES "students"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log("3. Creating nutrition_plan_meals...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "nutrition_plan_meals" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "nutritionPlanId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "calories" INTEGER NOT NULL DEFAULT 0,
        "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "fats" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "time" TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "nutrition_plan_meals_nutritionPlanId_fkey"
          FOREIGN KEY ("nutritionPlanId")
          REFERENCES "nutrition_plans"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log("4. Creating nutrition_plan_food_items...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "nutrition_plan_food_items" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "nutritionPlanMealId" TEXT NOT NULL,
        "foodId" TEXT,
        "foodName" TEXT NOT NULL,
        "servings" DOUBLE PRECISION NOT NULL DEFAULT 1,
        "calories" INTEGER NOT NULL DEFAULT 0,
        "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "fats" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "servingSize" TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "nutrition_plan_food_items_nutritionPlanMealId_fkey"
          FOREIGN KEY ("nutritionPlanMealId")
          REFERENCES "nutrition_plan_meals"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log("5. Adding sourceNutritionPlanId to daily_nutrition...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "daily_nutrition"
      ADD COLUMN IF NOT EXISTS "sourceNutritionPlanId" TEXT;
    `);

    console.log("6. Adding indexes and constraints...");
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "students_activeNutritionPlanId_key"
      ON "students"("activeNutritionPlanId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "nutrition_plans_studentId_idx"
      ON "nutrition_plans"("studentId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "nutrition_plan_meals_nutritionPlanId_idx"
      ON "nutrition_plan_meals"("nutritionPlanId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "nutrition_plan_food_items_nutritionPlanMealId_idx"
      ON "nutrition_plan_food_items"("nutritionPlanMealId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "daily_nutrition_sourceNutritionPlanId_idx"
      ON "daily_nutrition"("sourceNutritionPlanId");
    `);

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "students"
        ADD CONSTRAINT "students_activeNutritionPlanId_fkey"
        FOREIGN KEY ("activeNutritionPlanId")
        REFERENCES "nutrition_plans"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
      `);
    } catch (_error) {
      // constraint already exists
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "daily_nutrition"
        ADD CONSTRAINT "daily_nutrition_sourceNutritionPlanId_fkey"
        FOREIGN KEY ("sourceNutritionPlanId")
        REFERENCES "nutrition_plans"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
      `);
    } catch (_error) {
      // constraint already exists
    }

    console.log("[migration] Nutrition library migration completed successfully.");
    console.log("[migration] Run 'npx prisma generate' after applying migrations.");
  } catch (error) {
    console.error("[migration] Error applying nutrition library migration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyNutritionLibraryMigration();
