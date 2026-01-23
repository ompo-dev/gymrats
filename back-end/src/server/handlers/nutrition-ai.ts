import { db } from "@/lib/db";
import type { Context } from "elysia";
import { chatCompletion } from "@/lib/ai/client";
import { NUTRITION_SYSTEM_PROMPT } from "@/lib/ai/prompts/nutrition";
import { parseNutritionResponse } from "@/lib/ai/parsers/nutrition-parser";
import { badRequestResponse, internalErrorResponse } from "../utils/response";

type NutritionAiContext = {
  set: Context["set"];
  body?: any;
  studentId: string;
};

export async function nutritionChatHandler({
  set,
  body,
  studentId,
}: NutritionAiContext) {
  try {
    const subscription = await db.subscription.findUnique({
      where: { studentId },
    });

    if (!subscription) {
      set.status = 403;
      return {
        error: "Recurso premium",
        message: "Esta funcionalidade requer assinatura premium ou trial ativo",
      };
    }

    const now = new Date();
    const isTrialActive =
      subscription.trialEnd && new Date(subscription.trialEnd) > now;
    const isActive = subscription.status === "active";
    const isTrialing = subscription.status === "trialing";
    const hasPremium =
      subscription.plan === "premium" &&
      (isActive || isTrialing || isTrialActive);

    if (!hasPremium) {
      set.status = 403;
      return {
        error: "Recurso premium",
        message: "Esta funcionalidade requer assinatura premium ou trial ativo",
      };
    }

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
        meals = nutrition.meals.map((m: any) => ({
          type: m.type,
          name: m.name,
        }));
      }
    }

    let enhancedSystemPrompt = NUTRITION_SYSTEM_PROMPT;
    if (meals && meals.length > 0) {
      const mealsInfo = meals.map((m: any) => `- ${m.name} (${m.type})`).join("\n");
      enhancedSystemPrompt += `\n\nREFEIÇÕES JÁ EXISTENTES NO DIA DO USUÁRIO:\n${mealsInfo}\n\nUse essas informações para entender o contexto. Se o usuário mencionar uma refeição que já existe, use o tipo correto (ex: se já existe "Almoço", use mealType: "lunch").`;
    }

    if (selectedMeal && selectedMeal.type && selectedMeal.name) {
      enhancedSystemPrompt += `\n\n⚠️ IMPORTANTE - REFEIÇÃO PADRÃO:\nO usuário abriu o chat para adicionar alimentos à refeição "${selectedMeal.name}" (tipo: "${selectedMeal.type}").\n\nSe o usuário NÃO especificar explicitamente qual refeição, você DEVE usar "${selectedMeal.type}" como o mealType padrão.\n\nExemplos:\n- Usuário diz: "comi arroz e feijão" → use mealType: "${selectedMeal.type}"\n- Usuário diz: "comi arroz e feijão no almoço" → use mealType: "lunch"`;
    }

    const messages = [
      ...conversationHistory,
      { role: "user" as const, content: message },
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
    return internalErrorResponse(set, "Erro ao processar mensagem", error);
  }
}
