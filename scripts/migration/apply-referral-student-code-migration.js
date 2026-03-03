/**
 * Execute: node scripts/migration/apply-referral-student-code-migration.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function applyMigration() {
  console.log("🔄 Aplicando migration: Coluna referralCode em students...\n");

  try {
    const columnExistsResult = await prisma.$queryRawUnsafe(`
			SELECT EXISTS (
				SELECT FROM information_schema.columns
				WHERE table_schema = 'public'
				AND table_name = 'students'
				AND column_name = 'referralCode'
			) as exists;
		`);

    const colExists = columnExistsResult[0]?.exists || false;

    if (colExists) {
      console.log("⚠️  Coluna 'referralCode' já existe.");
    } else {
      await prisma.$executeRawUnsafe(`
			  ALTER TABLE "students"
			  ADD COLUMN "referralCode" TEXT UNIQUE;
		  `);
      console.log("✅ Coluna 'referralCode' adicionada com sucesso!");
    }

    console.log("📝 Execute: npx prisma generate");
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  applyMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { applyMigration };
