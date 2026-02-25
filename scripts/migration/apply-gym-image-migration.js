/**
 * Script para adicionar campo image (imagem de perfil) na tabela gyms
 * Execute: node scripts/migration/apply-gym-image-migration.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
	try {
		console.log(
			"📦 Aplicando migration: campo image em gyms (imagem de perfil)...\n",
		);

		const commands = [
			`ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "image" TEXT`,
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
					error.message.includes("duplicate") ||
					(error.message.includes("column") &&
						error.message.includes("already exists"))
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
		console.log("📝 Execute: npx prisma generate");
		console.log("\n📋 Resumo: campo image adicionado em gyms (imagem de perfil)");
	} catch (error) {
		console.error("❌ Erro ao aplicar migration:", error.message);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

applyMigration();
