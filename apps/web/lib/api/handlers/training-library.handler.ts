import type { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "../utils/response.utils";
import {
  requireStudent,
  requireGym,
  requirePersonal,
  requireAuth,
} from "../middleware/auth.middleware";
import {
  createWeeklyPlanSchema,
  updateWeeklyPlanSchema,
  activateLibraryPlanSchema,
} from "../schemas/workouts.schemas";

// ==========================================
// LIBRARY (CRUD)
// ==========================================

export async function getLibraryPlansHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) return auth.response;

    const url = new URL(request.url);
    const studentIdParam = url.searchParams.get("studentId");
    
    let studentId = studentIdParam || auth.user.student?.id || "";

    if (!studentId) {
      return badRequestResponse("studentId não identificado ou ausente para este usuário");
    }

    const libraryPlans = await db.weeklyPlan.findMany({
      where: {
        studentId,
        ...({ isLibraryTemplate: true } as any),
      },
      include: {
        slots: {
          orderBy: { dayOfWeek: "asc" },
          include: {
            workout: {
              include: { exercises: { orderBy: { order: "asc" } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ data: libraryPlans });
  } catch (error) {
    console.error("Error fetching library plans:", error);
    return internalErrorResponse("Erro ao buscar treinos da biblioteca");
  }
}

export async function createLibraryPlanHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) return auth.response;

    const body = await request.json().catch(() => ({}));
    const validation = createWeeklyPlanSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error.flatten() as any);
    }

    const { title, isLibraryTemplate, studentId: bodyStudentId, sourceWeeklyPlanId } = validation.data;
    const isLibrary = isLibraryTemplate ?? true;

    let targetStudentId = bodyStudentId || auth.user.student?.id;
    let createdById: string | null = null;
    let creatorType: string | null = ("STUDENT" as string | null);

    if (!targetStudentId) {
       return badRequestResponse("Destino não identificado");
    }

    if (bodyStudentId && auth.user.role === "GYM") {
      createdById = auth.user.gyms?.[0]?.id ?? null;
      creatorType = "GYM";
      const hasPlan = await db.weeklyPlan.findFirst({
        where: { studentId: targetStudentId, ...({ createdById, isLibraryTemplate: true } as any) },
      });
      if (hasPlan) return badRequestResponse("A academia só pode ter 1 treino na biblioteca deste aluno.");
    } else if (bodyStudentId && auth.user.role === "PERSONAL") {
      createdById = auth.user.personal?.id ?? null;
      creatorType = "PERSONAL";
      const hasPlan = await db.weeklyPlan.findFirst({
        where: { studentId: targetStudentId, ...({ createdById, isLibraryTemplate: true } as any) },
      });
      if (hasPlan) return badRequestResponse("O personal só pode ter 1 treino na biblioteca deste aluno.");
    } else {
      createdById = auth.user.student?.id ?? null;
      creatorType = "STUDENT";
    }

    if (sourceWeeklyPlanId) {
      // 1. Clona o plano ao invés de criar vazio
      const masterPlan = await db.weeklyPlan.findUnique({
        where: { id: sourceWeeklyPlanId },
        include: {
          slots: { include: { workout: { include: { exercises: true } } } }
        }
      });

      if (!masterPlan) {
        return notFoundResponse("Plano de origem não encontrado");
      }

      const result = await db.$transaction(async (tx) => {
        const cloneWeeklyPlan = await tx.weeklyPlan.create({
          data: {
            studentId: targetStudentId,
            title: title || masterPlan.title || "Cópia do Plano",
            description: masterPlan.description,
            ...({
              isLibraryTemplate: isLibrary,
              createdById,
              creatorType,
            } as any)
          }
        });

        // 2.B - Clona cada slot e seus workouts
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
              }
            });
            newWorkoutId = cloneWorkout.id;

            if (masterWorkout.exercises && masterWorkout.exercises.length > 0) {
              const exerciseCopies = masterWorkout.exercises.map(ex => ({
                workoutId: cloneWorkout.id,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                rest: ex.rest,
                notes: ex.notes,
                videoUrl: ex.videoUrl,
                educationalId: ex.educationalId,
                order: ex.order,
                primaryMuscles: ex.primaryMuscles ?? undefined,
                secondaryMuscles: ex.secondaryMuscles ?? undefined,
                difficulty: ex.difficulty ?? undefined,
                equipment: ex.equipment ?? undefined,
                instructions: ex.instructions ?? undefined,
                tips: ex.tips ?? undefined,
                commonMistakes: ex.commonMistakes ?? undefined,
                benefits: ex.benefits ?? undefined,
                scientificEvidence: ex.scientificEvidence ?? undefined,
              }));

              await tx.workoutExercise.createMany({
                data: exerciseCopies
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
            }
          });
        }
        return cloneWeeklyPlan;
      });

      return successResponse(
        { data: result, message: "Plano clonado para a biblioteca" },
        201,
      );
    }

    const weeklyPlan = await db.weeklyPlan.create({
      data: {
        studentId: targetStudentId,
        title: title || "Meu Plano Semanal (Biblioteca)",
        ...({
          isLibraryTemplate: isLibrary,
          createdById,
          creatorType,
        } as any),
        slots: {
          create: Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            type: "rest",
            order: i,
          })),
        },
      },
      include: { slots: { orderBy: { dayOfWeek: "asc" } } },
    });

    return successResponse(
      { data: weeklyPlan, message: "Plano criado na biblioteca" },
      201,
    );
  } catch (error) {
    console.error("Error creating library plan:", error);
    return internalErrorResponse("Erro ao criar plano na biblioteca");
  }
}

