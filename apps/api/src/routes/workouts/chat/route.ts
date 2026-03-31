import { NextResponse } from "@/runtime/next-server";

// Configurar timeout aumentado para operações de IA (podem demorar mais)
export const maxDuration = 60; // 60 segundos (máximo para Vercel Pro)
export const runtime = "nodejs"; // Garantir runtime Node.js para operações assíncronas

import { z } from "zod";
import { chatCompletion } from "@/lib/ai/client";
import {
  type ParsedWorkoutResponse,
  parseWorkoutResponse,
} from "@/lib/ai/parsers/workout-parser";
import { WORKOUT_SYSTEM_PROMPT } from "@/lib/ai/prompts/workout";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { hasActivePremiumStatus } from "@/lib/utils/subscription";

const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const jsonValueSchema: z.ZodType<import("@/lib/types/api-error").JsonValue> =
  z.lazy(() =>
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(jsonValueSchema),
      z.record(jsonValueSchema),
    ]),
  );

const workoutChatSchema = z
  .object({
    message: z.string().min(1, "Mensagem é obrigatória"),
    conversationHistory: z.array(conversationMessageSchema).optional(),
    unitId: z.string().optional(),
    planSlotId: z.string().optional(),
    existingWorkouts: z.array(z.record(jsonValueSchema)).optional(),
    profile: z.record(jsonValueSchema).optional(),
  })
  .refine((data) => data.unitId || data.planSlotId, {
    message: "unitId ou planSlotId é obrigatório",
    path: ["unitId"],
  });

export const POST = createSafeHandler(
  async ({ body, studentContext }) => {
    const { studentId } = studentContext!;
    const { message, conversationHistory = [], unitId, planSlotId } = body;

    // 2. Verificar Premium/Trial
    const subscription = await db.subscription.findUnique({
      where: { studentId },
    });

    if (!subscription || !hasActivePremiumStatus(subscription)) {
      return NextResponse.json(
        {
          error: "Recurso premium",
          message:
            "Esta funcionalidade requer assinatura premium ou trial ativo",
        },
        { status: 403 },
      );
    }

    // 3. Verificar rate limiting
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    let chatUsage = await db.nutritionChatUsage.findFirst({
      where: {
        studentId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (!chatUsage) {
      chatUsage = await db.nutritionChatUsage.create({
        data: {
          studentId,
          date: startOfDay,
          messageCount: 0,
        },
      });
    }

    const MAX_MESSAGES_PER_DAY = 20;
    if (chatUsage.messageCount >= MAX_MESSAGES_PER_DAY) {
      return NextResponse.json(
        {
          error: "Limite diário atingido",
          message: `Você atingiu o limite de ${MAX_MESSAGES_PER_DAY} mensagens por dia. Tente novamente amanhã.`,
          limitReached: true,
        },
        { status: 429 },
      );
    }

    // 5. Resolver contexto: unit ou planSlot (weeklyPlan)
    let workoutsInfo: Array<{
      id: string;
      title: string;
      type: string;
      muscleGroup: string;
      exercises: Array<{
        id: string;
        name: string;
        sets: number;
        reps: string;
      }>;
    }> = [];

    if (planSlotId) {
      const planSlot = await db.planSlot.findUnique({
        where: { id: planSlotId },
        include: {
          weeklyPlan: true,
          workout: {
            include: {
              exercises: { orderBy: { order: "asc" } },
            },
          },
        },
      });

      if (!planSlot || planSlot.weeklyPlan.studentId !== studentId) {
        return NextResponse.json(
          { error: "Slot não encontrado ou acesso negado" },
          { status: 404 },
        );
      }

      if (planSlot.workout) {
        workoutsInfo = [
          {
            id: planSlot.workout.id,
            title: planSlot.workout.title,
            type: planSlot.workout.type,
            muscleGroup: planSlot.workout.muscleGroup,
            exercises: planSlot.workout.exercises.map((e) => ({
              id: e.id,
              name: e.name,
              sets: e.sets,
              reps: e.reps,
            })),
          },
        ];
      }
    } else if (unitId) {
      const unit = await db.unit.findUnique({
        where: { id: unitId },
        include: {
          workouts: {
            orderBy: { order: "asc" },
            include: {
              exercises: { orderBy: { order: "asc" } },
            },
          },
        },
      });

      if (!unit || unit.studentId !== studentId) {
        return NextResponse.json(
          { error: "Unit não encontrada ou acesso negado" },
          { status: 404 },
        );
      }

      workoutsInfo = unit.workouts.map((w) => ({
        id: w.id,
        title: w.title,
        type: w.type,
        muscleGroup: w.muscleGroup,
        exercises: w.exercises.map((e) => ({
          id: e.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
        })),
      }));
    }

    const studentData = await db.student.findUnique({
      where: { id: studentId },
      include: { profile: true },
    });

    // 8. Construir prompt contextualizado
    let enhancedSystemPrompt = WORKOUT_SYSTEM_PROMPT;
    if (workoutsInfo.length > 0) {
      const contextLabel = planSlotId ? "NO SLOT" : "NA UNIT";
      enhancedSystemPrompt += `\n\nWORKOUTS JÁ EXISTENTES ${contextLabel}:\n${JSON.stringify(workoutsInfo)}\n\nUse essas informações para entender o contexto.`;
    }

    if (studentData?.profile) {
      enhancedSystemPrompt += `\n\nPERFIL DO USUÁRIO:\n${JSON.stringify(studentData.profile)}\n\nUse essas informações como padrão.`;
    }

    // 9. Processamento
    let parsed: ParsedWorkoutResponse | null = null;

    // Suporte a importação simplificada (estilizado conforme original)
    if (message.trim().startsWith("{") || message.trim().startsWith("[")) {
      try {
        const rawJson = JSON.parse(message);
        // Simplified normalization for brevity in this refactor
        parsed = {
          intent: "create",
          action: "create_workouts",
          workouts: Array.isArray(rawJson) ? rawJson : [rawJson],
          message: "Treino importado com sucesso.",
        };
      } catch (_e) {}
    }

    if (!parsed) {
      const MAX_HISTORY = 6;
      const aiConversationHistory = conversationHistory
        .filter(
          (entry): entry is { role: "user" | "assistant"; content: string } =>
            entry.role === "user" || entry.role === "assistant",
        )
        .slice(-MAX_HISTORY);

      const response = await chatCompletion({
        messages: [
          ...aiConversationHistory,
          { role: "user", content: message },
        ],
        systemPrompt: enhancedSystemPrompt,
        temperature: 0.7,
        responseFormat: "json_object",
      });
      parsed = parseWorkoutResponse(response);
    }

    // 11. Incrementar contador
    await db.nutritionChatUsage.update({
      where: { id: chatUsage.id },
      data: { messageCount: { increment: 1 } },
    });

    return NextResponse.json({
      ...parsed,
      unitId: unitId ?? undefined,
      planSlotId: planSlotId ?? undefined,
      remainingMessages: MAX_MESSAGES_PER_DAY - chatUsage.messageCount - 1,
    });
  },
  {
    auth: "student",
    schema: { body: workoutChatSchema },
  },
);
