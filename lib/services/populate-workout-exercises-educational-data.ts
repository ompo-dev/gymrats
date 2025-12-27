/**
 * Serviço para popular WorkoutExercises existentes com dados do educational database
 * 
 * Este serviço atualiza todos os exercícios existentes no banco de dados com:
 * - Músculos primários e secundários
 * - Dificuldade
 * - Equipamentos necessários
 * - Instruções, dicas, erros comuns, benefícios
 * - Evidência científica
 */

import { db } from "@/lib/db";
import { exerciseDatabase } from "@/lib/educational-data";

/**
 * Popula todos os WorkoutExercises existentes com dados do educational database
 */
export async function populateWorkoutExercisesWithEducationalData(): Promise<{
  updated: number;
  notFound: number;
  errors: number;
}> {
  try {
    console.log("🔄 Iniciando população de WorkoutExercises com dados educacionais...\n");

    // Buscar todos os exercícios do banco
    const workoutExercises = await db.workoutExercise.findMany({
      where: {
        OR: [
          { primaryMuscles: null },
          { secondaryMuscles: null },
          { difficulty: null },
        ],
      },
    });

    console.log(`📊 Encontrados ${workoutExercises.length} exercícios para atualizar\n`);

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const workoutExercise of workoutExercises) {
      try {
        // Buscar exercício no educational database pelo educationalId ou nome
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

        // Atualizar exercício com dados do educational database
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
            // Atualizar educationalId se não existir
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

/**
 * Popula um WorkoutExercise específico com dados do educational database
 */
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

    // Buscar exercício no educational database
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

    // Atualizar exercício
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

