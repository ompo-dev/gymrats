/**
 * Migration: Adicionar tabela pro_gym_access e coluna pricePerPersonal
 *
 * Adiciona a tabela para logs de acessos de alunos PRO em academias Enterprise,
 * e a nova coluna opcional pricePerPersonal em gym_subscriptions.
 *
 * Execute: node scripts/migration/apply-pro-gym-access-migration.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function applyProGymAccessMigration() {
  console.log("🔄 Aplicando migration: Tabela pro_gym_access e coluna pricePerPersonal...\n");

  try {
    // 1. Adicionar `pricePerPersonal` (nullable) em `gym_subscriptions`
    const columnExistsResult = await prisma.$queryRawUnsafe(`
			SELECT EXISTS (
				SELECT FROM information_schema.columns
				WHERE table_schema = 'public'
				AND table_name = 'gym_subscriptions'
				AND column_name = 'pricePerPersonal'
			) as exists;
		`);

    const colExists = columnExistsResult[0]?.exists || false;

    if (colExists) {
      console.log("⚠️  Coluna 'pricePerPersonal' já existe em gym_subscriptions.");
    } else {
      await prisma.$executeRawUnsafe(`
			  ALTER TABLE "gym_subscriptions"
			  ADD COLUMN "pricePerPersonal" DOUBLE PRECISION;
		  `);
      console.log("✅ Coluna 'pricePerPersonal' adicionada com sucesso!");
    }

    // 2. Criar a nova tabela `pro_gym_access`
    const tableExistsResult = await prisma.$queryRawUnsafe(`
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public'
				AND table_name = 'pro_gym_access'
			) as exists;
		`);

    const tblExists = tableExistsResult[0]?.exists || false;

    if (tblExists) {
      console.log("⚠️  Tabela 'pro_gym_access' já existe.");
    } else {
      await prisma.$executeRawUnsafe(`
			CREATE TABLE "pro_gym_access" (
				"id" TEXT NOT NULL,
				"studentId" TEXT NOT NULL,
				"gymId" TEXT NOT NULL,
				"usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
				"type" TEXT NOT NULL DEFAULT 'check_in',
				"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

				CONSTRAINT "pro_gym_access_pkey" PRIMARY KEY ("id")
			);
		  `);

      // Add foreign keys
      await prisma.$executeRawUnsafe(`
			ALTER TABLE "pro_gym_access" ADD CONSTRAINT "pro_gym_access_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
		  `);

      await prisma.$executeRawUnsafe(`
			ALTER TABLE "pro_gym_access" ADD CONSTRAINT "pro_gym_access_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
		  `);

      // CREATE INDEXES
      await prisma.$executeRawUnsafe(`
			CREATE INDEX "pro_gym_access_studentId_idx" ON "pro_gym_access"("studentId");
		  `);

      await prisma.$executeRawUnsafe(`
			CREATE INDEX "pro_gym_access_gymId_idx" ON "pro_gym_access"("gymId");
		  `);

      console.log("✅ Tabela 'pro_gym_access' criada com sucesso!");
    }

    console.log("📝 Execute: npx prisma generate");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migration
if (require.main === module) {
  applyProGymAccessMigration()
    .then(() => {
      console.log("\n✅ Migration concluída!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erro na migration:", error);
      process.exit(1);
    });
}

module.exports = { applyProGymAccessMigration };
