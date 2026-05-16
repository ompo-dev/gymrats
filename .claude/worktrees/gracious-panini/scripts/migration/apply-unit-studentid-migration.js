/**
 * Script para aplicar migration de studentId em Unit
 * Execute: node scripts/migration/apply-unit-studentid-migration.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function columnExists(tableName, columnName) {
	try {
		const result = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
      AND column_name = '${columnName}'
    `);
		return Array.isArray(result) && result.length > 0;
	} catch (_error) {
		return false;
	}
}

async function applyMigration() {
	try {
		console.log("📦 Aplicando migration de studentId em Unit...\n");

		// Verificar se a coluna já existe
		const exists = await columnExists("units", "studentId");
		if (exists) {
			console.log("⚠️  Coluna 'units.studentId' já existe, ignorando...");
			await prisma.$disconnect();
			return;
		}

		// Adicionar coluna studentId
		console.log("Adicionando coluna 'studentId' na tabela 'units'...");
		await prisma.$executeRawUnsafe(`
      ALTER TABLE "units" 
      ADD COLUMN "studentId" TEXT
    `);

		// Adicionar foreign key constraint
		console.log("Adicionando foreign key constraint...");
		await prisma.$executeRawUnsafe(`
      ALTER TABLE "units"
      ADD CONSTRAINT "units_studentId_fkey" 
      FOREIGN KEY ("studentId") 
      REFERENCES "students"("id") 
      ON DELETE CASCADE 
      ON UPDATE CASCADE
    `);

		console.log("\n✅ Migration aplicada com sucesso!");
		console.log("📝 Execute: npx prisma generate");
		console.log("\n📋 Resumo das mudanças:");
		console.log("   - Campo studentId adicionado à tabela units");
		console.log(
			"   - Foreign key constraint criada para relacionamento com students",
		);
		console.log(
			"   - Se studentId for null, o treino é global; se preenchido, é personalizado",
		);
	} catch (error) {
		console.error("❌ Erro ao aplicar migration:", error.message);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

applyMigration();
