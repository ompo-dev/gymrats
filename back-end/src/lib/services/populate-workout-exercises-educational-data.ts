import { db } from "@/lib/db";
import { exerciseDatabase } from "@/lib/educational-data";

export async function populateWorkoutExercisesWithEducationalData(
  studentId?: string
): Promise<{
  updated: number;
  notFound: number;
  errors: number;
}> {
  try {
    const scope = studentId ? `do aluno ${studentId}` : "de todos os alunos";
    console.log(`🔄 Iniciando população de WorkoutExercises ${scope} com dados educacionais...\n`);

    const whereClause: any = {
      OR: [
        { primaryMuscles: null },
        { secondaryMuscles: null },
        { difficulty: null },
      ],
    };

    if (studentId) {
      const units = await db.unit.findMany({
        where: { studentId },
        include: {
          workouts: {
            select: { id: true },
          },
        },
      });

      const workoutIds = units.flatMap((unit) => unit.workouts.map((w) => w.id));

      if (workoutIds.length === 0) {
        console.log(`⚠️  Nenhum workout encontrado para o aluno ${studentId}`);
        return { updated: 0, notFound: 0, errors: 0 };
      }

      whereClause.workoutId = { in: workoutIds };
    }

    const workoutExercises = await db.workoutExercise.findMany({
      where: whereClause,
    });

    console.log(`📊 Encontrados ${workoutExercises.length} exercícios para atualizar\n`);

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const workoutExercise of workoutExercises) {
      try {
        const educationalExercise = exerciseDatabase.find(
          (ex) =>
            ex.id === workoutExercise.educationalId ||
            ex.name.toLowerCase() === workoutExercise.name.toLowerCase()
        );

        if (!educationalExercise) {
          console.warn(
            `⚠️  Exercício educacional não encontrado: ${workoutExercise.name} (educationalId: ${workoutExercise.educationalId})`
          );
          notFound++;
          continue;
        }

        await db.workoutExercise.update({
          where: { id: workoutExercise.id },
          data: {
            primaryMuscles: educationalExercise.primaryMuscles
              ? JSON.stringify(educationalExercise.primaryMuscles)
              : null,
            secondaryMuscles: educationalExercise.secondaryMuscles
              ? JSON.stringify(educationalExercise.secondaryMuscles)
              : null,
            difficulty: educationalExercise.difficulty || null,
            equipment:
              educationalExercise.equipment && educationalExercise.equipment.length > 0
                ? JSON.stringify(educationalExercise.equipment)
                : null,
            instructions:
              educationalExercise.instructions && educationalExercise.instructions.length > 0
                ? JSON.stringify(educationalExercise.instructions)
                : null,
            tips:
              educationalExercise.tips && educationalExercise.tips.length > 0
                ? JSON.stringify(educationalExercise.tips)
                : null,
            commonMistakes:
              educationalExercise.commonMistakes && educationalExercise.commonMistakes.length > 0
                ? JSON.stringify(educationalExercise.commonMistakes)
                : null,
            benefits:
              educationalExercise.benefits && educationalExercise.benefits.length > 0
                ? JSON.stringify(educationalExercise.benefits)
                : null,
            scientificEvidence: educationalExercise.scientificEvidence || null,
            educationalId: workoutExercise.educationalId || educationalExercise.id,
          },
        });

        updated++;
        if (updated % 10 === 0) {
          console.log(`✅ ${updated} exercícios atualizados...`);
        }
      } catch (error: any) {
        console.error(
          `❌ Erro ao atualizar exercício ${workoutExercise.name} (${workoutExercise.id}):`,
          error.message
        );
        errors++;
      }
    }

    console.log(`\n✅ População concluída!`);
    console.log(`   - ${updated} exercícios atualizados`);
    console.log(`   - ${notFound} exercícios não encontrados no educational database`);
    console.log(`   - ${errors} erros`);

    return { updated, notFound, errors };
  } catch (error: any) {
    console.error("❌ Erro ao popular WorkoutExercises:", error);
    throw error;
  }
}

export async function populateSingleWorkoutExercise(
  workoutExerciseId: string
): Promise<boolean> {
  try {
    const workoutExercise = await db.workoutExercise.findUnique({
      where: { id: workoutExerciseId },
    });

    if (!workoutExercise) {
      throw new Error(`WorkoutExercise não encontrado: ${workoutExerciseId}`);
    }

    const educationalExercise = exerciseDatabase.find(
      (ex) =>
        ex.id === workoutExercise.educationalId ||
        ex.name.toLowerCase() === workoutExercise.name.toLowerCase()
    );

    if (!educationalExercise) {
      throw new Error(
        `Exercício educacional não encontrado: ${workoutExercise.name}`
      );
    }

    await db.workoutExercise.update({
      where: { id: workoutExerciseId },
      data: {
        primaryMuscles: educationalExercise.primaryMuscles
          ? JSON.stringify(educationalExercise.primaryMuscles)
          : null,
        secondaryMuscles: educationalExercise.secondaryMuscles
          ? JSON.stringify(educationalExercise.secondaryMuscles)
          : null,
        difficulty: educationalExercise.difficulty || null,
        equipment:
          educationalExercise.equipment && educationalExercise.equipment.length > 0
            ? JSON.stringify(educationalExercise.equipment)
            : null,
        instructions:
          educationalExercise.instructions && educationalExercise.instructions.length > 0
            ? JSON.stringify(educationalExercise.instructions)
            : null,
        tips:
          educationalExercise.tips && educationalExercise.tips.length > 0
            ? JSON.stringify(educationalExercise.tips)
            : null,
        commonMistakes:
          educationalExercise.commonMistakes && educationalExercise.commonMistakes.length > 0
            ? JSON.stringify(educationalExercise.commonMistakes)
            : null,
        benefits:
          educationalExercise.benefits && educationalExercise.benefits.length > 0
            ? JSON.stringify(educationalExercise.benefits)
            : null,
        scientificEvidence: educationalExercise.scientificEvidence || null,
        educationalId: workoutExercise.educationalId || educationalExercise.id,
      },
    });

    return true;
  } catch (error: any) {
    console.error(
      `❌ Erro ao popular WorkoutExercise ${workoutExerciseId}:`,
      error.message
    );
    throw error;
  }
}
