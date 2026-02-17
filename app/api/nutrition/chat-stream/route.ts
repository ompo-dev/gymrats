/**
 * API Route para Chat de Nutrição com IA - STREAMING (SSE)
 *
 * Usa streaming da DeepSeek para UX instantânea (Time-to-First-Token ~200-500ms)
 * Envia tokens conforme chegam; ao final envia foods parseados
 */

import type { NextRequest } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

import { chatCompletionStream } from "@/lib/ai/client";
import { parseNutritionResponse } from "@/lib/ai/parsers/nutrition-parser";
import { NUTRITION_SYSTEM_PROMPT } from "@/lib/ai/prompts/nutrition";
import { requireStudent } from "@/lib/api/middleware/auth.middleware";
import { db } from "@/lib/db";

const MAX_HISTORY = 4; // Últimas 4 mensagens para reduzir tokens

function sendSSE(
  controller: ReadableStreamDefaultController,
  event: string,
  data: unknown,
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

export async function POST(request: NextRequest) {
  const requestClone = request.clone();
  const body = await requestClone.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const auth = await requireStudent(request);
        if ("error" in auth) {
          sendSSE(controller, "error", { error: "Não autorizado" });
          controller.close();
          return;
        }

        const studentId = auth.user.student?.id;
        if (!studentId) {
          sendSSE(controller, "error", { error: "Student ID não encontrado" });
          controller.close();
          return;
        }

        const subscription = await db.subscription.findUnique({
          where: { studentId },
        });

        if (!subscription) {
          sendSSE(controller, "error", {
            error: "Recurso premium",
            message:
              "Esta funcionalidade requer assinatura premium ou trial ativo",
          });
          controller.close();
          return;
        }

        const now = new Date();
        const isTrialActive =
          subscription.trialEnd && new Date(subscription.trialEnd) > now;
        const hasPremium =
          subscription.plan === "premium" &&
          (subscription.status === "active" ||
            subscription.status === "trialing" ||
            isTrialActive);

        if (!hasPremium) {
          sendSSE(controller, "error", {
            error: "Recurso premium",
            message:
              "Esta funcionalidade requer assinatura premium ou trial ativo",
          });
          controller.close();
          return;
        }

        const today = new Date();
        const dateStr = today.toISOString().split("T")[0];
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

        const isAdmin = auth.user?.role === "ADMIN";
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
            .map(
              (m: { type: string; name: string }) => `- ${m.name} (${m.type})`,
            )
            .join("\n");
          enhancedSystemPrompt += `\n\nREFEIÇÕES EXISTENTES:\n${mealsInfo}`;
        }

        if (selectedMeal?.type && selectedMeal.name) {
          enhancedSystemPrompt += `\n\nREFEIÇÃO PADRÃO: "${selectedMeal.name}" (${selectedMeal.type}). Se usuário não especificar refeição, use mealType: "${selectedMeal.type}".`;
        }

        type ChatMsg = { role: "user" | "assistant"; content: string };
        const history = (conversationHistory ?? []) as ChatMsg[];
        const limitedHistory = limitHistory(history, MAX_HISTORY);
        const messages: ChatMsg[] = [
          ...limitedHistory,
          { role: "user" as const, content: message },
        ];

        sendSSE(controller, "status", {
          status: "calling_ai",
          message: "Consultando IA...",
        });

        // Não encaminhar tokens ao client - resposta é JSON, usuário veria lixo.
        // Streaming ainda acelera server-side (TTFT menor).
        const fullContent = await chatCompletionStream(
          {
            messages,
            systemPrompt: enhancedSystemPrompt,
            temperature: 0.7,
            responseFormat: "json_object",
            maxTokens: 1024,
          },
          undefined, // onChunk - não enviar tokens (JSON não é legível)
        );

        sendSSE(controller, "status", {
          status: "parsing",
          message: "Processando...",
        });

        const parsed = parseNutritionResponse(fullContent);

        if (!isAdmin && chatUsage) {
          await db.nutritionChatUsage.update({
            where: { id: chatUsage.id },
            data: { messageCount: { increment: 1 } },
          });
        }

        sendSSE(controller, "complete", {
          foods: parsed.foods,
          message: parsed.message,
          needsConfirmation: parsed.foods.some((f) => f.confidence < 0.8),
          remainingMessages: isAdmin
            ? null
            : MAX_MESSAGES_PER_DAY - (chatUsage?.messageCount ?? 0) - 1,
        });

        controller.close();
      } catch (error: unknown) {
        console.error("[nutrition/chat-stream] Erro:", error);
        const err = error instanceof Error ? error : new Error(String(error));
        sendSSE(controller, "error", {
          error: err.message || "Erro ao processar mensagem",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
