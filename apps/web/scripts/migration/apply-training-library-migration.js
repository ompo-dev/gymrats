const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyTrainingLibraryMigration() {
  console.log("📚 Aplicando migração da Training Library...");

  try {
    // 1. Adicionar novas colunas na tabela weekly_plans
    console.log("1. Adicionando colunas de library no weekly_plans...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "weekly_plans" 
      ADD COLUMN IF NOT EXISTS "isLibraryTemplate" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "createdById" TEXT,
      ADD COLUMN IF NOT EXISTS "creatorType" TEXT,
      ADD COLUMN IF NOT EXISTS "sourceLibraryPlanId" TEXT;
    `);

    // 2. Adicionar activeWeeklyPlanId na tabela students
    console.log("2. Adicionando activeWeeklyPlanId na tabela students...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "students"
      ADD COLUMN IF NOT EXISTS "activeWeeklyPlanId" TEXT;
    `);

    // 3. Remover index unico antigo do studentId
    console.log(
      "3. Removendo a constraint UNIQUE do studentId no weekly_plans...",
    );
    try {
      await prisma.$executeRawUnsafe(`
        DROP INDEX IF EXISTS "weekly_plans_studentId_key";
      `);
    } catch (_e) {
      console.log("   (Aviso): Index único já removido ou não existe.");
    }

    // 4. Migrar os dados existentes:
    // Para todos os WeeklyPlans existentes que o Estudante ainda não vinculou como Ativo, vincular agora e desmarcar template.
    console.log("4. Migrando planos ativos (1:1 -> Library + Ativo)...");

    // Esse update cruza as duas tabelas: atualiza student onde activeWeeklyPlanId esta nulo
    await prisma.$executeRawUnsafe(`
      UPDATE "students" 
      SET "activeWeeklyPlanId" = "weekly_plans"."id"
      FROM "weekly_plans"
      WHERE "students"."id" = "weekly_plans"."studentId"
        AND "students"."activeWeeklyPlanId" IS NULL;
    `);

    // Criar UNIQUE INDEX no activeWeeklyPlanId para garantir 1:1 rigoroso
    console.log("5. Criando constraint UNIQUE do activeWeeklyPlanId...");
    try {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "students_activeWeeklyPlanId_key" ON "students"("activeWeeklyPlanId");
      `);
    } catch (_e) {
      console.log("   (Aviso): Index já existe.");
    }

    // Criar INDEX no studentId para performance de busca na Library das plans
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "weekly_plans_studentId_idx" ON "weekly_plans"("studentId");
      `);
    } catch (_e) {
      console.log("   (Aviso): Index já existe.");
    }

    // Ligar FK para garantir integridade. Pode falhar se já houver. O prisma DB push fará o resto.
    try {
      await prisma.$executeRawUnsafe(`
          ALTER TABLE "students" ADD CONSTRAINT "students_activeWeeklyPlanId_fkey" 
          FOREIGN KEY ("activeWeeklyPlanId") REFERENCES "weekly_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        `);
    } catch (_e) {
      // ignora
    }

    console.log("✅ Migração da Training Library concluída com sucesso!");
    console.log("⚠️ Rode 'npx prisma generate' após aplicar as migrações.\n");
  } catch (error) {
    console.error("❌ Erro ao rodar migração:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyTrainingLibraryMigration();
