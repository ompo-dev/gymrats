/**
 * Script para adicionar role PENDING para seleção de tipo de usuário
 * Execute: node scripts/migration/apply-pending-user-role-migration.js
 *
 * Esta migration:
 * 1. Adiciona PENDING ao enum UserRole (usuário novo que ainda não escolheu aluno/academia)
 * 2. Altera o default da coluna role para PENDING (apenas novos usuários)
 * 3. Usuários existentes mantêm seu role atual (STUDENT, GYM, ADMIN)
 *
 * Após esta migration, novos usuários que fazem login com Google serão redirecionados
 * para /auth/register/user-type para escolher se serão aluno ou academia.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
	try {
		console.log("📦 Aplicando migration PENDING user role...\n");

		// 1. Adicionar PENDING ao enum UserRole
		// IF NOT EXISTS existe no PostgreSQL 15+; em versões antigas usamos try/catch
		try {
			await prisma.$executeRawUnsafe(
				`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PENDING'`,
			);
			console.log("✅ PENDING adicionado ao enum UserRole");
		} catch (err) {
			if (err.message?.includes("syntax") || err.message?.includes("IF NOT EXISTS")) {
				// PostgreSQL < 15: tentar sem IF NOT EXISTS
				try {
					await prisma.$executeRawUnsafe(
						`ALTER TYPE "UserRole" ADD VALUE 'PENDING'`,
					);
					console.log("✅ PENDING adicionado ao enum UserRole");
				} catch (e2) {
					if (e2.message?.includes("already exists") || e2.message?.includes("duplicate")) {
						console.log("⚠️  PENDING já existe no enum");
					} else throw e2;
				}
			} else if (err.message?.includes("already exists") || err.message?.includes("duplicate")) {
				console.log("⚠️  PENDING já existe no enum");
			} else {
				throw err;
			}
		}

		// 2. Alterar default da coluna role para PENDING
		await prisma.$executeRawUnsafe(
			`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'PENDING'`,
		);
		console.log("✅ Default da coluna role alterado para PENDING");

		// Verificar se o enum tem PENDING
		const enumCheck = await prisma.$queryRaw`
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
      ORDER BY enumsortorder
    `;
		console.log("\n📊 Valores atuais do enum UserRole:", enumCheck?.map((e) => e.enumlabel) || []);

		// Contar usuários por role
		const roleCounts = await prisma.$queryRaw`
      SELECT role, COUNT(*)::int as count 
      FROM users 
      GROUP BY role
    `;
		console.log("\n📊 Usuários por role:", roleCounts);

		console.log("\n✅ Migration aplicada com sucesso!");
		console.log("📝 Execute: npx prisma generate");
		console.log("\n📋 Resumo das mudanças:");
		console.log("   - Role PENDING adicionado ao enum UserRole");
		console.log("   - Novos usuários (Google OAuth) receberão role PENDING");
		console.log("   - Usuários existentes mantêm STUDENT, GYM ou ADMIN");
		console.log("   - Fluxo: login → /auth/register/user-type → escolhe aluno/academia → onboarding");
	} catch (error) {
		console.error("❌ Erro ao aplicar migration:", error.message);
		console.error(error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

applyMigration();
