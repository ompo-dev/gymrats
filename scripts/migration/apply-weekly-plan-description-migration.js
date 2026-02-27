/**
 * Migration: Adicionar coluna description em weekly_plans
 *
 * Adiciona o campo description (opcional) para subtítulo editável do plano semanal.
 * Ex: "7 dias • Segunda a Domingo" ou texto customizado pelo usuário.
 *
 * Execute: node scripts/migration/apply-weekly-plan-description-migration.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function applyWeeklyPlanDescriptionMigration() {
	console.log("🔄 Aplicando migration: description em weekly_plans...\n");

	try {
		// Verificar se a coluna já existe
		const columnExistsResult = await prisma.$queryRawUnsafe(`
			SELECT EXISTS (
				SELECT FROM information_schema.columns
				WHERE table_schema = 'public'
				AND table_name = 'weekly_plans'
				AND column_name = 'description'
			) as exists;
		`);

		const exists = columnExistsResult[0]?.exists || false;

		if (exists) {
			console.log("⚠️  Coluna 'description' já existe em weekly_plans. Nada a fazer.");
			return;
		}

		// Adicionar coluna description (nullable)
		await prisma.$executeRawUnsafe(`
			ALTER TABLE "weekly_plans"
			ADD COLUMN "description" TEXT;
		`);

		console.log("✅ Coluna 'description' adicionada com sucesso!");
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
	applyWeeklyPlanDescriptionMigration()
		.then(() => {
			console.log("\n✅ Migration concluída!");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Erro na migration:", error);
			process.exit(1);
		});
}

module.exports = { applyWeeklyPlanDescriptionMigration };
