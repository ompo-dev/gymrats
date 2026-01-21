/**
 * API Route para Chat de Treinos com IA - Streaming (SSE)
 * 
 * Usa Server-Sent Events para streaming da resposta da IA
 * Evita timeouts e melhora feedback do usuário
 */

import { NextRequest } from 'next/server';
export const maxDuration = 300; // 5 minutos para operações longas
export const runtime = 'nodejs';

import { requireStudent } from '@/lib/api/middleware/auth.middleware';
import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai/client';
import { WORKOUT_SYSTEM_PROMPT } from '@/lib/ai/prompts/workout';
import { parseWorkoutResponse } from '@/lib/ai/parsers/workout-parser';

/**
 * Enviar evento SSE
 */
function sendSSE(controller: ReadableStreamDefaultController, event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

export async function POST(request: NextRequest) {
  // Clonar request para não consumir o original na autenticação
  const requestClone = request.clone();
  const body = await requestClone.json();
  
  // Criar stream SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Autenticação (usar request original que ainda tem headers/cookies)
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

        // 2. Verificar Premium/Trial
        const subscription = await db.subscription.findUnique({
          where: { studentId },
        });

        if (!subscription) {
          sendSSE(controller, "error", {
            error: "Recurso premium",
            message: "Esta funcionalidade requer assinatura premium ou trial ativo",
          });
          controller.close();
          return;
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
          sendSSE(controller, "error", {
            error: "Recurso premium",
            message: "Esta funcionalidade requer assinatura premium ou trial ativo",
          });
          controller.close();
          return;
        }

        // 3. Verificar rate limiting (apenas para não-admins)
        const isAdmin = auth.user?.role === "ADMIN";
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

        // 4. Processar request (body já foi lido antes)
        const { message, conversationHistory = [], unitId, existingWorkouts = [], profile, reference, previewWorkouts = [] } = body;

        if (!message || typeof message !== 'string') {
          sendSSE(controller, "error", { error: "Mensagem inválida" });
          controller.close();
          return;
        }

        if (!unitId || typeof unitId !== 'string') {
          sendSSE(controller, "error", { error: "Unit ID é obrigatório" });
          controller.close();
          return;
        }

        // 5. Verificar unit
        const unit = await db.unit.findUnique({
          where: { id: unitId },
          include: {
            workouts: {
              orderBy: { order: 'asc' },
              include: { exercises: { orderBy: { order: 'asc' } } },
            },
          },
        });

        if (!unit) {
          sendSSE(controller, "error", { error: "Unit não encontrada" });
          controller.close();
          return;
        }

        if (unit.studentId !== studentId) {
          sendSSE(controller, "error", { error: "Você não tem permissão para editar esta unit" });
          controller.close();
          return;
        }

        // 6. Preparar contexto
        const workoutsInfo = unit.workouts.map((w: any) => ({
          id: w.id,
          title: w.title,
          type: w.type,
          muscleGroup: w.muscleGroup,
          exercises: w.exercises.map((e: any) => ({
            id: e.id,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
          })),
        }));

        const student = await db.student.findUnique({
          where: { id: studentId },
          include: { profile: true },
        });

        // 7. Construir prompt
        let enhancedSystemPrompt = WORKOUT_SYSTEM_PROMPT;

        if (workoutsInfo.length > 0) {
          const workoutsInfoText = workoutsInfo
            .map((w: any) => `- ${w.title} (ID: ${w.id}, ${w.type}, ${w.muscleGroup}): ${w.exercises.length} exercícios`)
            .join('\n');
          enhancedSystemPrompt += `\n\nWORKOUTS JÁ EXISTENTES NA UNIT:\n${workoutsInfoText}\n\nUse essas informações para entender o contexto. Se o usuário pedir para editar ou deletar, use os IDs e nomes corretos.`;
          
          // Se houver referência, adicionar instruções específicas
          if (reference && previewWorkouts.length > 0) {
            const workoutIdentifier = reference.workoutId || reference.workoutTitle;
            
            // Incluir TODOS os workouts dos previews no contexto
            const previewsText = previewWorkouts.map((w: any, idx: number) => 
              `${idx + 1}. ${w.title} (${w.type}, ${w.muscleGroup}): ${w.exercises?.length || 0} exercícios`
            ).join('\n');
            
            enhancedSystemPrompt += `\n\nWORKOUTS EM PREVIEW (AINDA NÃO SALVOS):\n${previewsText}\n\n`;
            
            if (reference.type === "workout") {
              // Incluir estrutura completa dos previews para a IA copiar EXATAMENTE como estão
              const previewsStructure = previewWorkouts.map((w: any, idx: number) => {
                if (idx === reference.workoutIndex) {
                  // Para o workout referenciado, mostrar estrutura mas indicar que deve ser modificado
                  return `  {
    "title": "[MODIFICAR conforme pedido - se pedir mudança de foco, altere o título também]",
    "description": "${w.description || ""}",
    "type": "${w.type}",
    "muscleGroup": "[MODIFICAR se necessário conforme pedido]",
    "difficulty": "${w.difficulty}",
    "exercises": [/* MODIFICAR exercícios conforme pedido do usuário, mantendo estrutura de alternatives */]
  }`;
                } else {
                  // Para os outros workouts, copiar EXATAMENTE como estão
                  const exercisesJson = JSON.stringify(w.exercises || [], null, 2).split('\n').map((line, i) => i === 0 ? line : '    ' + line).join('\n');
                  return `  {
    "title": "${w.title}",
    "description": "${w.description || ""}",
    "type": "${w.type}",
    "muscleGroup": "${w.muscleGroup}",
    "difficulty": "${w.difficulty}",
    "exercises": ${exercisesJson}
  }`;
                }
              }).join(',\n');
              
              enhancedSystemPrompt += `⚠️ ATENÇÃO CRÍTICA: O usuário está REFERENCIANDO o treino "${reference.workoutTitle}" (posição ${reference.workoutIndex + 1} na lista acima). 

REGRA ABSOLUTA: Você DEVE retornar TODOS os ${previewWorkouts.length} workouts no array "workouts", modificando APENAS o referenciado.

- Você DEVE usar action="update_workout" 
- Você DEVE usar targetWorkoutId="${reference.workoutTitle}" (título ORIGINAL antes de qualquer modificação - use este título para identificar qual atualizar)
- Você DEVE atualizar o título se o usuário pedir mudança (ex: se pedir "tire foco dos quadríceps e coloque nos adutores", mude o título de "Pernas - Quadríceps" para "Pernas - Adutores")
- CRÍTICO: Retorne TODOS os ${previewWorkouts.length} workouts no array "workouts"
- O workout na posição ${reference.workoutIndex} (índice ${reference.workoutIndex}) DEVE ser o MODIFICADO conforme pedido do usuário
- Todos os outros workouts (índices diferentes de ${reference.workoutIndex}) devem ser COPIADOS EXATAMENTE como estão abaixo, sem nenhuma modificação
- Estrutura esperada (copie todos, modificando APENAS o referenciado):
"workouts": [
${previewsStructure}
]
- NÃO crie novos workouts, apenas ATUALIZE o referenciado mantendo os demais intactos
- O workout modificado DEVE aparecer na mesma posição (índice ${reference.workoutIndex}) do array
- Se você retornar apenas 1 workout ao invés de ${previewWorkouts.length}, o sistema falhará`;
            } else if (reference.type === "exercise" && reference.exerciseName) {
              enhancedSystemPrompt += `⚠️ ATENÇÃO CRÍTICA: O usuário está REFERENCIANDO o exercício "${reference.exerciseName}" do treino "${reference.workoutTitle}" (posição ${reference.workoutIndex + 1} na lista acima). 
- Você DEVE usar action="replace_exercise" ou "remove_exercise" 
- Você DEVE usar targetWorkoutId="${workoutIdentifier}"
- Você DEVE usar exerciseToReplace com old="${reference.exerciseName}" e new="nome do novo exercício"
- Você DEVE retornar TODOS os ${previewWorkouts.length} workouts no array workouts
- Apenas MODIFIQUE o exercício referenciado no workout referenciado, mantendo TODOS os outros workouts e exercícios EXATAMENTE como estão
- NÃO crie novos workouts, apenas MODIFIQUE o exercício específico`;
            }
          } else if (reference) {
            // Referência sem previews (workout já salvo no banco)
            const workoutIdentifier = reference.workoutId || reference.workoutTitle;
            
            if (reference.type === "workout") {
              enhancedSystemPrompt += `\n\n⚠️ ATENÇÃO CRÍTICA: O usuário está REFERENCIANDO o treino "${reference.workoutTitle}" (Identificador: ${workoutIdentifier}). 
- Você DEVE usar action="update_workout" 
- Você DEVE usar targetWorkoutId="${workoutIdentifier}" (pode ser ID ou título exato)
- Você DEVE atualizar o título se o usuário pedir mudança (ex: de "Quadríceps" para "Adutores")
- Retorne APENAS o workout modificado no array workouts, mas use targetWorkoutId para identificar qual atualizar`;
            } else if (reference.type === "exercise" && reference.exerciseName) {
              enhancedSystemPrompt += `\n\n⚠️ ATENÇÃO CRÍTICA: O usuário está REFERENCIANDO o exercício "${reference.exerciseName}" do treino "${reference.workoutTitle}" (Identificador: ${workoutIdentifier}). 
- Você DEVE usar action="replace_exercise" ou "remove_exercise" 
- Você DEVE usar targetWorkoutId="${workoutIdentifier}"
- Você DEVE usar exerciseToReplace com old="${reference.exerciseName}" e new="nome do novo exercício"
- Retorne APENAS o workout modificado no array workouts`;
            }
          }
        }

        if (student?.profile) {
          const profileData = student.profile;
          const profileInfo: string[] = [];

          if (profileData.fitnessLevel) profileInfo.push(`Nível de fitness: ${profileData.fitnessLevel}`);
          if (profileData.weeklyWorkoutFrequency) profileInfo.push(`Frequência semanal: ${profileData.weeklyWorkoutFrequency} dias`);
          if (profileData.workoutDuration) profileInfo.push(`Duração preferida: ${profileData.workoutDuration} minutos`);
          if (profileData.preferredSets) profileInfo.push(`Séries preferidas: ${profileData.preferredSets}`);
          if (profileData.preferredRepRange) profileInfo.push(`Faixa de repetições preferida: ${profileData.preferredRepRange}`);
          if (profileData.restTime) profileInfo.push(`Tempo de descanso preferido: ${profileData.restTime}`);
          if (profileData.gymType) profileInfo.push(`Tipo de academia: ${profileData.gymType}`);
          if (profileData.goals) {
            const goals = JSON.parse(profileData.goals);
            if (Array.isArray(goals) && goals.length > 0) {
              profileInfo.push(`Objetivos: ${goals.join(', ')}`);
            }
          }
          if (profileData.physicalLimitations) {
            const limitations = JSON.parse(profileData.physicalLimitations);
            if (Array.isArray(limitations) && limitations.length > 0) {
              profileInfo.push(`Limitações físicas: ${limitations.join(', ')}`);
            }
          }

          if (profileInfo.length > 0) {
            enhancedSystemPrompt += `\n\nPERFIL DO USUÁRIO:\n${profileInfo.join('\n')}\n\nUse essas informações como padrão quando o usuário não especificar preferências.`;
          }
        }

        // 8. Enviar status inicial
        sendSSE(controller, "status", { status: "processing", message: "Gerando treino..." });

        // 9. Suporte a importação direta
        let parsed: any = null;
        const tryParseImportedWorkout = (raw: any) => {
          const normalizeExercises = (exercises: any[]): any[] =>
            (exercises || []).map((ex: any) => ({
              name: ex.name,
              sets: ex.sets ?? 3,
              reps: ex.reps ?? "8-12",
              rest: ex.rest ?? 60,
              notes: ex.notes ?? undefined,
              focus: ex.focus ?? null,
              alternatives:
                Array.isArray(ex.alternatives) && ex.alternatives.length > 0
                  ? ex.alternatives.slice(0, 3)
                  : [],
            }));

          const normalizeWorkout = (w: any) => ({
            title: w.title || w.name || "Treino",
            description: w.description || "",
            type: w.type || "strength",
            muscleGroup: w.muscleGroup || "full-body",
            difficulty: w.difficulty || "intermediario",
            exercises: normalizeExercises(w.exercises || []),
          });

          let workoutsArr: any[] = [];
          if (raw?.workouts && Array.isArray(raw.workouts)) {
            workoutsArr = raw.workouts;
          } else if (Array.isArray(raw)) {
            workoutsArr = raw;
          } else if (raw && typeof raw === "object" && raw.exercises) {
            workoutsArr = [raw];
          }

          if (workoutsArr.length === 0) return null;

          return {
            intent: "create",
            action: "create_workouts",
            workouts: workoutsArr.map(normalizeWorkout),
            message: "Treino importado e pronto para aplicar.",
          };
        };

        // Se mensagem é JSON, tentar importar diretamente
        try {
          if (message.trim().startsWith("{") || message.trim().startsWith("[")) {
            const rawJson = JSON.parse(message);
            parsed = tryParseImportedWorkout(rawJson);
            sendSSE(controller, "status", { status: "imported", message: "Treino importado com sucesso!" });
          }
        } catch {
          // não é JSON válido, segue fluxo normal
        }

        // 10. Chamar DeepSeek se não for importação
        if (!parsed) {
          sendSSE(controller, "status", { status: "calling_ai", message: "Consultando IA..." });
          
          const messagesArr = [
            ...conversationHistory,
            { role: 'user' as const, content: message },
          ];

          try {
            const response = await chatCompletion({
              messages: messagesArr,
              systemPrompt: enhancedSystemPrompt,
              temperature: 0.7,
              responseFormat: 'json_object',
            });

            sendSSE(controller, "status", { status: "parsing", message: "Processando resposta..." });
            parsed = parseWorkoutResponse(response);
          } catch (error: any) {
            sendSSE(controller, "error", {
              error: error.message || "Erro ao processar mensagem",
            });
            controller.close();
            return;
          }
        }

        // 11. Normalizar resposta quando há referência para garantir consistência (nunca criar 6º treino)
        if (reference && Array.isArray(previewWorkouts) && previewWorkouts.length > 0 && parsed?.workouts) {
          const modifiedIndex = typeof reference.workoutIndex === "number" ? reference.workoutIndex : 0;
          const mergedWorkouts = [...previewWorkouts];

          if (parsed.workouts.length === previewWorkouts.length) {
            // IA retornou todos: preservar todos os não referenciados exatamente como estavam (evita renumeração 6..10)
            // e aplicar apenas o modificado na posição correta.
            mergedWorkouts[modifiedIndex] = parsed.workouts[modifiedIndex];
          } else if (parsed.workouts.length === 1) {
            // IA retornou só o workout modificado: substituir somente o referenciado
            mergedWorkouts[modifiedIndex] = parsed.workouts[0];
          } else {
            // IA retornou quantidade diferente: escolher melhor candidato e descartar extras
            const byTitle = parsed.workouts.find((w: any) =>
              w.title?.toLowerCase().trim() === reference.workoutTitle?.toLowerCase().trim()
            );
            mergedWorkouts[modifiedIndex] = byTitle || parsed.workouts[0];
          }

          parsed.workouts = mergedWorkouts;
          // Garantir action/targetWorkoutId coerentes
          parsed.action = parsed.action || "update_workout";
          parsed.targetWorkoutId = reference.workoutTitle;
        }

        // 12. Incrementar contador (apenas para não-admins)
        if (!isAdmin && chatUsage) {
          await db.nutritionChatUsage.update({
            where: { id: chatUsage.id },
            data: { messageCount: { increment: 1 } },
          });
        }

        // 13. Enviar workouts progressivamente (um por vez)
        if (parsed.workouts && parsed.workouts.length > 0) {
          for (let i = 0; i < parsed.workouts.length; i++) {
            const workout = parsed.workouts[i];
            sendSSE(controller, "workout_progress", {
              workout,
              index: i,
              total: parsed.workouts.length,
            });
            
            // Pequeno delay entre workouts para melhor UX
            if (i < parsed.workouts.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
        }

        // 14. Enviar resultado final (completo)
        const remainingMessages = isAdmin 
          ? null 
          : (MAX_MESSAGES_PER_DAY - (chatUsage?.messageCount || 0) - 1);
        
        sendSSE(controller, "complete", {
          ...parsed,
          remainingMessages,
        });

        controller.close();
      } catch (error: any) {
        console.error('[workouts/chat-stream] Erro:', error);
        sendSSE(controller, "error", {
          error: error.message || "Erro ao processar mensagem",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
