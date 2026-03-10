/**
 * Script para adicionar campos do educational database ao WorkoutExercise
 * Execute: node scripts/migration/apply-workout-exercise-educational-data-migration.js
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
    console.log(
      "📦 Aplicando migration para adicionar campos educacionais ao WorkoutExercise...\n",
    );

    const tableName = "workout_exercises";
    const columnsToAdd = [
      {
        name: "primaryMuscles",
        type: "TEXT",
        description: "Músculos primários (JSON array)",
      },
      {
        name: "secondaryMuscles",
        type: "TEXT",
        description: "Músculos secundários (JSON array)",
      },
      { name: "difficulty", type: "TEXT", description: "Nível de dificuldade" },
      {
        name: "equipment",
        type: "TEXT",
        description: "Equipamentos necessários (JSON array)",
      },
      {
        name: "instructions",
        type: "TEXT",
        description: "Instruções passo a passo (JSON array)",
      },
      {
        name: "tips",
        type: "TEXT",
        description: "Dicas de execução (JSON array)",
      },
      {
        name: "commonMistakes",
        type: "TEXT",
        description: "Erros comuns (JSON array)",
      },
      {
        name: "benefits",
        type: "TEXT",
        description: "Benefícios do exercício (JSON array)",
      },
      {
        name: "scientificEvidence",
        type: "TEXT",
        description: "Evidência científica",
      },
      { name: "createdAt", type: "TIMESTAMP", description: "Data de criação" },
      {
        name: "updatedAt",
        type: "TIMESTAMP",
        description: "Data de atualização",
      },
    ];

    console.log(
      `Verificando e adicionando ${columnsToAdd.length} colunas na tabela "${tableName}"...\n`,
    );

    for (let i = 0; i < columnsToAdd.length; i++) {
      const column = columnsToAdd[i];
      try {
        const exists = await columnExists(tableName, column.name);
        if (exists) {
          console.log(
            `⚠️  Coluna ${i + 1}/${columnsToAdd.length} "${tableName}.${column.name}" já existe, ignorando...`,
          );
          continue;
        }

        let command;
        if (column.name === "createdAt" || column.name === "updatedAt") {
          // Para timestamps, usar DEFAULT CURRENT_TIMESTAMP
          command = `ALTER TABLE "${tableName}" ADD COLUMN "${column.name}" ${column.type} DEFAULT CURRENT_TIMESTAMP`;
        } else {
          command = `ALTER TABLE "${tableName}" ADD COLUMN "${column.name}" ${column.type}`;
        }

        await prisma.$executeRawUnsafe(command);
        console.log(
          `✅ Coluna ${i + 1}/${columnsToAdd.length} "${tableName}.${column.name}" (${column.description}) adicionada com sucesso`,
        );
      } catch (error) {
        console.error(
          `❌ Erro ao adicionar coluna "${tableName}.${column.name}":`,
          error.message,
        );
        throw error;
      }
    }

    // Adicionar trigger para updatedAt se não existir
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER IF NOT EXISTS update_workout_exercises_updated_at
        AFTER UPDATE ON "${tableName}"
        FOR EACH ROW
        BEGIN
          UPDATE "${tableName}" SET "updatedAt" = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
      `);
      console.log(`✅ Trigger para updatedAt criado com sucesso`);
    } catch (error) {
      // Trigger pode já existir, ignorar erro
      console.log(`⚠️  Trigger para updatedAt: ${error.message}`);
    }

    console.log("\n✅ Migration aplicada com sucesso!");
    console.log("📝 Execute: npx prisma generate");
    console.log("\n📋 Resumo das mudanças:");
    console.log(
      `   - ${columnsToAdd.length} campos educacionais adicionados à tabela "${tableName}"`,
    );
    console.log(
      "   - Campos incluem: primaryMuscles, secondaryMuscles, difficulty, equipment, instructions, tips, commonMistakes, benefits, scientificEvidence",
    );
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
