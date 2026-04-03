/**
 * API Route para Chat de Treinos com IA - Streaming (SSE) para Gym
 */
import type { NextRequest } from "@/runtime/next-server";
export const maxDuration = 300;
export const runtime = "nodejs";

import { Features } from "@/lib/access-control/features";
import {
  AuthorizationError,
  requireAbility,
} from "@/lib/access-control/server";
import { chatCompletionStream } from "@/lib/ai/client";
import {
  extractWorkoutsAndPartialFromStream,
  parseWorkoutResponse,
} from "@/lib/ai/parsers/workout-parser";
import { WORKOUT_SYSTEM_PROMPT } from "@/lib/ai/prompts/workout";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { getGymContext } from "@/lib/utils/gym/gym-context";

function sendSSE(
  controller: ReadableStreamDefaultController,
  event: string,
  data: object,
) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestClone = request.clone();
  const body = await requestClone.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { ctx, errorResponse } = await getGymContext(request);
        if (errorResponse || !ctx) {
          sendSSE(controller, "error", { error: "Não autorizado" });
          controller.close();
          return;
        }

        await requireAbility(Features.USE_AI_WORKOUT, request);

        const { id: studentId } = await params;
        const membership = await db.gymMembership.findFirst({
          where: { gymId: ctx.gymId, studentId },
        });
        if (!membership) {
          sendSSE(controller, "error", {
            error: "Aluno não pertence a esta academia",
          });
          controller.close();
          return;
        }

        const isAdmin = ctx.user?.role === "ADMIN";
        const MAX_MESSAGES_PER_DAY = 20;
        let chatUsage = null;

        if (!isAdmin) {
          const today = new Date();
          const dateStr = today.toISOString().split("T")[0];
          const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
          const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

          chatUsage = await db.nutritionChatUsage.findFirst({
            where: {
              studentId,
              date: { gte: startOfDay, lte: endOfDay },
            },
          });

          if (!chatUsage) {
            chatUsage = await db.nutritionChatUsage.create({
              data: { studentId, date: startOfDay, messageCount: 0 },
            });
          }

          if (chatUsage.messageCount >= MAX_MESSAGES_PER_DAY) {
            sendSSE(controller, "error", {
              error: "Limite diário atingido",
              message: `Você atingiu o limite de ${MAX_MESSAGES_PER_DAY} mensagens por dia. Tente novamente amanhã.`,
            });
            controller.close();
            return;
          }
        }

        const {
          message,
          conversationHistory = [],
          unitId,
          planSlotId,
          slotContext,
          existingWorkouts: _existingWorkouts = [],
          profile: _profile,
          reference,
          previewWorkouts = [],
        } = body;

        if (!message || typeof message !== "string") {
          sendSSE(controller, "error", { error: "Mensagem inválida" });
          controller.close();
          return;
        }

        if (!unitId && !planSlotId) {
          sendSSE(controller, "error", {
            error: "unitId ou planSlotId é obrigatório",
          });
          controller.close();
          return;
        }

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
                include: { exercises: { orderBy: { order: "asc" } } },
              },
            },
          });

          if (!planSlot || planSlot.weeklyPlan.studentId !== studentId) {
            sendSSE(controller, "error", {
              error: "Slot não encontrado ou acesso negado",
            });
            controller.close();
            return;
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
                include: { exercises: { orderBy: { order: "asc" } } },
              },
            },
          });

          if (!unit) {
            sendSSE(controller, "error", { error: "Unit não encontrada" });
            controller.close();
            return;
          }

          if (unit.studentId !== studentId) {
            sendSSE(controller, "error", {
              error: "Você não tem permissão para editar esta unit",
            });
            controller.close();
            return;
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

        const student = await db.student.findUnique({
          where: { id: studentId },
          include: { profile: true },
        });

        let enhancedSystemPrompt = WORKOUT_SYSTEM_PROMPT;
        if (workoutsInfo.length > 0) {
          const contextLabel = planSlotId ? "NO SLOT" : "NA UNIT";
          enhancedSystemPrompt += `\n\nWORKOUTS JÁ EXISTENTES ${contextLabel}:\n${JSON.stringify(workoutsInfo)}\n\nUse essas informações para entender o contexto.`;
        }

        if (slotContext) {
          enhancedSystemPrompt += `\n\nCONTEXTO DO SLOT:\nDia da semana: ${slotContext}\n\n`;
        }

        if (student?.profile) {
          enhancedSystemPrompt += `\n\nPERFIL DO USUÁRIO:\n${JSON.stringify(student.profile)}\n\nUse essas informações como padrão.`;
        }

        const messagesArr: Array<{
          role: "user" | "assistant";
          content: string;
        }> = [
          ...(Array.isArray(conversationHistory)
            ? (conversationHistory as Array<{
                role: "user" | "assistant";
                content: string;
              }>)
            : []),
          { role: "user", content: message },
        ];

        sendSSE(controller, "status", {
          status: "calling_ai",
          message: "Consultando IA...",
        });

        let accumulatedContent = "";
        let lastEmittedWorkoutCount = 0;
        let lastEmittedPartialExerciseCount = -1;
        const step = 80;

        const fullContent = await chatCompletionStream(
          {
            messages: messagesArr,
            systemPrompt: enhancedSystemPrompt,
            temperature: 0.7,
            responseFormat: "json_object",
          },
          (delta) => {
            sendSSE(controller, "token", { delta });
            accumulatedContent += delta;

            const contentLen = accumulatedContent.length;
            const prevLen = contentLen - delta.length;
            const checkpoints: number[] = [];
            if (delta.length > step) {
              for (let i = prevLen; i < contentLen; i += step)
                checkpoints.push(i);
            }
            checkpoints.push(contentLen);

            for (const len of checkpoints) {
              const slice = accumulatedContent.slice(0, len);
              const { completeWorkouts, partialWorkout } =
                extractWorkoutsAndPartialFromStream(slice);

              while (lastEmittedWorkoutCount < completeWorkouts.length) {
                const workout = completeWorkouts[lastEmittedWorkoutCount];
                const total =
                  completeWorkouts.length + (partialWorkout ? 1 : 0);
                sendSSE(controller, "workout_progress", {
                  workout,
                  index: lastEmittedWorkoutCount,
                  total,
                });
                lastEmittedWorkoutCount++;
                lastEmittedPartialExerciseCount = -1;
              }
              if (
                partialWorkout &&
                partialWorkout.exercises.length >
                  lastEmittedPartialExerciseCount
              ) {
                lastEmittedPartialExerciseCount =
                  partialWorkout.exercises.length;
                const total = completeWorkouts.length + 1;
                sendSSE(controller, "workout_progress", {
                  workout: partialWorkout,
                  index: completeWorkouts.length,
                  total,
                });
              }
            }
          },
        );

        sendSSE(controller, "status", {
          status: "parsing",
          message: "Processando resposta...",
        });

        const parsed = parseWorkoutResponse(fullContent);

        if (!parsed) {
          sendSSE(controller, "error", { error: "Erro ao processar resposta" });
          controller.close();
          return;
        }

        if (chatUsage) {
          await db.nutritionChatUsage.update({
            where: { id: chatUsage.id },
            data: { messageCount: { increment: 1 } },
          });
        }

        sendSSE(controller, "complete", {
          ...parsed,
          remainingMessages: chatUsage
            ? MAX_MESSAGES_PER_DAY - chatUsage.messageCount - 1
            : null,
          previewWorkouts,
          reference,
        });

        controller.close();
      } catch (error) {
        if (error instanceof AuthorizationError) {
          sendSSE(controller, "error", {
            error: "Acesso Negado",
            message: error.message,
          });
          controller.close();
          return;
        }

        log.error("[gym/workouts/chat-stream] Erro", {
          error: error instanceof Error ? error.message : String(error),
        });
        sendSSE(controller, "error", { error: "Erro inesperado" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
