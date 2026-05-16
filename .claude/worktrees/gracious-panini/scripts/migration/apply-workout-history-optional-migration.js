const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
	try {
		console.log(
			"📦 Aplicando migration: Tornar workoutId opcional em WorkoutHistory...\n",
		);

		// 1. Alterar a coluna workoutId para permitir NULL
		console.log(
			"Alterando coluna 'workoutId' na tabela 'workout_history' para NULLABLE...",
		);
		await prisma.$executeRawUnsafe(`
      ALTER TABLE "workout_history" 
      ALTER COLUMN "workoutId" DROP NOT NULL
    `);

		// 2. Atualizar a constraint de chave estrangeira para ON DELETE SET NULL
		// Primeiro precisamos descobrir o nome da constraint
		// Normalmente o Prisma nomeia como "workout_history_workoutId_fkey"

		console.log("Removendo constraint antiga...");
		try {
			await prisma.$executeRawUnsafe(`
        ALTER TABLE "workout_history" 
        DROP CONSTRAINT "workout_history_workoutId_fkey"
      `);
		} catch (_e) {
			console.log(
				"Nota: Constraint pode não existir ou ter outro nome. Tentando continuar...",
			);
		}

		console.log("Adicionando nova constraint com ON DELETE SET NULL...");
		await prisma.$executeRawUnsafe(`
      ALTER TABLE "workout_history"
      ADD CONSTRAINT "workout_history_workoutId_fkey" 
      FOREIGN KEY ("workoutId") 
      REFERENCES "workouts"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `);

		console.log("\n✅ Migration aplicada com sucesso!");
		console.log("📝 Execute: npx prisma generate");
	} catch (error) {
		console.error("❌ Erro ao aplicar migration:", error.message);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

applyMigration();
