import type { NextRequest } from "@/runtime/next-server";
import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api/utils/response.utils";
import { createWorkoutExerciseSchema } from "@/lib/api/schemas/workouts.schemas";
import { db } from "@/lib/db";
import { exerciseDatabase } from "@/lib/educational-data/exercises";
import {
  calculateReps,
  calculateRest,
  calculateSets,
  generateAlternatives,
} from "@/lib/services/personalized-workout-generator";
import type { ExerciseInfo, MuscleGroup } from "@/lib/types";
import { getGymContext } from "@/lib/utils/gym/gym-context";

/**
 * POST /api/gym/students/[id]/workouts/exercises
 * Adiciona exercício ao treino do aluno pela academia.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { ctx, errorResponse } = await getGymContext(request);
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Não autenticado");
    }

    const { id: studentId } = await params;
    const membership = await db.gymMembership.findFirst({
      where: { gymId: ctx.gymId, studentId },
    });
    if (!membership) {
      return forbiddenResponse(
        "Aluno não encontrado ou não pertence a esta academia",
      );
    }

    const body = await request.json();
    console.log(
      "[gym/createExercise] Body recebido:",
      JSON.stringify(body, null, 2),
    );

    const validation = createWorkoutExerciseSchema.safeParse(body);

    if (!validation.success) {
      console.error("[gym/createExercise] Erro de validação:", {
        body,
        errors: validation.error.errors,
        formattedErrors: validation.error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
          code: e.code,
        })),
      });
      return badRequestResponse(
        "Dados inválidos",
        validation.error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
          code: e.code,
        })),
      );
    }

    const { workoutId, ...exerciseData } = validation.data;

    // Check if workout exists and belongs to student
    const workout = await db.workout.findUnique({
      where: { id: workoutId },
      include: { unit: true, planSlot: { include: { weeklyPlan: true } } },
    });

    if (!workout) return notFoundResponse("Treino não encontrado");

    const ownsViaUnit = workout.unit && workout.unit.studentId === studentId;
    const ownsViaPlanSlot =
      workout.planSlot && workout.planSlot.weeklyPlan.studentId === studentId;

    if (!ownsViaUnit && !ownsViaPlanSlot) {
      return unauthorizedResponse(
        "Você não pode adicionar exercícios a este treino",
      );
    }

    // Validar que name foi fornecido
    if (!exerciseData.name) {
      return badRequestResponse("Nome do exercício é obrigatório");
    }

    // Buscar perfil do aluno para calcular sets/reps/rest baseado nas preferências
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { profile: true },
    });

    if (!student?.profile) {
      return badRequestResponse("Perfil do aluno não encontrado");
    }

    // Buscar exercício no database educacional
    // Tentar buscar por ID primeiro (se fornecido e não null)
    let exerciseInfo: ExerciseInfo | null = null;

    if (exerciseData.educationalId && exerciseData.educationalId !== null) {
      exerciseInfo =
        exerciseDatabase.find((ex) => ex.id === exerciseData.educationalId) ??
        null;
    }

    // Se não encontrou por ID, tentar buscar por nome (case-insensitive e removendo acentos)
    if (!exerciseInfo) {
      const searchName = exerciseData.name
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remove acentos

      exerciseInfo =
        exerciseDatabase.find((ex) => {
          const exName = ex.name
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""); // Remove acentos

          // Busca exata ou por similaridade (contém o nome ou é contido pelo nome)
          return (
            exName === searchName ||
            exName.includes(searchName) ||
            searchName.includes(exName)
          );
        }) ?? null;
    }

    // Se ainda não encontrou, criar um novo exercício virtual usando os dados fornecidos
    // Isso permite adicionar exercícios que não estão no database educacional
    if (!exerciseInfo) {
      console.log(
        "[gym/createExercise] Exercício não encontrado no database, criando virtual:",
        {
          name: exerciseData.name,
          educationalId: exerciseData.educationalId,
        },
      );

      // Gerar ID baseado no nome (slug) se não fornecido
      const generatedId =
        exerciseData.educationalId ||
        exerciseData.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

      // Helper para normalizar arrays (aceita string JSON, array ou null)
      const normalizeArray = (
        value: string | string[] | null | undefined,
      ): string[] => {
        if (value == null) return [];
        if (Array.isArray(value)) return value;
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };

      // Helper para inferir grupo muscular baseado no nome
      const inferMuscleGroup = (name: string): MuscleGroup[] => {
        const normalized = name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        if (
          normalized.includes("peito") ||
          normalized.includes("supino") ||
          normalized.includes("crucifixo")
        ) {
          return ["peito" as MuscleGroup];
        }
        if (
          normalized.includes("costas") ||
          normalized.includes("remada") ||
          normalized.includes("puxada") ||
          normalized.includes("barra fixa")
        ) {
          return ["costas" as MuscleGroup];
        }
        if (
          normalized.includes("pernas") ||
          normalized.includes("perna") ||
          normalized.includes("agachamento") ||
          normalized.includes("leg press") ||
          normalized.includes("extensora") ||
          normalized.includes("flexora") ||
          normalized.includes("afundo")
        ) {
          return ["pernas" as MuscleGroup];
        }
        if (
          normalized.includes("quadriceps") ||
          normalized.includes("quadríceps")
        ) {
          return ["pernas" as MuscleGroup];
        }
        if (
          normalized.includes("posterior") ||
          normalized.includes("stiff") ||
          normalized.includes("gluteo") ||
          normalized.includes("glúteo")
        ) {
          return ["pernas", "gluteos"] as MuscleGroup[];
        }
        if (
          normalized.includes("ombros") ||
          normalized.includes("desenvolvimento") ||
          normalized.includes("elevacao") ||
          normalized.includes("elevação") ||
          normalized.includes("lateral") ||
          normalized.includes("frontal")
        ) {
          return ["ombros" as MuscleGroup];
        }
        if (
          normalized.includes("triceps") ||
          normalized.includes("tríceps") ||
          normalized.includes("pulley") ||
          normalized.includes("testa") ||
          normalized.includes("frances") ||
          normalized.includes("francês")
        ) {
          return ["bracos" as MuscleGroup];
        }
        if (
          normalized.includes("biceps") ||
          normalized.includes("bíceps") ||
          normalized.includes("rosca")
        ) {
          return ["bracos" as MuscleGroup];
        }
        if (
          normalized.includes("abdominal") ||
          normalized.includes("abdomen") ||
          normalized.includes("core") ||
          normalized.includes("prancha")
        ) {
          return ["core" as MuscleGroup];
        }
        return ["core" as MuscleGroup];
      };

      // Helper para inferir equipamento baseado no nome
      const inferEquipment = (name: string): string[] => {
        const normalized = name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        if (
          normalized.includes("maquina") ||
          normalized.includes("máquina") ||
          normalized.includes("cadeira") ||
          normalized.includes("extensora") ||
          normalized.includes("flexora") ||
          normalized.includes("leg press")
        ) {
          return ["Máquina"];
        }
        if (
          normalized.includes("barra") ||
          normalized.includes("supino") ||
          normalized.includes("agachamento") ||
          normalized.includes("terra")
        ) {
          return ["Barra", "Anilhas"];
        }
        if (
          normalized.includes("halter") ||
          normalized.includes("elevacao") ||
          normalized.includes("elevação") ||
          normalized.includes("rosca")
        ) {
          return ["Halteres"];
        }
        if (
          normalized.includes("cabo") ||
          normalized.includes("pulley") ||
          normalized.includes("polia")
        ) {
          return ["Cabo", "Polia"];
        }
        if (
          normalized.includes("paralelas") ||
          normalized.includes("barra fixa")
        ) {
          return ["Barras Paralelas"];
        }
        return [];
      };

      const primaryMuscles = normalizeArray(
        exerciseData.primaryMuscles ?? undefined,
      );
      const secondaryMuscles = normalizeArray(
        exerciseData.secondaryMuscles ?? undefined,
      );
      const equipment = normalizeArray(exerciseData.equipment ?? undefined);

      exerciseInfo = {
        id: generatedId,
        name: exerciseData.name,
        primaryMuscles:
          primaryMuscles.length > 0
            ? (primaryMuscles as MuscleGroup[])
            : inferMuscleGroup(exerciseData.name),
        secondaryMuscles:
          secondaryMuscles.length > 0
            ? (secondaryMuscles as MuscleGroup[])
            : [],
        difficulty: exerciseData.difficulty || "intermediario",
        equipment:
          equipment.length > 0 ? equipment : inferEquipment(exerciseData.name),
        instructions:
          normalizeArray(exerciseData.instructions ?? undefined).length > 0
            ? normalizeArray(exerciseData.instructions ?? undefined)
            : [
                `Execute ${exerciseData.name} com forma correta`,
                "Mantenha o movimento controlado",
                "Use peso adequado",
              ],
        tips:
          normalizeArray(exerciseData.tips ?? undefined).length > 0
            ? normalizeArray(exerciseData.tips ?? undefined)
            : [
                "Mantenha a forma correta",
                "Controle o movimento",
                "Use amplitude completa",
              ],
        commonMistakes:
          normalizeArray(exerciseData.commonMistakes ?? undefined).length > 0
            ? normalizeArray(exerciseData.commonMistakes ?? undefined)
            : [
                "Não usar amplitude completa",
                "Peso excessivo",
                "Forma incorreta",
              ],
        benefits:
          normalizeArray(exerciseData.benefits ?? undefined).length > 0
            ? normalizeArray(exerciseData.benefits ?? undefined)
            : [
                "Desenvolvimento muscular",
                "Aumento de força",
                "Melhora de condicionamento",
              ],
        scientificEvidence: exerciseData.scientificEvidence ?? undefined,
      };

      console.log("[gym/createExercise] Exercício virtual criado:", {
        id: exerciseInfo.id,
        name: exerciseInfo.name,
      });
    } else {
      console.log("[gym/createExercise] Exercício encontrado no database:", {
        id: exerciseInfo.id,
        name: exerciseInfo.name,
      });
    }

    const profile = {
      preferredSets: student.profile.preferredSets ?? undefined,
      preferredRepRange: student.profile.preferredRepRange as
        | "forca"
        | "hipertrofia"
        | "resistencia"
        | undefined,
      restTime: student.profile.restTime as
        | "curto"
        | "medio"
        | "longo"
        | undefined,
      activityLevel: student.profile.activityLevel ?? undefined,
      fitnessLevel: student.profile.fitnessLevel as
        | "iniciante"
        | "intermediario"
        | "avancado"
        | undefined,
      goals: student.profile.goals
        ? (JSON.parse(student.profile.goals) as string[])
        : undefined,
    };

    const calculatedSets =
      exerciseData.sets ||
      calculateSets(
        profile.preferredSets,
        profile.activityLevel,
        profile.fitnessLevel,
      );
    const calculatedReps =
      exerciseData.reps ||
      calculateReps(profile.preferredRepRange, profile.goals);
    const calculatedRest =
      exerciseData.rest !== undefined
        ? exerciseData.rest
        : calculateRest(profile.restTime, profile.preferredRepRange);

    // Helper para normalizar arrays (aceita string JSON, array ou já está normalizado)
    const _normalizeArray = (
      value: string | string[] | undefined | null,
    ): string[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    if (!exerciseInfo) {
      return badRequestResponse("Erro ao processar exercício");
    }

    const educationalExerciseData = {
      name: exerciseData.name || exerciseInfo.name,
      sets: calculatedSets,
      reps: calculatedReps,
      rest: calculatedRest,
      primaryMuscles:
        exerciseInfo.primaryMuscles && exerciseInfo.primaryMuscles.length > 0
          ? JSON.stringify(exerciseInfo.primaryMuscles)
          : null,
      secondaryMuscles:
        exerciseInfo.secondaryMuscles && exerciseInfo.secondaryMuscles.length > 0
          ? JSON.stringify(exerciseInfo.secondaryMuscles)
          : null,
      difficulty: exerciseInfo.difficulty || null,
      equipment:
        exerciseInfo.equipment && exerciseInfo.equipment.length > 0
          ? JSON.stringify(exerciseInfo.equipment)
          : null,
      instructions:
        exerciseInfo.instructions && exerciseInfo.instructions.length > 0
          ? JSON.stringify(exerciseInfo.instructions)
          : null,
      tips:
        exerciseInfo.tips && exerciseInfo.tips.length > 0
          ? JSON.stringify(exerciseInfo.tips)
          : null,
      commonMistakes:
        exerciseInfo.commonMistakes && exerciseInfo.commonMistakes.length > 0
          ? JSON.stringify(exerciseInfo.commonMistakes)
          : null,
      benefits:
        exerciseInfo.benefits && exerciseInfo.benefits.length > 0
          ? JSON.stringify(exerciseInfo.benefits)
          : null,
      scientificEvidence: exerciseInfo.scientificEvidence || null,
      educationalId: exerciseInfo.id,
    };

    const lastExercise = await db.workoutExercise.findFirst({
      where: { workoutId },
      orderBy: { order: "desc" },
    });
    const order = lastExercise ? lastExercise.order + 1 : 0;

    const exercise = await db.workoutExercise.create({
      data: {
        workoutId,
        ...educationalExerciseData,
        notes: exerciseData.notes || null,
        videoUrl: exerciseData.videoUrl || null,
        order,
      },
    });

    try {
      if (student?.profile && exerciseInfo) {
        const physicalLimitations = student.profile.physicalLimitations
          ? JSON.parse(student.profile.physicalLimitations)
          : [];
        const motorLimitations = student.profile.motorLimitations
          ? JSON.parse(student.profile.motorLimitations)
          : [];
        const medicalConditions = student.profile.medicalConditions
          ? JSON.parse(student.profile.medicalConditions)
          : [];
        const limitations = [
          ...physicalLimitations,
          ...motorLimitations,
          ...medicalConditions,
        ];

        const alternatives = generateAlternatives(
          exerciseInfo,
          student.profile.gymType as
            | "academia-completa"
            | "academia-basica"
            | "home-gym"
            | "peso-corporal"
            | null,
          limitations,
        );

        if (alternatives.length > 0) {
          await db.alternativeExercise.createMany({
            data: alternatives.map((alt, index) => ({
              workoutExerciseId: exercise.id,
              name: alt.name,
              reason: alt.reason,
              educationalId: alt.educationalId || null,
              order: index,
            })),
          });
        }
      }
    } catch (altError) {
      console.error(
        "[gym/createExercise] Erro ao adicionar alternativas:",
        altError,
      );
    }

    const exerciseWithAlternatives = await db.workoutExercise.findUnique({
      where: { id: exercise.id },
      include: { alternatives: true },
    });

    const safeParse = (value: string | null | undefined): string[] | null => {
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    const transformedExercise = exerciseWithAlternatives
      ? {
          ...exerciseWithAlternatives,
          primaryMuscles: safeParse(exerciseWithAlternatives.primaryMuscles),
          secondaryMuscles: safeParse(
            exerciseWithAlternatives.secondaryMuscles,
          ),
          equipment: safeParse(exerciseWithAlternatives.equipment),
          instructions: safeParse(exerciseWithAlternatives.instructions),
          tips: safeParse(exerciseWithAlternatives.tips),
          commonMistakes: safeParse(exerciseWithAlternatives.commonMistakes),
          benefits: safeParse(exerciseWithAlternatives.benefits),
          alternatives: exerciseWithAlternatives.alternatives || [],
        }
      : null;

    return successResponse(
      {
        data: transformedExercise,
        message: "Exercício adicionado com sucesso",
      },
      201,
    );
  } catch (error) {
    console.error("[gym/createExercise] Error:", error);
    return internalErrorResponse("Erro ao adicionar exercício");
  }
}