// Para update
export async function updateLibraryPlanHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) return auth.response;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const validation = updateWeeklyPlanSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error.flatten() as any);
    }

    const plan = await db.weeklyPlan.findUnique({ where: { id } });
    if (!plan) return notFoundResponse("Plano não encontrado");
    if (!(plan as any).isLibraryTemplate) return badRequestResponse("Plano não está na biblioteca");

    // Access control
    if (auth.user.role === "STUDENT" && plan.studentId !== auth.user.student?.id) {
       return unauthorizedResponse("Sem permissão para editar treino de outro aluno");
    }
    if (auth.user.role === "GYM" && (plan as any).createdById !== auth.user.gyms?.[0]?.id) {
       return unauthorizedResponse("Sem permissão para editar treino de outra academia");
    }
    if (auth.user.role === "PERSONAL") {
       if ((plan as any).createdById !== auth.user.personal?.id) {
         let isAffiliated = false;
         if ((plan as any).creatorType === "GYM") {
            const rel = await db.gymPersonalAffiliation.findFirst({
              where: { personalId: auth.user.personal?.id, gymId: (plan as any).createdById! }
            });
            if (rel) isAffiliated = true;
         }
         if (!isAffiliated) return unauthorizedResponse("Sem permissão.");
       }
    }

    const updatedPlan = await db.weeklyPlan.update({
      where: { id },
      data: {
        ...(validation.data.title !== undefined && { title: validation.data.title }),
        ...(validation.data.description !== undefined && { description: validation.data.description }),
      },
      include: { slots: { orderBy: { dayOfWeek: "asc" } } },
    });

    return successResponse({ data: updatedPlan, message: "Plano editado com sucesso" });
  } catch (error) {
    console.error("Error updating library plan:", error);
    return internalErrorResponse("Erro ao editar");
  }
}


export async function deleteLibraryPlanHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) return auth.response;

    const { id } = await params;
    const plan = await db.weeklyPlan.findUnique({ where: { id } });

    if (!plan) return notFoundResponse("Plano não encontrado");
    if (!(plan as any).isLibraryTemplate) return badRequestResponse("Plano não está na biblioteca");

    // Access control
    if (auth.user.role === "STUDENT" && plan.studentId !== auth.user.student?.id) {
       return unauthorizedResponse("Sem permissão para deletar treino de outro aluno");
    }
    if (auth.user.role === "GYM" && (plan as any).createdById !== auth.user.gyms?.[0]?.id) {
       return unauthorizedResponse("Sem permissão para deletar treino de outra academia");
    }
    if (auth.user.role === "PERSONAL") {
       if ((plan as any).createdById !== auth.user.personal?.id) {
         // Não é dele, ele é afiliado da gym que criou?
         let isAffiliated = false;
         if ((plan as any).creatorType === "GYM") {
            const rel = await db.gymPersonalAffiliation.findFirst({
              where: { personalId: auth.user.personal?.id, gymId: (plan as any).createdById! }
            });
            if (rel) isAffiliated = true;
         }
         if (!isAffiliated) return unauthorizedResponse("Sem permissão.");
       }
    }

    await db.weeklyPlan.delete({ where: { id } });
    return successResponse({ message: "Plano deletado com sucesso" });
  } catch (error) {
    console.error("Error deleting library plan:", error);
    return internalErrorResponse("Erro ao deletar");
  }
}

