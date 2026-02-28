/**
 * Script para adicionar coluna ownPeriodEndBackup na tabela subscriptions.
 * Usada para guardar o fim do período OWN quando o aluno recebe Premium via GYM_ENTERPRISE;
 * ao sair da academia Enterprise, restauramos Premium OWN até essa data se ainda for futura.
 *
 * Execute: node scripts/migration/apply-own-period-backup-migration.js
 * Depois: npx prisma generate
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
	try {
		console.log("📦 Aplicando migration ownPeriodEndBackup (subscriptions)...\n");

		const commands = [
			`ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "ownPeriodEndBackup" TIMESTAMP(3)`,
		];

		console.log(`Executando ${commands.length} comando(s) SQL...\n`);

		for (let i = 0; i < commands.length; i++) {
			try {
				await prisma.$executeRawUnsafe(commands[i]);
				console.log(
					`✅ Comando ${i + 1}/${commands.length} executado com sucesso`,
				);
			} catch (error) {
				if (
					error.message.includes("already exists") ||
					error.message.includes("duplicate")
				) {
					console.log(
						`⚠️  Comando ${i + 1}/${commands.length} ignorado (coluna já existe)`,
					);
				} else {
					console.error(`❌ Erro no comando ${i + 1}:`, error.message);
					throw error;
				}
			}
		}

		console.log("\n✅ Migration aplicada com sucesso!");
		console.log("📝 Em seguida, execute: npx prisma generate");
	} catch (error) {
		console.error("❌ Erro ao aplicar migration:", error.message);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

applyMigration();
