import { db } from "@/lib/db";
import { invalidateWeeklyPlanCache } from "@/lib/use-cases/workouts/get-weekly-plan";
import { invalidateTrainingLibraryCache } from "./training-library-read.service";

export async function activateTrainingLibraryPlanForStudent(
  studentId: string,
  libraryPlanId: string,
) {
  const masterPlan = await db.weeklyPlan.findUnique({
    where: { id: libraryPlanId },
    include: {
      slots: {
        include: {
          workout: {
            include: {
              exercises: true,
            },
          },
        },
      },
    },
  });

  if (!masterPlan || !(masterPlan as { isLibraryTemplate?: boolean }).isLibraryTemplate) {
    throw new Error("Plano da biblioteca nao encontrado");
  }

  if (masterPlan.studentId !== studentId) {
    throw new Error("Voce nao tem acesso a este plano");
  }

  const result = await db.$transaction(async (tx) => {
    const cloneWeeklyPlan = await tx.weeklyPlan.create({
      data: {
        studentId,
        title: masterPlan.title,
        description: masterPlan.description,
        isLibraryTemplate: false,
        createdById: (masterPlan as { createdById?: string | null }).createdById ?? null,
        creatorType: (masterPlan as { creatorType?: string | null }).creatorType ?? null,
        sourceLibraryPlanId: libraryPlanId,
      },
    });

    for (const masterSlot of masterPlan.slots) {
      let newWorkoutId: string | null = null;

      if (masterSlot.workout) {
        const cloneWorkout = await tx.workout.create({
          data: {
            title: masterSlot.workout.title,
            description: masterSlot.workout.description,
            type: masterSlot.workout.type,
            muscleGroup: masterSlot.workout.muscleGroup,
            difficulty: masterSlot.workout.difficulty,
            xpReward: masterSlot.workout.xpReward,
            estimatedTime: masterSlot.workout.estimatedTime,
            order: masterSlot.workout.order,
            locked: masterSlot.workout.locked,
          },
        });
        newWorkoutId = cloneWorkout.id;

        if (masterSlot.workout.exercises.length > 0) {
          await tx.workoutExercise.createMany({
            data: masterSlot.workout.exercises.map((exercise) => ({
              workoutId: cloneWorkout.id,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              rest: exercise.rest,
              notes: exercise.notes,
              videoUrl: exercise.videoUrl,
              educationalId: exercise.educationalId,
              order: exercise.order,
              primaryMuscles: exercise.primaryMuscles ?? undefined,
              secondaryMuscles: exercise.secondaryMuscles ?? undefined,
              difficulty: exercise.difficulty ?? undefined,
              equipment: exercise.equipment ?? undefined,
              instructions: exercise.instructions ?? undefined,
              tips: exercise.tips ?? undefined,
              commonMistakes: exercise.commonMistakes ?? undefined,
              benefits: exercise.benefits ?? undefined,
              scientificEvidence: exercise.scientificEvidence ?? undefined,
            })),
          });
        }
      }

      await tx.planSlot.create({
        data: {
          weeklyPlanId: cloneWeeklyPlan.id,
          dayOfWeek: masterSlot.dayOfWeek,
          type: masterSlot.type,
          workoutId: newWorkoutId,
          order: masterSlot.order,
        },
      });
    }

    const student = await tx.student.findUnique({
      where: { id: studentId },
      select: { activeWeeklyPlanId: true },
    });

    await tx.student.update({
      where: { id: studentId },
      data: { activeWeeklyPlanId: cloneWeeklyPlan.id },
    });

    if (
      student?.activeWeeklyPlanId &&
      student.activeWeeklyPlanId !== cloneWeeklyPlan.id
    ) {
      const oldPlan = await tx.weeklyPlan.findUnique({
        where: { id: student.activeWeeklyPlanId },
        select: { id: true, isLibraryTemplate: true },
      });

      if (oldPlan && !oldPlan.isLibraryTemplate) {
        await tx.weeklyPlan.delete({
          where: { id: oldPlan.id },
        });
      }
    }

    return cloneWeeklyPlan;
  });

  await invalidateWeeklyPlanCache(studentId);
  await invalidateTrainingLibraryCache({
    studentId,
    planId: libraryPlanId,
  });

  return result;
}
