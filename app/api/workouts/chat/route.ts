import { NextResponse } from "next/server";

// Configurar timeout aumentado para operações de IA (podem demorar mais)
export const maxDuration = 60; // 60 segundos (máximo para Vercel Pro)
export const runtime = "nodejs"; // Garantir runtime Node.js para operações assíncronas

import { chatCompletion } from "@/lib/ai/client";
import { parseWorkoutResponse } from "@/lib/ai/parsers/workout-parser";
import { WORKOUT_SYSTEM_PROMPT } from "@/lib/ai/prompts/workout";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { hasActivePremiumStatus } from "@/lib/utils/subscription";
import { z } from "zod";

const workoutChatSchema = z.object({
  message: z.string().min(1, "Mensagem é obrigatória"),
  conversationHistory: z.array(z.any()).optional(),
  unitId: z.string().min(1, "Unit ID é obrigatório"),
  existingWorkouts: z.array(z.any()).optional(),
  profile: z.any().optional(),
});

export const POST = createSafeHandler(
  async ({ body, studentContext }) => {
    const { studentId } = studentContext!;
    const {
      message,
      conversationHistory = [],
      unitId,
    } = body;

    // 2. Verificar Premium/Trial
    const subscription = await db.subscription.findUnique({
      where: { studentId },
    });

    if (!subscription || !hasActivePremiumStatus(subscription)) {
      return NextResponse.json(
        {
          error: "Recurso premium",
          message: "Esta funcionalidade requer assinatura premium ou trial ativo",
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

    // 5. Verificar se unit existe e pertence ao student
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

    // 6. Preparar informações e contexto
    const workoutsInfo = unit.workouts.map((w) => ({
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

    const studentData = await db.student.findUnique({
      where: { id: studentId },
      include: { profile: true },
    });

    // 8. Construir prompt contextualizado
    let enhancedSystemPrompt = WORKOUT_SYSTEM_PROMPT;
    if (workoutsInfo.length > 0) {
      enhancedSystemPrompt += `\n\nWORKOUTS JÁ EXISTENTES NA UNIT:\n${JSON.stringify(workoutsInfo)}\n\nUse essas informações para entender o contexto.`;
    }

    if (studentData?.profile) {
      enhancedSystemPrompt += `\n\nPERFIL DO USUÁRIO:\n${JSON.stringify(studentData.profile)}\n\nUse essas informações como padrão.`;
    }

    // 9. Processamento
    let parsed: any = null;
    
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
       } catch (e) {}
    }

    if (!parsed) {
      const MAX_HISTORY = 6;
      const response = await chatCompletion({
        messages: [
          ...conversationHistory.slice(-MAX_HISTORY),
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
      remainingMessages: MAX_MESSAGES_PER_DAY - chatUsage.messageCount - 1,
    });
  },
  {
    auth: "student",
    schema: { body: workoutChatSchema },
  }
);