// ==========================================
// ACTIVATE (CLONE LIBRARY TO ACTIVE PLAN)
// ==========================================

export async function activateLibraryPlanHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const studentId = auth.user.student?.id;
    if (!studentId) return unauthorizedResponse("Student não encontrado");
    
    const body = await request.json();
    const validation = activateLibraryPlanSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error.flatten() as any);
    }

    const { libraryPlanId } = validation.data;

    // 1. Busca plano da biblioteca e tudo nele (Deep clone necessity)
    const masterPlan = await db.weeklyPlan.findUnique({
      where: { id: libraryPlanId },
      include: {
        slots: {
          include: {
            workout: {
              include: { exercises: true }
            }
          }
        }
      }
    });

    if (!masterPlan || !(masterPlan as any).isLibraryTemplate) {
      return notFoundResponse("Plano da biblioteca não encontrado");
    }

    if (masterPlan.studentId !== studentId) {
      return unauthorizedResponse("Você não tem acesso a este plano");
    }

    // 2. Clone Transaction
    // Queremos criar um NOVO weeklyPlan. isLibraryTemplate: false.
    // e setalo como activeWeeklyPlanId.
    const result = await db.$transaction(async (tx) => {
      // 2.A - Cria o novo plano root
      const cloneWeeklyPlan = await tx.weeklyPlan.create({
        data: {
          studentId,
          title: masterPlan.title,
          description: masterPlan.description,
          ...({
            isLibraryTemplate: false,
            createdById: (masterPlan as any).createdById,
            creatorType: (masterPlan as any).creatorType,
            sourceLibraryPlanId: libraryPlanId,
          } as any)
        }
      });

      // 2.B - Clona cada slot e seus workouts
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
            }
          });
          newWorkoutId = cloneWorkout.id;

          // Clona os exercicios
          if (masterWorkout.exercises && masterWorkout.exercises.length > 0) {
            const exerciseCopies = masterWorkout.exercises.map(ex => ({
              workoutId: cloneWorkout.id,
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
              notes: ex.notes,
              videoUrl: ex.videoUrl,
              educationalId: ex.educationalId,
              order: ex.order,
              primaryMuscles: ex.primaryMuscles ?? undefined,
              secondaryMuscles: ex.secondaryMuscles ?? undefined,
              difficulty: ex.difficulty ?? undefined,
              equipment: ex.equipment ?? undefined,
              instructions: ex.instructions ?? undefined,
              tips: ex.tips ?? undefined,
              commonMistakes: ex.commonMistakes ?? undefined,
              benefits: ex.benefits ?? undefined,
              scientificEvidence: ex.scientificEvidence ?? undefined,
            }));

            await tx.workoutExercise.createMany({
              data: exerciseCopies
            });
          }
        }

        // Cria o slot associado ao novo weekly plan
        await tx.planSlot.create({
          data: {
            weeklyPlanId: cloneWeeklyPlan.id,
            dayOfWeek: masterSlot.dayOfWeek,
            type: masterSlot.type,
            workoutId: newWorkoutId,
            order: masterSlot.order,
          }
        });
      }

      // 2.C Set as active na student e busca o velho ativo p limpar
      const student = await tx.student.findUnique({
         where: { id: studentId },
         ...({ select: { activeWeeklyPlanId: true } } as any)
      });
      const oldActivePlanId = (student as any)?.activeWeeklyPlanId;

      await tx.student.update({
        where: { id: studentId },
        ...({ data: { activeWeeklyPlanId: cloneWeeklyPlan.id } } as any)
      });

      // Se havia um velho ativo e nao era library, a gente limpa do db
      if (oldActivePlanId && oldActivePlanId !== cloneWeeklyPlan.id) {
        const old = await tx.weeklyPlan.findUnique({ where: { id: oldActivePlanId }});
        if (old && !(old as any).isLibraryTemplate) {
           // As delecoes em cascade darão conta dos Slots e Workouts caso configuradas em cascade, 
           // senao precisariamos deletar manual, assumindo CASCADE do Prisma:
           await tx.weeklyPlan.delete({ where: { id: oldActivePlanId }});
        }
      }

      return cloneWeeklyPlan;
    });

    return successResponse(
      { data: result, message: "Plano da biblioteca ativado!" },
      200,
    );
  } catch (error) {
    console.error("Error activating library plan:", error);
    return internalErrorResponse("Erro ao ativar o plano gerando a cópia.");
  }
}
