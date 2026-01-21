/**
 * API Route para Chat de Nutrição com IA
 * 
 * Valida premium/trial e chama DeepSeek para processar mensagens
 * A IA retorna dados completos dos alimentos (calorias, macros, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';

// Configurar timeout aumentado para operações de IA (podem demorar mais)
export const maxDuration = 60; // 60 segundos (máximo para Vercel Pro)
export const runtime = 'nodejs'; // Garantir runtime Node.js para operações assíncronas
import { requireStudent } from '@/lib/api/middleware/auth.middleware';
import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai/client';
import { NUTRITION_SYSTEM_PROMPT } from '@/lib/ai/prompts/nutrition';
import { parseNutritionResponse } from '@/lib/ai/parsers/nutrition-parser';

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação (requireStudent garante que student existe, inclusive para ADMIN)
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student?.id;
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID não encontrado' },
        { status: 500 }
      );
    }

    // 2. Verificar Premium/Trial
    const subscription = await db.subscription.findUnique({
      where: { studentId },
    });

    if (!subscription) {
      return NextResponse.json(
        {
          error: 'Recurso premium',
          message: 'Esta funcionalidade requer assinatura premium ou trial ativo',
        },
        { status: 403 }
      );
    }

    const now = new Date();
    const isTrialActive =
      subscription.trialEnd && new Date(subscription.trialEnd) > now;
    const isActive = subscription.status === 'active';
    const isTrialing = subscription.status === 'trialing';
    const hasPremium =
      subscription.plan === 'premium' &&
      (isActive || isTrialing || isTrialActive);

    if (!hasPremium) {
      return NextResponse.json(
        {
          error: 'Recurso premium',
          message:
            'Esta funcionalidade requer assinatura premium ou trial ativo',
        },
        { status: 403 }
      );
    }

    // 3. Verificar rate limiting (máximo 20 mensagens por dia)
    // Normalizar data para UTC (evitar problemas de timezone)
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    // Buscar registro de uso do dia (usar findFirst com range para evitar problemas de timezone)
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
          date: startOfDay, // Usar startOfDay para garantir consistência
          messageCount: 0,
        },
      });
    }

    // Verificar se atingiu o limite
    const MAX_MESSAGES_PER_DAY = 20;
    if (chatUsage.messageCount >= MAX_MESSAGES_PER_DAY) {
      return NextResponse.json(
        {
          error: 'Limite diário atingido',
          message: `Você atingiu o limite de ${MAX_MESSAGES_PER_DAY} mensagens por dia. Tente novamente amanhã.`,
          limitReached: true,
        },
        { status: 429 }
      );
    }

    // 4. Processar request
    const body = await request.json();
    const { message, conversationHistory = [], existingMeals = [], selectedMeal } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensagem inválida' },
        { status: 400 }
      );
    }

    // 5. Buscar refeições existentes do dia (se não foram enviadas)
    let meals = existingMeals;
    if (!meals || meals.length === 0) {
      const todayDate = new Date().toISOString().split('T')[0];
      const nutrition = await db.dailyNutrition.findUnique({
        where: {
          studentId_date: {
            studentId,
            date: new Date(todayDate),
          },
        },
        include: {
          meals: {
            orderBy: { order: 'asc' },
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

    // 6. Construir prompt com informações das refeições existentes e refeição selecionada
    let enhancedSystemPrompt = NUTRITION_SYSTEM_PROMPT;
    if (meals && meals.length > 0) {
      const mealsInfo = meals.map((m: any) => `- ${m.name} (${m.type})`).join('\n');
      enhancedSystemPrompt += `\n\nREFEIÇÕES JÁ EXISTENTES NO DIA DO USUÁRIO:\n${mealsInfo}\n\nUse essas informações para entender o contexto. Se o usuário mencionar uma refeição que já existe, use o tipo correto (ex: se já existe "Almoço", use mealType: "lunch").`;
    }

    // IMPORTANTE: Se o usuário clicou no botão "mais" de uma refeição específica,
    // essa refeição deve ser usada como PADRÃO quando o usuário não especificar qual refeição
    if (selectedMeal && selectedMeal.type && selectedMeal.name) {
      enhancedSystemPrompt += `\n\n⚠️ IMPORTANTE - REFEIÇÃO PADRÃO:\nO usuário abriu o chat para adicionar alimentos à refeição "${selectedMeal.name}" (tipo: "${selectedMeal.type}").\n\nSe o usuário NÃO especificar explicitamente qual refeição (ex: "café da manhã", "almoço", "jantar", etc.), você DEVE usar "${selectedMeal.type}" como o mealType padrão para TODOS os alimentos mencionados.\n\nApenas se o usuário mencionar explicitamente uma refeição diferente (ex: "isso foi no almoço" ou "quero adicionar no café da manhã"), você deve usar a refeição mencionada pelo usuário.\n\nExemplos:\n- Usuário diz: "comi arroz e feijão" (sem mencionar refeição) → use mealType: "${selectedMeal.type}"\n- Usuário diz: "comi arroz e feijão no almoço" (mencionou almoço) → use mealType: "lunch"\n- Usuário diz: "comi café da manhã com pão e café" (mencionou café da manhã) → use mealType: "breakfast"`;
    }

    // 7. Chamar DeepSeek
    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: message },
    ];

    const response = await chatCompletion({
      messages,
      systemPrompt: enhancedSystemPrompt,
      temperature: 0.7,
      responseFormat: 'json_object',
    });

    // 8. Parsear resposta (IA já retorna dados completos)
    const parsed = parseNutritionResponse(response);

    // 9. Incrementar contador de mensagens (após sucesso)
    await db.nutritionChatUsage.update({
      where: {
        id: chatUsage.id,
      },
      data: {
        messageCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      foods: parsed.foods,
      message: parsed.message,
      needsConfirmation: parsed.foods.some((f) => f.confidence < 0.8),
      remainingMessages: MAX_MESSAGES_PER_DAY - chatUsage.messageCount - 1,
    });
  } catch (error: any) {
    console.error('[nutrition/chat] Erro:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erro ao processar mensagem',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
