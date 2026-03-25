/**
 * Script para aplicar FK de gymId em student_personal_assignments
 * Execute: node scripts/migration/apply-student-personal-gym-fk-migration.js
 *
 * Esta migration:
 * 1. Garante índice em gymId
 * 2. Limpa gymId órfão (seta null quando gym não existe)
 * 3. Adiciona FK student_personal_assignments_gymId_fkey -> gyms(id)
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
      msg.includes("IF NOT EXISTS")
    ) {
      console.log(`⚠️  ${description} (já existe, ignorado)`);
      return true;
    }
    throw err;
  }
}

async function applyMigration() {
  try {
    console.log(
      "📦 Aplicando migration de FK gymId em student_personal_assignments...\n",
    );

    await runSql(
      `CREATE INDEX IF NOT EXISTS "student_personal_assignments_gymId_idx" ON "student_personal_assignments"("gymId")`,
      "Índice student_personal_assignments_gymId",
    );

    await runSql(
      `UPDATE "student_personal_assignments" spa
       SET "gymId" = NULL
       WHERE "gymId" IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM "gyms" g WHERE g."id" = spa."gymId"
         )`,
      "Limpeza de gymId órfão em student_personal_assignments",
    );

    await runSql(
      `DO $$
       BEGIN
         ALTER TABLE "student_personal_assignments"
         ADD CONSTRAINT "student_personal_assignments_gymId_fkey"
         FOREIGN KEY ("gymId") REFERENCES "gyms"("id")
         ON DELETE SET NULL
         ON UPDATE CASCADE;
       EXCEPTION
         WHEN duplicate_object THEN null;
       END $$`,
      "FK student_personal_assignments_gymId_fkey",
    );

    console.log("\n✅ Migration de FK gymId aplicada com sucesso!");
    console.log("📝 Execute: npx prisma generate");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
