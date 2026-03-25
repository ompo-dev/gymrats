import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type WeeklyPlanWithDeepRelations = Prisma.WeeklyPlanGetPayload<{
  include: {
    slots: {
      include: {
        workout: {
          include: {
            exercises: true;
          };
        };
      };
    };
  };
}>;

async function cloneWeeklyPlanFromLibrary(
  tx: Prisma.TransactionClient,
  masterPlan: WeeklyPlanWithDeepRelations,
  studentId: string,
  libraryPlanId: string,
) {
  const cloneWeeklyPlan = await tx.weeklyPlan.create({
    data: {
      studentId,
      title: masterPlan.title,
      description: masterPlan.description,
      isLibraryTemplate: false,
      createdById: masterPlan.createdById,
      creatorType: masterPlan.creatorType,
      sourceLibraryPlanId: libraryPlanId,
    },
  });

  for (const masterSlot of masterPlan.slots) {
    let newWorkoutId: string | null = null;

    if (masterSlot.workout) {
      const masterWorkout = masterSlot.workout;
      const cloneWorkout = await tx.workout.create({
        data: {
          title: masterWorkout.title,
          description: masterWorkout.description,
          type: masterWorkout.type,
          muscleGroup: masterWorkout.muscleGroup,
          difficulty: masterWorkout.difficulty,
          xpReward: masterWorkout.xpReward,
          estimatedTime: masterWorkout.estimatedTime,
          order: masterWorkout.order,
          locked: masterWorkout.locked,
        },
      });
      newWorkoutId = cloneWorkout.id;

      if (masterWorkout.exercises.length > 0) {
        await tx.workoutExercise.createMany({
          data: masterWorkout.exercises.map((exercise) => ({
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

  return cloneWeeklyPlan;
}

export async function activateLibraryPlanForStudent(
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

  if (
    !masterPlan ||
    !(masterPlan as { isLibraryTemplate?: boolean }).isLibraryTemplate
  ) {
    return { ok: false as const, error: "Plano da biblioteca nao encontrado" };
  }

  if (masterPlan.studentId !== studentId) {
    return { ok: false as const, error: "Voce nao tem acesso a este plano" };
  }

  const weeklyPlan = await db.$transaction(async (tx) => {
    const student = await tx.student.findUnique({
      where: { id: studentId },
      select: { activeWeeklyPlanId: true },
    });
    const oldActivePlanId = student?.activeWeeklyPlanId;

    const cloneWeeklyPlan = await cloneWeeklyPlanFromLibrary(
      tx,
      masterPlan,
      studentId,
      libraryPlanId,
    );

    await tx.student.update({
      where: { id: studentId },
      data: { activeWeeklyPlanId: cloneWeeklyPlan.id },
    });

    if (oldActivePlanId && oldActivePlanId !== cloneWeeklyPlan.id) {
      const oldPlan = await tx.weeklyPlan.findUnique({
        where: { id: oldActivePlanId },
      });
      if (
        oldPlan &&
        !(oldPlan as { isLibraryTemplate?: boolean }).isLibraryTemplate
      ) {
        await tx.weeklyPlan.delete({ where: { id: oldActivePlanId } });
      }
    }

    return cloneWeeklyPlan;
  });

  return { ok: true as const, weeklyPlan };
}

export async function syncActiveWeeklyPlanFromLibrary(libraryPlanId: string) {
  const libraryPlan = await db.weeklyPlan.findUnique({
    where: { id: libraryPlanId },
    select: {
      studentId: true,
      isLibraryTemplate: true,
    },
  });

  if (!libraryPlan?.isLibraryTemplate) {
    return { ok: true as const, synced: false as const };
  }

  const student = await db.student.findUnique({
    where: { id: libraryPlan.studentId },
    select: { activeWeeklyPlanId: true },
  });

  if (!student?.activeWeeklyPlanId) {
    return { ok: true as const, synced: false as const };
  }

  const activePlan = await db.weeklyPlan.findUnique({
    where: { id: student.activeWeeklyPlanId },
    select: {
      id: true,
      isLibraryTemplate: true,
      sourceLibraryPlanId: true,
    },
  });

  if (
    !activePlan ||
    activePlan.isLibraryTemplate ||
    activePlan.sourceLibraryPlanId !== libraryPlanId
  ) {
    return { ok: true as const, synced: false as const };
  }

  const result = await activateLibraryPlanForStudent(
    libraryPlan.studentId,
    libraryPlanId,
  );

  if (!result.ok) {
    return {
      ok: false as const,
      synced: false as const,
      error: result.error,
    };
  }

  return {
    ok: true as const,
    synced: true as const,
    weeklyPlan: result.weeklyPlan,
  };
}
