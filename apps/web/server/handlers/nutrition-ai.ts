import type { Context } from "elysia";
import { Features } from "@/lib/access-control/features";
import {
  AuthorizationError,
  requireAbility,
} from "@/lib/access-control/server";
import { chatCompletion } from "@/lib/ai/client";
import { parseNutritionResponse } from "@/lib/ai/parsers/nutrition-parser";
import { NUTRITION_SYSTEM_PROMPT } from "@/lib/ai/prompts/nutrition";
import { db } from "@/lib/db";
import { badRequestResponse, internalErrorResponse } from "../utils/response";

type NutritionAiContext = {
  set: Context["set"];
  body?: {
    message?: string;
    existingMeals?: Array<{ type: string; name: string }>;
    selectedMeal?: { type: string; name: string };
    conversationHistory?: Array<{ role: string; content: string }>;
  };
  studentId: string;
  request?: Request;
};

export async function nutritionChatHandler({
  set,
  body,
  studentId,
  request,
}: NutritionAiContext) {
  try {
    await requireAbility(Features.USE_AI_NUTRITION, request);

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    let chatUsage = await db.nutritionChatUsage.findFirst({
      where: {
        studentId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
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
      set.status = 429;
      return {
        error: "Limite diário atingido",
        message: `Você atingiu o limite de ${MAX_MESSAGES_PER_DAY} mensagens por dia. Tente novamente amanhã.`,
        limitReached: true,
      };
    }

    const {
      message,
      conversationHistory = [],
      existingMeals = [],
      selectedMeal,
    } = body || {};

    if (!message || typeof message !== "string") {
      return badRequestResponse(set, "Mensagem inválida");
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
          meals: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (nutrition) {
        meals = nutrition.meals.map((m) => ({
          type: m.type,
          name: m.name,
        }));
      }
    }

    let enhancedSystemPrompt = NUTRITION_SYSTEM_PROMPT;
    if (meals && meals.length > 0) {
      const mealsInfo = meals
        .map((m: { name: string; type: string }) => `- ${m.name} (${m.type})`)
        .join("\n");
      enhancedSystemPrompt += `\n\nREFEIÇÕES JÁ EXISTENTES NO DIA DO USUÁRIO:\n${mealsInfo}\n\nUse essas informações para entender o contexto. Se o usuário mencionar uma refeição que já existe, use o tipo correto (ex: se já existe "Almoço", use mealType: "lunch").`;
    }

    if (selectedMeal?.type && selectedMeal.name) {
      enhancedSystemPrompt += `\n\n⚠️ IMPORTANTE - REFEIÇÃO PADRÃO:\nO usuário abriu o chat para adicionar alimentos à refeição "${selectedMeal.name}" (tipo: "${selectedMeal.type}").\n\nSe o usuário NÃO especificar explicitamente qual refeição, você DEVE usar "${selectedMeal.type}" como o mealType padrão.\n\nExemplos:\n- Usuário diz: "comi arroz e feijão" → use mealType: "${selectedMeal.type}"\n- Usuário diz: "comi arroz e feijão no almoço" → use mealType: "lunch"`;
    }

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...(conversationHistory as Array<{
        role: "user" | "assistant";
        content: string;
      }>),
      { role: "user", content: message },
    ];

    const response = await chatCompletion({
      messages,
      systemPrompt: enhancedSystemPrompt,
      temperature: 0.7,
      responseFormat: "json_object",
    });

    const parsed = parseNutritionResponse(response);

    await db.nutritionChatUsage.update({
      where: { id: chatUsage.id },
      data: {
        messageCount: { increment: 1 },
      },
    });

    return {
      foods: parsed.foods,
      message: parsed.message,
      needsConfirmation: parsed.foods.some((f) => f.confidence < 0.8),
      remainingMessages: MAX_MESSAGES_PER_DAY - chatUsage.messageCount - 1,
    };
  } catch (error) {
    console.error("[nutrition/chat] Erro:", error);
    if (error instanceof AuthorizationError) {
      set.status = 403;
      return {
        error: "Acesso Negado",
        message: error.message,
      };
    }
    return internalErrorResponse(set, "Erro ao processar mensagem", error);
  }
}
