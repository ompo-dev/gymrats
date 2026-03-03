/**
 * Migration: Adicionar tabela student_withdraws e pixKeyType
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function applyMigration() {
  console.log(
    "🔄 Aplicando migration: Tabela student_withdraws e pixKeyType...\n",
  );

  try {
    const columnExistsResult = await prisma.$queryRawUnsafe(`
			SELECT EXISTS (
				SELECT FROM information_schema.columns
				WHERE table_schema = 'public'
				AND table_name = 'students'
				AND column_name = 'pixKeyType'
			) as exists;
		`);

    const colExists = columnExistsResult[0]?.exists || false;

    if (colExists) {
      console.log("⚠️  Coluna 'pixKeyType' já existe em students.");
    } else {
      await prisma.$executeRawUnsafe(`
			  ALTER TABLE "students"
			  ADD COLUMN "pixKeyType" TEXT DEFAULT 'CPF';
		  `);
      console.log("✅ Coluna 'pixKeyType' adicionada com sucesso!");
    }

    const tableExistsResult = await prisma.$queryRawUnsafe(`
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public'
				AND table_name = 'student_withdraws'
			) as exists;
		`);

    const tblExists = tableExistsResult[0]?.exists || false;

    if (tblExists) {
      console.log("⚠️  Tabela 'student_withdraws' já existe.");
    } else {
      await prisma.$executeRawUnsafe(`
			CREATE TABLE "student_withdraws" (
				"id" TEXT NOT NULL,
				"studentId" TEXT NOT NULL,
				"amount" DOUBLE PRECISION NOT NULL,
				"pixKey" TEXT NOT NULL,
				"pixKeyType" TEXT NOT NULL,
				"externalId" TEXT NOT NULL,
				"abacateId" TEXT,
				"status" TEXT NOT NULL DEFAULT 'pending',
				"referralIds" TEXT,
				"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
				"completedAt" TIMESTAMP(3),

				CONSTRAINT "student_withdraws_pkey" PRIMARY KEY ("id")
			);
		  `);

      // Add foreign keys and unique constraints
      await prisma.$executeRawUnsafe(`
			ALTER TABLE "student_withdraws" ADD CONSTRAINT "student_withdraws_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
		  `);

      await prisma.$executeRawUnsafe(`
			CREATE UNIQUE INDEX "student_withdraws_externalId_key" ON "student_withdraws"("externalId");
		  `);

      await prisma.$executeRawUnsafe(`
			CREATE INDEX "student_withdraws_studentId_idx" ON "student_withdraws"("studentId");
		  `);

      await prisma.$executeRawUnsafe(`
			CREATE INDEX "student_withdraws_status_idx" ON "student_withdraws"("status");
		  `);

      console.log("✅ Tabela 'student_withdraws' criada com sucesso!");
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
  applyMigration()
    .then(() => {
      console.log("\n✅ Migration concluída!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erro na migration:", error);
      process.exit(1);
    });
}
