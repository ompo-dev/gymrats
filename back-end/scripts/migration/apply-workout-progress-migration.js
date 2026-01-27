const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function applyWorkoutProgressMigration() {
  console.log("🔄 Aplicando migration: workout_progress...");

  try {
    const tableExistsResult = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'workout_progress'
      ) as exists;
    `);

    const exists = tableExistsResult[0]?.exists || false;

    if (exists) {
      console.log(
        "⚠️  Tabela workout_progress já existe. Verificando colunas..."
      );

      const columnExistsResult = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'workout_progress'
          AND column_name = 'updatedAt'
        ) as exists;
      `);

      const hasUpdatedAt = columnExistsResult[0]?.exists || false;

      if (!hasUpdatedAt) {
        console.log("➕ Adicionando coluna updatedAt...");
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "workout_progress" 
          ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
        `);
        console.log("✅ Coluna updatedAt adicionada!");
      }

      const allColumnsResult = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'workout_progress';
      `);

      const allColumns = allColumnsResult.map((c) => c.column_name);

      const requiredColumns = [
        "id",
        "studentId",
        "workoutId",
        "currentExerciseIndex",
        "exerciseLogs",
        "skippedExercises",
        "selectedAlternatives",
        "xpEarned",
        "totalVolume",
        "completionPercentage",
        "startTime",
        "cardioPreference",
        "cardioDuration",
        "selectedCardioType",
        "createdAt",
        "updatedAt",
      ];

      const missingColumns = requiredColumns.filter(
        (col) => !allColumns.includes(col)
      );

      if (missingColumns.length > 0) {
        console.log(`⚠️  Colunas faltando: ${missingColumns.join(", ")}`);
        console.log("➕ Adicionando colunas faltantes...");

        const columnDefinitions = {
          id: "TEXT NOT NULL PRIMARY KEY",
          studentId: "TEXT NOT NULL",
          workoutId: "TEXT NOT NULL",
          currentExerciseIndex: "INTEGER NOT NULL DEFAULT 0",
          exerciseLogs: "TEXT NOT NULL DEFAULT '[]'",
          skippedExercises: "TEXT",
          selectedAlternatives: "TEXT",
          xpEarned: "INTEGER NOT NULL DEFAULT 0",
          totalVolume: "DOUBLE PRECISION NOT NULL DEFAULT 0",
          completionPercentage: "DOUBLE PRECISION NOT NULL DEFAULT 0",
          startTime: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
          cardioPreference: "TEXT",
          cardioDuration: "INTEGER",
          selectedCardioType: "TEXT",
          createdAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
          updatedAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
        };

        for (const col of missingColumns) {
          if (col === "id") {
            console.log(
              `⚠️  Não é possível adicionar coluna PRIMARY KEY 'id' - tabela precisa ser recriada`
            );
            continue;
          }

          try {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE "workout_progress" 
              ADD COLUMN "${col}" ${columnDefinitions[col]};
            `);
            console.log(`✅ Coluna ${col} adicionada!`);
          } catch (error) {
            if (error.message.includes("already exists")) {
              console.log(`⚠️  Coluna ${col} já existe`);
            } else {
              console.error(
                `❌ Erro ao adicionar coluna ${col}:`,
                error.message
              );
            }
          }
        }

        console.log("✅ Todas as colunas foram verificadas/adicionadas!");
      } else {
        console.log("✅ Todas as colunas necessárias estão presentes!");
      }

      return;
    }

    const commands = [
      `CREATE TABLE "workout_progress" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "studentId" TEXT NOT NULL,
        "workoutId" TEXT NOT NULL,
        "currentExerciseIndex" INTEGER NOT NULL DEFAULT 0,
        "exerciseLogs" TEXT NOT NULL DEFAULT '[]',
        "skippedExercises" TEXT,
        "selectedAlternatives" TEXT,
        "xpEarned" INTEGER NOT NULL DEFAULT 0,
        "totalVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "startTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "cardioPreference" TEXT,
        "cardioDuration" INTEGER,
        "selectedCardioType" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "workout_progress_studentId_workoutId_unique" UNIQUE ("studentId", "workoutId"),
        CONSTRAINT "workout_progress_studentId_fkey" 
          FOREIGN KEY ("studentId") 
          REFERENCES "students" ("id") 
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "workout_progress_workoutId_fkey" 
          FOREIGN KEY ("workoutId") 
          REFERENCES "workouts" ("id") 
          ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      `CREATE INDEX "workout_progress_studentId_idx" ON "workout_progress"("studentId")`,
      `CREATE INDEX "workout_progress_workoutId_idx" ON "workout_progress"("workoutId")`,
    ];

    console.log(`Executando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      try {
        await prisma.$executeRawUnsafe(commands[i]);
        console.log(
          `✅ Comando ${i + 1}/${commands.length} executado com sucesso`
        );
      } catch (error) {
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          (error.message.includes("constraint") &&
            error.message.includes("already exists"))
        ) {
          console.log(
            `⚠️  Comando ${i + 1}/${commands.length} ignorado (já existe)`
          );
        } else {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log("\n✅ Migration workout_progress aplicada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration workout_progress:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  applyWorkoutProgressMigration()
    .then(() => {
      console.log("✅ Migration concluída!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erro na migration:", error);
      process.exit(1);
    });
}

module.exports = { applyWorkoutProgressMigration };
