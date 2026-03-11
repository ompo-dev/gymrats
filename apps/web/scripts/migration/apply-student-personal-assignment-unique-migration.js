/**
 * Script para atualizar a restrição UNIQUE de student_personal_assignments
 * Execute: node scripts/migration/apply-student-personal-assignment-unique-migration.js
 *
 * Esta migration:
 * 1. Remove a restrição UNIQUE antiga em (studentId, personalId)
 * 2. Adiciona a nova restrição UNIQUE em (studentId, personalId, gymId)
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function runSql(cmd, description) {
  try {
    await prisma.$executeRawUnsafe(cmd);
    console.log(`✅ ${description}`);
    return true;
  } catch (err) {
    const msg = err.message || "";
    if (
      msg.includes("already exists") ||
      msg.includes("duplicate") ||
      msg.includes("does not exist") ||
      msg.includes("não existe")
    ) {
      console.log(`⚠️  ${description} (ignorado: ${msg.split('\n')[0]})`);
      return true;
    }
    throw err;
  }
}

async function applyMigration() {
  try {
    console.log("📦 Atualizando restrição UNIQUE em student_personal_assignments...\n");

    // Tentar remover a constraint antiga. O nome padrão do Prisma é table_field1_field2_key
    // Para StudentPersonalAssignment mapeado para student_personal_assignments
    await runSql(
      `ALTER TABLE "student_personal_assignments" DROP CONSTRAINT IF EXISTS "student_personal_assignments_studentId_personalId_key"`,
      "Removendo restrição UNIQUE antiga (studentId, personalId)"
    );

    // Adicionar a nova restrição UNIQUE
    // Usando NULLS NOT DISTINCT se suportado (Postgres 15+), ou apenas UNIQUE padrão.
    // O Prisma 6 (que parece ser o caso pelo output anterior) gera UNIQUE normal se não especificado.
    await runSql(
      `ALTER TABLE "student_personal_assignments" ADD CONSTRAINT "student_personal_assignments_studentId_personalId_gymId_key" UNIQUE ("studentId", "personalId", "gymId")`,
      "Adicionando nova restrição UNIQUE (studentId, personalId, gymId)"
    );

    console.log("\n✅ Restrição UNIQUE atualizada com sucesso!");
    console.log("📝 Execute: npx prisma generate");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
