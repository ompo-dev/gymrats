/**
 * API Route para Chat de Nutrição com IA - STREAMING (SSE) para Gym
 */
import type { NextRequest } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

import { chatCompletionStream } from "@/lib/ai/client";
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
  const requestClone = request.clone();
  const body = await requestClone.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { ctx, errorResponse } = await getGymContext();
        if (errorResponse || !ctx) {
          sendSSE(controller, "error", { error: "Não autorizado" });
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
            error: "Aluno não pertence a esta academia",
          });
          controller.close();
          return;
        }

        const today = new Date();
        const dateStr = today.toISOString().split("T")[0];
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

        const isAdmin = ctx.user?.role === "ADMIN";
        const MAX_MESSAGES_PER_DAY = 20;

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
              error: "Limite diário atingido",
              message: `Você atingiu o limite de ${MAX_MESSAGES_PER_DAY} mensagens por dia.`,
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
          sendSSE(controller, "error", { error: "Mensagem inválida" });
          controller.close();
          return;
        }

        let meals = existingMeals;
        if (!meals || meals.length === 0) {
          const todayDate = new Date().toISOString().split("T")[0];
          const nutrition = await db.dailyNutrition.findUnique({
            where: {
              studentId_date: {
                studentId,
                date: new Date(todayDate),
              },
            },
            include: {
              meals: { orderBy: { order: "asc" } },
            },
          });

          if (nutrition) {
            meals = nutrition.meals.map(
              (m: { type: string; name: string }) => ({
                type: m.type,
                name: m.name,
              }),
            );
          }
        }

        let enhancedSystemPrompt = NUTRITION_SYSTEM_PROMPT;
        if (meals?.length > 0) {
          const mealsInfo = meals
            .map((m: { name: string; type: string }) => `- ${m.name}`)
            .join("\n");
          enhancedSystemPrompt += `\n\nRefeições já existentes:\n${mealsInfo}\n\nUse essas informações como referência.`;
        }

        if (selectedMeal?.type && selectedMeal.name) {
          enhancedSystemPrompt += `\n\n⚠️ IMPORTANTE - REFEIÇÃO PADRÃO:\nO usuário abriu o chat para adicionar alimentos à refeição "${selectedMeal.name}" (tipo: "${selectedMeal.type}").\n\nSe o usuário NÃO especificar explicitamente qual refeição (ex: "café da manhã", "almoço", "jantar", etc.), você DEVE usar "${selectedMeal.type}" como o mealType padrão para TODOS os alimentos mencionados.\n\nApenas se o usuário mencionar explicitamente uma refeição diferente (ex: "isso foi no almoço" ou "quero adicionar no café da manhã"), você deve usar a refeição mencionada pelo usuário.`;
        }

        const typedHistory = (conversationHistory || []).map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: String(msg.content)
        }));
        const limitedHistory = limitHistory(typedHistory, MAX_HISTORY);
        const messages = [
          ...limitedHistory,
          { role: "user" as const, content: message },
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
            maxTokens: 1024,
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
              const { foods: extractedFoods } =
                extractFoodsAndPartialFromStream(slice);

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
              }
            }
          },
        );

        sendSSE(controller, "status", {
          status: "parsing",
          message: "Processando...",
        });

        const parsed = parseNutritionResponse(fullContent);

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
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
