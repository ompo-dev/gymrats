/**
 * Migration: Adicionar tabela referrals e coluna pixKey
 *
 * Adiciona a tabela para programas de indicação (referrals),
 * e a nova coluna pixKey na tabela students.
 *
 * Execute: node scripts/migration/apply-referral-migration.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function applyReferralMigration() {
  console.log("🔄 Aplicando migration: Tabela referrals e coluna pixKey...\n");

  try {
    // 1. Adicionar `pixKey` (nullable) em `students`
    const columnExistsResult = await prisma.$queryRawUnsafe(`
			SELECT EXISTS (
				SELECT FROM information_schema.columns
				WHERE table_schema = 'public'
				AND table_name = 'students'
				AND column_name = 'pixKey'
			) as exists;
		`);

    const colExists = columnExistsResult[0]?.exists || false;

    if (colExists) {
      console.log("⚠️  Coluna 'pixKey' já existe em students.");
    } else {
      await prisma.$executeRawUnsafe(`
			  ALTER TABLE "students"
			  ADD COLUMN "pixKey" TEXT;
		  `);
      console.log("✅ Coluna 'pixKey' adicionada com sucesso!");
    }

    // 2. Criar a nova tabela `referrals`
    const tableExistsResult = await prisma.$queryRawUnsafe(`
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public'
				AND table_name = 'referrals'
			) as exists;
		`);

    const tblExists = tableExistsResult[0]?.exists || false;

    if (tblExists) {
      console.log("⚠️  Tabela 'referrals' já existe.");
    } else {
      await prisma.$executeRawUnsafe(`
			CREATE TABLE "referrals" (
				"id" TEXT NOT NULL,
				"referrerStudentId" TEXT NOT NULL,
				"referralCode" TEXT NOT NULL,
				"referredType" TEXT NOT NULL,
				"referredId" TEXT,
				"status" TEXT NOT NULL DEFAULT 'PENDING',
				"firstPaymentAmountCents" INTEGER,
				"commissionAmountCents" INTEGER,
				"paidAt" TIMESTAMP(3),
				"abacatePayPaymentId" TEXT,
				"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
				"updatedAt" TIMESTAMP(3) NOT NULL,

				CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
			);
		  `);

      // Add foreign keys
      await prisma.$executeRawUnsafe(`
			ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerStudentId_fkey" FOREIGN KEY ("referrerStudentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
		  `);

      // CREATE INDEXES
      await prisma.$executeRawUnsafe(`
			CREATE INDEX "referrals_referrerStudentId_idx" ON "referrals"("referrerStudentId");
		  `);

      await prisma.$executeRawUnsafe(`
			CREATE INDEX "referrals_referralCode_idx" ON "referrals"("referralCode");
		  `);

      console.log("✅ Tabela 'referrals' criada com sucesso!");
    }

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
  applyReferralMigration()
    .then(() => {
      console.log("\n✅ Migration concluída!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erro na migration:", error);
      process.exit(1);
    });
}

module.exports = { applyReferralMigration };
