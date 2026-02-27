/**
 * Script para aplicar migration de benefícios enterprise e multi-gym
 * Execute: node scripts/migration/apply-enterprise-benefits-migration.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
	try {
		console.log("📦 Aplicando migration de benefícios enterprise e multi-gym...\n");

		const commands = [
			// 1. Criar tipo ENUM SubscriptionSource se não existir
			`DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionSource') THEN
          CREATE TYPE "SubscriptionSource" AS ENUM ('OWN', 'GYM_ENTERPRISE');
        END IF;
      END $$`,

			// 2. Adicionar coluna source na tabela subscriptions
			`ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "source" "SubscriptionSource" DEFAULT 'OWN'`,

			// 3. Adicionar coluna enterpriseGymId na tabela subscriptions
			`ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "enterpriseGymId" TEXT`,

			// 4. Adicionar constraint de chave estrangeira para enterpriseGymId
			`DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_enterpriseGymId_fkey'
        ) THEN
          ALTER TABLE "subscriptions" 
          ADD CONSTRAINT "subscriptions_enterpriseGymId_fkey" 
          FOREIGN KEY ("enterpriseGymId") REFERENCES "gyms"("id") 
          ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$`,

			// 5. Garantir que a coluna isActive existe na tabela gyms
			`ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true`,
		];

		console.log(`Executando ${commands.length} comandos SQL...\n`);

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
					error.message.includes("UNIQUE constraint") ||
					(error.message.includes("relation") &&
						error.message.includes("already exists"))
				) {
					console.log(
						`⚠️  Comando ${i + 1}/${commands.length} ignorado (já existe)`,
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
