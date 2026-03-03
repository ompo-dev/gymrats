/**
 * Migration: Adicionar coluna billingPeriod na tabela subscriptions (Student)
 * 
 * Execute: node scripts/migration/apply-subscription-billing-period-migration.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function applyMigration() {
  console.log("🔄 Aplicando migration: Coluna billingPeriod na tabela subscriptions...\n");

  try {
    const columnExistsResult = await prisma.$queryRawUnsafe(`
			SELECT EXISTS (
				SELECT FROM information_schema.columns
				WHERE table_schema = 'public'
				AND table_name = 'subscriptions'
				AND column_name = 'billingPeriod'
			) as exists;
		`);

    const colExists = columnExistsResult[0]?.exists || false;

    if (colExists) {
      console.log("⚠️  Coluna 'billingPeriod' já existe em subscriptions.");
    } else {
      await prisma.$executeRawUnsafe(`
			  ALTER TABLE "subscriptions"
			  ADD COLUMN "billingPeriod" TEXT NOT NULL DEFAULT 'monthly';
		  `);
      console.log("✅ Coluna 'billingPeriod' adicionada com sucesso!");
    }

    console.log("📝 Execute: npx prisma generate");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  applyMigration()
    .then(() => {
      console.log("\n✅ Migration concluída!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erro na migration:", error);
      process.exit(1);
    });
}

module.exports = { applyMigration };
