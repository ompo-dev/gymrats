/**
 * API Route para Chat de Treinos com IA
 *
 * Valida premium/trial e chama DeepSeek para processar comandos de treino
 * A IA retorna comandos estruturados (criar, editar, deletar treinos/exercícios)
 */

import { type NextRequest, NextResponse } from "next/server";

// Configurar timeout aumentado para operações de IA (podem demorar mais)
export const maxDuration = 60; // 60 segundos (máximo para Vercel Pro)
export const runtime = "nodejs"; // Garantir runtime Node.js para operações assíncronas

import { chatCompletion } from "@/lib/ai/client";
import { parseWorkoutResponse } from "@/lib/ai/parsers/workout-parser";
import { WORKOUT_SYSTEM_PROMPT } from "@/lib/ai/prompts/workout";
import { requireStudent } from "@/lib/api/middleware/auth.middleware";
import { db } from "@/lib/db";

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
				{ error: "Student ID não encontrado" },
				{ status: 500 },
			);
		}

		// 2. Verificar Premium/Trial
		const subscription = await db.subscription.findUnique({
			where: { studentId },
		});

		if (!subscription) {
			return NextResponse.json(
				{
					error: "Recurso premium",
					message:
						"Esta funcionalidade requer assinatura premium ou trial ativo",
				},
				{ status: 403 },
			);
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
			return NextResponse.json(
				{
					error: "Recurso premium",
					message:
						"Esta funcionalidade requer assinatura premium ou trial ativo",
				},
				{ status: 403 },
			);
		}

		// 3. Verificar rate limiting (máximo 20 mensagens por dia - mesmo limite de nutrição)
		const today = new Date();
		const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
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
			return NextResponse.json(
				{
					error: "Limite diário atingido",
					message: `Você atingiu o limite de ${MAX_MESSAGES_PER_DAY} mensagens por dia. Tente novamente amanhã.`,
					limitReached: true,
				},
				{ status: 429 },
			);
		}

		// 4. Processar request
		const body = await request.json();
		const {
			message,
			conversationHistory = [],
			unitId,
			existingWorkouts: _existingWorkouts = [],
			profile: _profile,
		} = body;

		if (!message || typeof message !== "string") {
			return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });
		}

		if (!unitId || typeof unitId !== "string") {
			return NextResponse.json(
				{ error: "Unit ID é obrigatório" },
				{ status: 400 },
			);
		}

		// 5. Verificar se unit existe e pertence ao student
		const unit = await db.unit.findUnique({
			where: { id: unitId },
			include: {
				workouts: {
					orderBy: { order: "asc" },
					include: {
						exercises: {
							orderBy: { order: "asc" },
						},
					},
				},
			},
		});

		if (!unit) {
			return NextResponse.json(
				{ error: "Unit não encontrada" },
				{ status: 404 },
			);
		}

		if (unit.studentId !== studentId) {
			return NextResponse.json(
				{ error: "Você não tem permissão para editar esta unit" },
				{ status: 403 },
			);
		}

		// 6. Preparar informações sobre workouts existentes para a IA
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

		// 7. Buscar perfil do student para contexto adicional
		const student = await db.student.findUnique({
			where: { id: studentId },
			include: {
				profile: true,
			},
		});

		// 8. Construir prompt contextualizado
		let enhancedSystemPrompt = WORKOUT_SYSTEM_PROMPT;

		// Adicionar informações sobre workouts existentes
		if (workoutsInfo.length > 0) {
			const workoutsInfoText = workoutsInfo
				.map(
					(w) =>
						`- ${w.title} (${w.type}, ${w.muscleGroup}): ${w.exercises.length} exercícios`,
				)
				.join("\n");
			enhancedSystemPrompt += `\n\nWORKOUTS JÁ EXISTENTES NA UNIT:\n${workoutsInfoText}\n\nUse essas informações para entender o contexto. Se o usuário pedir para editar ou deletar, use os IDs e nomes corretos.`;
		}

		// Adicionar informações do perfil do student
		if (student?.profile) {
			const profileData = student.profile;
			const profileInfo: string[] = [];

			if (profileData.fitnessLevel) {
				profileInfo.push(`Nível de fitness: ${profileData.fitnessLevel}`);
			}
			if (profileData.weeklyWorkoutFrequency) {
				profileInfo.push(
					`Frequência semanal: ${profileData.weeklyWorkoutFrequency} dias`,
				);
			}
			if (profileData.workoutDuration) {
				profileInfo.push(
					`Duração preferida: ${profileData.workoutDuration} minutos`,
				);
			}
			if (profileData.preferredSets) {
				profileInfo.push(`Séries preferidas: ${profileData.preferredSets}`);
			}
			if (profileData.preferredRepRange) {
				profileInfo.push(
					`Faixa de repetições preferida: ${profileData.preferredRepRange}`,
				);
			}
			if (profileData.restTime) {
				profileInfo.push(
					`Tempo de descanso preferido: ${profileData.restTime}`,
				);
			}
			if (profileData.gymType) {
				profileInfo.push(`Tipo de academia: ${profileData.gymType}`);
			}
			if (profileData.goals) {
				const goals = JSON.parse(profileData.goals);
				if (Array.isArray(goals) && goals.length > 0) {
					profileInfo.push(`Objetivos: ${goals.join(", ")}`);
				}
			}
			if (profileData.physicalLimitations) {
				const limitations = JSON.parse(profileData.physicalLimitations);
				if (Array.isArray(limitations) && limitations.length > 0) {
					profileInfo.push(`Limitações físicas: ${limitations.join(", ")}`);
				}
			}

			if (profileInfo.length > 0) {
				enhancedSystemPrompt += `\n\nPERFIL DO USUÁRIO:\n${profileInfo.join("\n")}\n\nUse essas informações como padrão quando o usuário não especificar preferências.`;
			}
		}

		// 9. Suporte a IMPORTAÇÃO direta (usuario cola JSON de treino)
		type ImportedExercise = {
			name?: string;
			sets?: number;
			reps?: string;
			rest?: number;
			notes?: string;
			focus?: string | null;
			alternatives?: unknown[];
		};
		type ImportedWorkout = {
			title?: string;
			name?: string;
			description?: string;
			type?: string;
			muscleGroup?: string;
			difficulty?: string;
			exercises?: ImportedExercise[];
		};
		type ParsedResult = {
			intent?: string;
			action?: string;
			workouts?: unknown[];
			message?: string;
			[key: string]: unknown;
		} | null;

		let parsed: ParsedResult = null;
		const tryParseImportedWorkout = (raw: unknown): ParsedResult => {
			const normalizeExercises = (exercises: unknown[]): ImportedExercise[] =>
				(exercises || []).map((ex: ImportedExercise) => ({
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

			const normalizeWorkout = (w: ImportedWorkout) => ({
				title: w.title || w.name || "Treino",
				description: w.description || "",
				type: w.type || "strength",
				muscleGroup: w.muscleGroup || "full-body",
				difficulty: w.difficulty || "intermediario",
				exercises: normalizeExercises(w.exercises || []),
			});

			const rawObj = raw as { workouts?: unknown[]; exercises?: unknown };
			let workoutsArr: ImportedWorkout[] = [];
			if (rawObj?.workouts && Array.isArray(rawObj.workouts)) {
				workoutsArr = rawObj.workouts as ImportedWorkout[];
			} else if (Array.isArray(raw)) {
				workoutsArr = raw as ImportedWorkout[];
			} else if (raw && typeof raw === "object" && rawObj.exercises) {
				workoutsArr = [raw as ImportedWorkout];
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
			}
		} catch {
			// não é JSON válido, segue fluxo normal
		}

		// 10. Chamar DeepSeek somente se não for importação direta
		if (!parsed) {
			const messagesArr = [
				...conversationHistory,
				{ role: "user" as const, content: message },
			];

			const response = await chatCompletion({
				messages: messagesArr,
				systemPrompt: enhancedSystemPrompt,
				temperature: 0.7,
				responseFormat: "json_object",
			});

			parsed = parseWorkoutResponse(response);
		}

		// 11. Incrementar contador de mensagens (após sucesso)
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
			...parsed,
			remainingMessages: MAX_MESSAGES_PER_DAY - chatUsage.messageCount - 1,
		});
	} catch (error: unknown) {
		console.error("[workouts/chat] Erro:", error);
		const err = error instanceof Error ? error : new Error(String(error));
		return NextResponse.json(
			{
				error: err.message || "Erro ao processar mensagem",
				details: process.env.NODE_ENV === "development" ? err.stack : undefined,
			},
			{ status: 500 },
		);
	}
}
