import type { NextRequest } from "@/runtime/next-server";

export const maxDuration = 60;
export const runtime = "nodejs";

import { chatCompletionStream } from "@/lib/ai/client";
import {
  buildNutritionMealProgress,
  buildNutritionSystemPrompt,
  isCompleteNutritionPlanRequest,
  mergeNutritionMealReferences,
  parseJsonStringArray,
} from "@/lib/ai/nutrition-chat";
import {
  extractFoodsAndPartialFromStream,
  parseNutritionResponse,
} from "@/lib/ai/parsers/nutrition-parser";
import { NUTRITION_SYSTEM_PROMPT } from "@/lib/ai/prompts/nutrition";
import {
  AuthorizationError,
  requireAbility,
} from "@/lib/access-control/server";
import { Features } from "@/lib/access-control/features";
import { db } from "@/lib/db";
import { getGymContext } from "@/lib/utils/gym/gym-context";

const MAX_HISTORY = 4;
const MAX_MESSAGES_PER_DAY = 20;

type ChatMsg = { role: "user" | "assistant"; content: string };

function sendSSE(
  controller: ReadableStreamDefaultController,
  event: string,
  data: Record<string, string | number | boolean | object | null>,
) {
  controller.enqueue(
    new TextEncoder().encode(
      `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
    ),
  );
}

function limitHistory<T>(arr: T[], max: number): T[] {
  return arr.length <= max ? arr : arr.slice(-max);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.clone().json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { ctx, errorResponse } = await getGymContext(request);
        if (errorResponse || !ctx) {
          sendSSE(controller, "error", { error: "Nao autorizado" });
          controller.close();
          return;
        }

        await requireAbility(Features.USE_AI_NUTRITION, request);

        const { id: studentId } = await params;
        const membership = await db.gymMembership.findFirst({
          where: { gymId: ctx.gymId, studentId },
        });
        if (!membership) {
          sendSSE(controller, "error", {
            error: "Aluno nao pertence a esta academia",
          });
          controller.close();
          return;
        }

        const today = new Date();
        const dateStr = today.toISOString().split("T")[0];
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
        const isAdmin = ctx.user?.role === "ADMIN";

        let chatUsage = null;
        if (!isAdmin) {
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
              error: "Limite diario atingido",
              message: `Voce atingiu o limite de ${MAX_MESSAGES_PER_DAY} mensagens por dia.`,
            });
            controller.close();
            return;
          }
        }

        const {
          message,
          conversationHistory = [],
          existingMeals = [],
          selectedMeal,
        } = body;

        if (!message || typeof message !== "string") {
          sendSSE(controller, "error", { error: "Mensagem invalida" });
          controller.close();
          return;
        }

        const student = await db.student.findUnique({
          where: { id: studentId },
          include: {
            profile: {
              select: {
                targetCalories: true,
                targetProtein: true,
                targetCarbs: true,
                targetFats: true,
                targetWater: true,
                mealsPerDay: true,
                dietType: true,
                allergies: true,
                goals: true,
              },
            },
            activeNutritionPlan: {
              select: {
                meals: {
                  orderBy: { order: "asc" },
                  select: {
                    type: true,
                    name: true,
                    time: true,
                  },
                },
              },
            },
          },
        });

        let dailyMeals: Array<{
          type: string;
          name: string;
          time?: string | null;
        }> = [];

        if (!existingMeals?.length || isCompleteNutritionPlanRequest(message)) {
          const nutrition = await db.dailyNutrition.findUnique({
            where: {
              studentId_date: {
                studentId,
                date: new Date(dateStr),
              },
            },
            include: {
              meals: { orderBy: { order: "asc" } },
            },
          });

          if (nutrition) {
            dailyMeals = nutrition.meals.map((meal) => ({
              type: meal.type,
              name: meal.name,
              time: meal.time,
            }));
          }
        }

        const meals = mergeNutritionMealReferences(
          student?.activeNutritionPlan?.meals.map((meal) => ({
            type: meal.type,
            name: meal.name,
            time: meal.time,
          })),
          existingMeals,
          dailyMeals,
        );

        const selectedMealForPrompt = isCompleteNutritionPlanRequest(message)
          ? null
          : selectedMeal;

        const enhancedSystemPrompt = buildNutritionSystemPrompt({
          basePrompt: NUTRITION_SYSTEM_PROMPT,
          userMessage: message,
          meals,
          selectedMeal: selectedMealForPrompt,
          profile: student?.profile
            ? {
                targetCalories: student.profile.targetCalories,
                targetProtein: student.profile.targetProtein,
                targetCarbs: student.profile.targetCarbs,
                targetFats: student.profile.targetFats,
                targetWater: student.profile.targetWater,
                mealsPerDay: student.profile.mealsPerDay,
                dietType: student.profile.dietType,
                allergies: parseJsonStringArray(student.profile.allergies),
                goals: parseJsonStringArray(student.profile.goals),
              }
            : null,
        });

        const history = (conversationHistory ?? []) as ChatMsg[];
        const messages: ChatMsg[] = [
          ...limitHistory(history, MAX_HISTORY),
          { role: "user", content: message },
        ];

        sendSSE(controller, "status", {
          status: "calling_ai",
          message: "Consultando IA...",
        });

        let accumulatedContent = "";
        let lastEmittedFoodCount = -1;
        const step = 80;

        const fullContent = await chatCompletionStream(
          {
            messages,
            systemPrompt: enhancedSystemPrompt,
            temperature: 0.7,
            responseFormat: "json_object",
            maxTokens: 1800,
          },
          (delta) => {
            sendSSE(controller, "token", { delta });
            accumulatedContent += delta;

            const contentLen = accumulatedContent.length;
            const prevLen = contentLen - delta.length;
            const checkpoints: number[] = [];
            if (delta.length > step) {
              for (let i = prevLen; i < contentLen; i += step) {
                checkpoints.push(i);
              }
            }
            checkpoints.push(contentLen);

            for (const len of checkpoints) {
              const { foods: extractedFoods } = extractFoodsAndPartialFromStream(
                accumulatedContent.slice(0, len),
              );

              if (
                extractedFoods.length > 0 &&
                extractedFoods.length > lastEmittedFoodCount
              ) {
                lastEmittedFoodCount = extractedFoods.length;
                sendSSE(controller, "food_progress", {
                  foods: extractedFoods,
                  index: lastEmittedFoodCount - 1,
                  total: extractedFoods.length,
                });
                sendSSE(controller, "meal_progress", {
                  meals: buildNutritionMealProgress(extractedFoods, {
                    fallbackMealType: selectedMealForPrompt?.type,
                    existingMeals: meals,
                  }),
                });
              }
            }
          },
        );

        sendSSE(controller, "status", {
          status: "parsing",
          message: "Processando...",
        });

        const parsed = parseNutritionResponse(fullContent);

        if (chatUsage) {
          await db.nutritionChatUsage.update({
            where: { id: chatUsage.id },
            data: { messageCount: { increment: 1 } },
          });
        }

        sendSSE(controller, "complete", {
          foods: parsed.foods,
          message: parsed.message,
          needsConfirmation: parsed.foods.some((food) => food.confidence < 0.8),
          remainingMessages: isAdmin
            ? null
            : MAX_MESSAGES_PER_DAY - (chatUsage?.messageCount ?? 0) - 1,
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

        console.error("[gym/nutrition/chat-stream] Erro:", error);
        sendSSE(controller, "error", { error: "Erro inesperado" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
