import type { Context } from "elysia";
import { chatCompletion } from "@/lib/ai/client";
import { parseWorkoutResponse } from "@/lib/ai/parsers/workout-parser";
import { WORKOUT_SYSTEM_PROMPT } from "@/lib/ai/prompts/workout";
import { db } from "@/lib/db";
import { exerciseDatabase } from "@/lib/educational-data";
import {
	calculateReps,
	calculateRest,
	calculateSets,
	generateAlternatives,
	generatePersonalizedWorkoutPlan,
	updateExercisesWithAlternatives,
} from "@/lib/services/personalized-workout-generator";
import { populateWorkoutExercisesWithEducationalData } from "@/lib/services/populate-workout-exercises-educational-data";
import type { ExerciseInfo } from "@/lib/types";
import {
	badRequestResponse,
	internalErrorResponse,
	successResponse,
} from "../utils/response";

type WorkoutsAiContext = {
	set: Context["set"];
	body?: any;
	studentId: string;
	user?: { role?: string };
	request: Request;
};

export async function generateWorkoutsHandler({
	set,
	studentId,
}: WorkoutsAiContext) {
	try {
		const student = await db.student.findUnique({
			where: { id: studentId },
			include: { profile: true },
		});

		if (!student || !student.profile) {
			set.status = 404;
			return {
				success: false,
				error:
					"Perfil do aluno não encontrado. Complete o onboarding primeiro.",
			};
		}

		const existingUnits = await db.unit.count({ where: { studentId } });
		if (existingUnits > 0) {
			await db.unit.deleteMany({ where: { studentId } });
		}

		const profile: any = {
			age: student.age,
			gender: student.gender,
			fitnessLevel: student.profile.fitnessLevel as
				| "iniciante"
				| "intermediario"
				| "avancado"
				| null,
			height: student.profile.height,
			weight: student.profile.weight,
			goals: student.profile.goals ? JSON.parse(student.profile.goals) : [],
			weeklyWorkoutFrequency: student.profile.weeklyWorkoutFrequency,
			workoutDuration: student.profile.workoutDuration,
			preferredSets: student.profile.preferredSets || null,
			preferredRepRange: student.profile.preferredRepRange as
				| "forca"
				| "hipertrofia"
				| "resistencia"
				| null,
			restTime: student.profile.restTime as "curto" | "medio" | "longo" | null,
			gymType: student.profile.gymType as
				| "academia-completa"
				| "academia-basica"
				| "home-gym"
				| "peso-corporal"
				| null,
			activityLevel: student.profile.activityLevel,
			physicalLimitations: student.profile.physicalLimitations
				? JSON.parse(student.profile.physicalLimitations)
				: [],
			motorLimitations: student.profile.motorLimitations
				? JSON.parse(student.profile.motorLimitations)
				: [],
			medicalConditions: student.profile.medicalConditions
				? JSON.parse(student.profile.medicalConditions)
				: [],
			limitationDetails: student.profile.limitationDetails
				? JSON.parse(student.profile.limitationDetails)
				: null,
		};

		await generatePersonalizedWorkoutPlan(studentId, profile);
		await updateExercisesWithAlternatives(studentId);
		await populateWorkoutExercisesWithEducationalData(studentId);

		return successResponse(set, {
			message: "Treinos personalizados gerados com sucesso",
		});
	} catch (error) {
		console.error("[generateWorkouts] Erro:", error);
		return internalErrorResponse(
			set,
			"Erro ao gerar treinos personalizados",
			error,
		);
	}
}

export async function updateAlternativesHandler({
	set,
	studentId,
}: WorkoutsAiContext) {
	try {
		await updateExercisesWithAlternatives(studentId);
		return successResponse(set, {
			message: "Alternativas adicionadas aos exercícios com sucesso!",
		});
	} catch (error) {
		console.error("[PATCH /api/workouts/generate] Erro:", error);
		return internalErrorResponse(set, "Erro ao atualizar alternativas", error);
	}
}

export async function populateEducationalDataHandler({
	set,
}: WorkoutsAiContext) {
	try {
		const result = await populateWorkoutExercisesWithEducationalData();
		return successResponse(set, {
			message: "Exercícios populados com dados educacionais",
			...result,
		});
	} catch (error) {
		console.error("[populateEducationalData] Erro:", error);
		return internalErrorResponse(
			set,
			"Erro ao popular exercícios com dados educacionais",
			error,
		);
	}
}

export async function processWorkoutsCommandHandler({
	set,
	body,
	studentId,
}: WorkoutsAiContext) {
	try {
		const { parsedPlan, unitId } = body || {};

		if (!parsedPlan) {
			return badRequestResponse(set, "Comando inválido");
		}

		if (!unitId || typeof unitId !== "string") {
			return badRequestResponse(set, "Unit ID é obrigatório");
		}

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
			return badRequestResponse(set, "Unit não encontrada");
		}

		if (unit.studentId !== studentId) {
			return badRequestResponse(
				set,
				"Você não tem permissão para editar esta unit",
			);
		}

		const student = await db.student.findUnique({
			where: { id: studentId },
			include: { profile: true },
		});

		if (!student?.profile) {
			return badRequestResponse(set, "Perfil do aluno não encontrado");
		}

		const results = {
			created: [] as string[],
			updated: [] as string[],
			deleted: [] as string[],
			errors: [] as string[],
		};

		switch (parsedPlan.action) {
			case "create_workouts": {
				for (let i = 0; i < parsedPlan.workouts.length; i++) {
					const workoutPlan = parsedPlan.workouts[i];
					try {
						const lastOrder =
							unit.workouts.length > 0
								? Math.max(...unit.workouts.map((w: any) => w.order || 0)) +
									i +
									1
								: i;

						const workout = await db.workout.create({
							data: {
								unitId,
								title: workoutPlan.title,
								description: workoutPlan.description || "",
								type: workoutPlan.type,
								muscleGroup: workoutPlan.muscleGroup,
								difficulty: workoutPlan.difficulty,
								estimatedTime: 0,
								order: lastOrder,
							},
						});

						results.created.push(`Workout: ${workoutPlan.title}`);

						const exercises = await createExercisesInBatch(
							workout.id,
							workoutPlan.exercises,
							student.profile,
							workoutPlan.difficulty,
						);

						results.created.push(
							`${exercises.length} exercícios em ${workoutPlan.title}`,
						);
					} catch (error: any) {
						results.errors.push(
							`Erro ao criar workout ${workoutPlan.title}: ${error.message}`,
						);
					}
				}
				break;
			}
			case "delete_workout": {
				if (parsedPlan.targetWorkoutId) {
					const workout = unit.workouts.find(
						(w: any) => w.id === parsedPlan.targetWorkoutId,
					);
					if (workout) {
						await db.workout.delete({
							where: { id: parsedPlan.targetWorkoutId },
						});
						results.deleted.push(`Workout: ${workout.title}`);
					}
				}
				break;
			}
			case "add_exercise": {
				if (parsedPlan.targetWorkoutId && parsedPlan.workouts.length > 0) {
					const workoutPlan = parsedPlan.workouts[0];
					const targetWorkout = unit.workouts.find(
						(w: any) => w.id === parsedPlan.targetWorkoutId,
					);

					if (targetWorkout) {
						const currentExerciseCount = targetWorkout.exercises.length;

						const exercises = await createExercisesInBatch(
							parsedPlan.targetWorkoutId,
							workoutPlan.exercises,
							student.profile,
							workoutPlan.difficulty,
							currentExerciseCount,
						);

						results.created.push(`${exercises.length} exercícios adicionados`);
					}
				}
				break;
			}
			case "remove_exercise": {
				if (parsedPlan.targetWorkoutId && parsedPlan.exerciseToRemove) {
					const workout = unit.workouts.find(
						(w: any) => w.id === parsedPlan.targetWorkoutId,
					);
					if (workout) {
						const exercise = workout.exercises.find(
							(e: any) =>
								e.name
									.toLowerCase()
									.includes(parsedPlan.exerciseToRemove?.toLowerCase()) ||
								parsedPlan.exerciseToRemove
									?.toLowerCase()
									.includes(e.name.toLowerCase()),
						);

						if (exercise) {
							await db.workoutExercise.delete({
								where: { id: exercise.id },
							});
							results.deleted.push(`Exercício: ${exercise.name}`);
						}
					}
				}
				break;
			}
			case "replace_exercise": {
				if (parsedPlan.workouts.length > 1) {
					await db.workoutExercise.deleteMany({
						where: { workout: { unitId } },
					});
					await db.workout.deleteMany({ where: { unitId } });

					for (let i = 0; i < parsedPlan.workouts.length; i++) {
						const workoutPlan = parsedPlan.workouts[i];
						const newWorkout = await db.workout.create({
							data: {
								unitId,
								title: workoutPlan.title,
								description: workoutPlan.description || "",
								type: workoutPlan.type,
								muscleGroup: workoutPlan.muscleGroup,
								difficulty: workoutPlan.difficulty,
								estimatedTime: 0,
								order: i,
							},
						});

						const exercises = await createExercisesInBatch(
							newWorkout.id,
							workoutPlan.exercises,
							student.profile,
							workoutPlan.difficulty,
							0,
							db,
						);

						results.created.push(`Workout: ${workoutPlan.title}`);
						results.created.push(
							`${exercises.length} exercícios em ${workoutPlan.title}`,
						);
					}
				} else if (
					parsedPlan.targetWorkoutId &&
					parsedPlan.exerciseToReplace &&
					parsedPlan.workouts.length > 0
				) {
					const workout = unit.workouts.find(
						(w: any) => w.id === parsedPlan.targetWorkoutId,
					);
					if (workout) {
						const oldExercise = workout.exercises.find(
							(e: any) =>
								e.name
									.toLowerCase()
									.includes(parsedPlan.exerciseToReplace?.old.toLowerCase()) ||
								parsedPlan.exerciseToReplace?.old
									.toLowerCase()
									.includes(e.name.toLowerCase()),
						);

						if (oldExercise && parsedPlan.workouts[0].exercises.length > 0) {
							const newExercisePlan = parsedPlan.workouts[0].exercises[0];
							const order = oldExercise.order || 0;

							await db.workoutExercise.delete({
								where: { id: oldExercise.id },
							});

							const _exercises = await createExercisesInBatch(
								parsedPlan.targetWorkoutId,
								[newExercisePlan],
								student.profile,
								"intermediario",
								order,
								db,
							);

							results.deleted.push(`Exercício: ${oldExercise.name}`);
							results.created.push(`Exercício: ${newExercisePlan.name}`);
						}
					}
				}
				break;
			}
			case "update_workout": {
				if (parsedPlan.workouts.length > 1) {
					await db.workoutExercise.deleteMany({
						where: { workout: { unitId } },
					});
					await db.workout.deleteMany({ where: { unitId } });

					for (let i = 0; i < parsedPlan.workouts.length; i++) {
						const workoutPlan = parsedPlan.workouts[i];
						const newWorkout = await db.workout.create({
							data: {
								unitId,
								title: workoutPlan.title,
								description: workoutPlan.description || "",
								type: workoutPlan.type,
								muscleGroup: workoutPlan.muscleGroup,
								difficulty: workoutPlan.difficulty,
								estimatedTime: 0,
								order: i,
							},
						});

						const exercises = await createExercisesInBatch(
							newWorkout.id,
							workoutPlan.exercises,
							student.profile,
							workoutPlan.difficulty,
							0,
							db,
						);

						results.created.push(`Workout: ${workoutPlan.title}`);
						results.created.push(
							`${exercises.length} exercícios em ${workoutPlan.title}`,
						);
					}
				} else if (
					parsedPlan.targetWorkoutId &&
					parsedPlan.workouts.length > 0
				) {
					const workoutPlan = parsedPlan.workouts[0];
					let targetWorkout = unit.workouts.find(
						(w: any) => w.id === parsedPlan.targetWorkoutId,
					);

					if (!targetWorkout) {
						targetWorkout = unit.workouts.find((w: any) => {
							const targetTitle = parsedPlan.targetWorkoutId
								.toLowerCase()
								.trim();
							const workoutTitle = w.title.toLowerCase().trim();
							return (
								workoutTitle === targetTitle ||
								workoutTitle.includes(targetTitle) ||
								targetTitle.includes(workoutTitle)
							);
						});
					}

					if (targetWorkout) {
						await db.workout.update({
							where: { id: targetWorkout.id },
							data: {
								title: workoutPlan.title,
								description: workoutPlan.description || "",
								type: workoutPlan.type,
								muscleGroup: workoutPlan.muscleGroup,
								difficulty: workoutPlan.difficulty,
							},
						});

						await db.workoutExercise.deleteMany({
							where: { workoutId: targetWorkout.id },
						});

						const exercises = await createExercisesInBatch(
							targetWorkout.id,
							workoutPlan.exercises,
							student.profile,
							workoutPlan.difficulty,
						);

						results.updated.push(`Workout: ${workoutPlan.title}`);
						results.created.push(
							`${exercises.length} exercícios em ${workoutPlan.title}`,
						);
					} else {
						const lastOrder =
							unit.workouts.length > 0
								? Math.max(...unit.workouts.map((w: any) => w.order || 0)) + 1
								: 0;

						const newWorkout = await db.workout.create({
							data: {
								unitId,
								title: workoutPlan.title,
								description: workoutPlan.description || "",
								type: workoutPlan.type,
								muscleGroup: workoutPlan.muscleGroup,
								difficulty: workoutPlan.difficulty,
								estimatedTime: 0,
								order: lastOrder,
							},
						});

						const exercises = await createExercisesInBatch(
							newWorkout.id,
							workoutPlan.exercises,
							student.profile,
							workoutPlan.difficulty,
						);

						results.created.push(`Workout: ${workoutPlan.title}`);
						results.created.push(
							`${exercises.length} exercícios em ${workoutPlan.title}`,
						);
					}
				}
				break;
			}
			default:
				return badRequestResponse(
					set,
					`Ação não suportada: ${parsedPlan.action}`,
				);
		}

		return successResponse(set, {
			message: "Comando processado com sucesso",
			results,
		});
	} catch (error) {
		console.error("[workouts/process] Erro:", error);
		return internalErrorResponse(set, "Erro ao processar comando", error);
	}
}

export async function chatWorkoutsHandler({
	set,
	body,
	studentId,
}: WorkoutsAiContext) {
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
			where: { studentId, date: { gte: startOfDay, lte: endOfDay } },
		});

		if (!chatUsage) {
			chatUsage = await db.nutritionChatUsage.create({
				data: { studentId, date: startOfDay, messageCount: 0 },
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
			unitId,
			existingWorkouts = [],
			profile,
		} = body || {};

		if (!message || typeof message !== "string") {
			return badRequestResponse(set, "Mensagem inválida");
		}

		if (!unitId || typeof unitId !== "string") {
			return badRequestResponse(set, "Unit ID é obrigatório");
		}

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
			set.status = 404;
			return { error: "Unit não encontrada" };
		}

		if (unit.studentId !== studentId) {
			set.status = 403;
			return { error: "Você não tem permissão para editar esta unit" };
		}

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

		let enhancedSystemPrompt = WORKOUT_SYSTEM_PROMPT;
		if (workoutsInfo.length > 0) {
			const workoutsInfoText = workoutsInfo
				.map(
					(w: any) =>
						`- ${w.title} (${w.type}, ${w.muscleGroup}): ${w.exercises.length} exercícios`,
				)
				.join("\n");
			enhancedSystemPrompt += `\n\nWORKOUTS JÁ EXISTENTES NA UNIT:\n${workoutsInfoText}\n\nUse essas informações para entender o contexto. Se o usuário pedir para editar ou deletar, use os IDs e nomes corretos.`;
		}

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
				enhancedSystemPrompt += `\n\nPERFIL DO USUÁRIO:\n${profileInfo.join(
					"\n",
				)}\n\nUse essas informações como padrão quando o usuário não especificar preferências.`;
			}
		}

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

		try {
			if (message.trim().startsWith("{") || message.trim().startsWith("[")) {
				const rawJson = JSON.parse(message);
				parsed = tryParseImportedWorkout(rawJson);
			}
		} catch {}

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

		await db.nutritionChatUsage.update({
			where: { id: chatUsage.id },
			data: { messageCount: { increment: 1 } },
		});

		return {
			...parsed,
			remainingMessages: MAX_MESSAGES_PER_DAY - chatUsage.messageCount - 1,
		};
	} catch (error) {
		console.error("[workouts/chat] Erro:", error);
		return internalErrorResponse(set, "Erro ao processar mensagem", error);
	}
}

export async function chatStreamWorkoutsHandler({
	body,
	studentId,
	user,
	request,
}: WorkoutsAiContext) {
	const stream = new ReadableStream({
		async start(controller) {
			const sendSSE = (event: string, data: any) => {
				const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
				controller.enqueue(new TextEncoder().encode(message));
			};

			try {
				const subscription = await db.subscription.findUnique({
					where: { studentId },
				});

				if (!subscription) {
					sendSSE("error", {
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
				const isActive = subscription.status === "active";
				const isTrialing = subscription.status === "trialing";
				const hasPremium =
					subscription.plan === "premium" &&
					(isActive || isTrialing || isTrialActive);

				if (!hasPremium) {
					sendSSE("error", {
						error: "Recurso premium",
						message:
							"Esta funcionalidade requer assinatura premium ou trial ativo",
					});
					controller.close();
					return;
				}

				const isAdmin = user?.role === "ADMIN";
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
						sendSSE("error", {
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
					reference,
					previewWorkouts = [],
				} = body || {};

				if (!message || typeof message !== "string") {
					sendSSE("error", { error: "Mensagem inválida" });
					controller.close();
					return;
				}

				if (!unitId || typeof unitId !== "string") {
					sendSSE("error", { error: "Unit ID é obrigatório" });
					controller.close();
					return;
				}

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
					sendSSE("error", { error: "Unit não encontrada" });
					controller.close();
					return;
				}

				if (unit.studentId !== studentId) {
					sendSSE("error", {
						error: "Você não tem permissão para editar esta unit",
					});
					controller.close();
					return;
				}

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

				let enhancedSystemPrompt = WORKOUT_SYSTEM_PROMPT;
				if (workoutsInfo.length > 0) {
					const workoutsInfoText = workoutsInfo
						.map(
							(w: any) =>
								`- ${w.title} (ID: ${w.id}, ${w.type}, ${w.muscleGroup}): ${w.exercises.length} exercícios`,
						)
						.join("\n");
					enhancedSystemPrompt += `\n\nWORKOUTS JÁ EXISTENTES NA UNIT:\n${workoutsInfoText}\n\nUse essas informações para entender o contexto. Se o usuário pedir para editar ou deletar, use os IDs e nomes corretos.`;

					if (reference && previewWorkouts.length > 0) {
						const workoutIdentifier =
							reference.workoutId || reference.workoutTitle;
						const previewsText = previewWorkouts
							.map(
								(w: any, idx: number) =>
									`${idx + 1}. ${w.title} (${w.type}, ${w.muscleGroup}): ${
										w.exercises?.length || 0
									} exercícios`,
							)
							.join("\n");

						enhancedSystemPrompt += `\n\nWORKOUTS EM PREVIEW (AINDA NÃO SALVOS):\n${previewsText}\n\n`;

						if (reference.type === "workout") {
							const previewsStructure = previewWorkouts
								.map((w: any, idx: number) => {
									if (idx === reference.workoutIndex) {
										return `  {
    "title": "[MODIFICAR conforme pedido - se pedir mudança de foco, altere o título também]",
    "description": "${w.description || ""}",
    "type": "${w.type}",
    "muscleGroup": "[MODIFICAR se necessário conforme pedido]",
    "difficulty": "${w.difficulty}",
    "exercises": [/* MODIFICAR exercícios conforme pedido do usuário, mantendo estrutura de alternatives */]
  }`;
									}
									const exercisesJson = JSON.stringify(
										w.exercises || [],
										null,
										2,
									)
										.split("\n")
										.map((line, i) => (i === 0 ? line : `    ${line}`))
										.join("\n");
									return `  {
    "title": "${w.title}",
    "description": "${w.description || ""}",
    "type": "${w.type}",
    "muscleGroup": "${w.muscleGroup}",
    "difficulty": "${w.difficulty}",
    "exercises": ${exercisesJson}
  }`;
								})
								.join(",\n");

							enhancedSystemPrompt += `⚠️ ATENÇÃO CRÍTICA: O usuário está REFERENCIANDO o treino "${reference.workoutTitle}" (posição ${
								reference.workoutIndex + 1
							} na lista acima). 

REGRA ABSOLUTA: Você DEVE retornar TODOS os ${
								previewWorkouts.length
							} workouts no array "workouts", modificando APENAS o referenciado.

- Você DEVE usar action="update_workout" 
- Você DEVE usar targetWorkoutId="${reference.workoutTitle}"
- Você DEVE atualizar o título se o usuário pedir mudança
- CRÍTICO: Retorne TODOS os ${
								previewWorkouts.length
							} workouts no array "workouts"
- O workout na posição ${reference.workoutIndex} (índice ${
								reference.workoutIndex
							}) DEVE ser o MODIFICADO
- Todos os outros workouts devem ser COPIADOS EXATAMENTE como estão abaixo
- Estrutura esperada:
"workouts": [
${previewsStructure}
]
- NÃO crie novos workouts, apenas ATUALIZE o referenciado`;
						} else if (
							reference.type === "exercise" &&
							reference.exerciseName
						) {
							enhancedSystemPrompt += `⚠️ ATENÇÃO CRÍTICA: O usuário está REFERENCIANDO o exercício "${reference.exerciseName}" do treino "${reference.workoutTitle}".
- Você DEVE usar action="replace_exercise" ou "remove_exercise"
- Você DEVE usar targetWorkoutId="${workoutIdentifier}"
- Você DEVE usar exerciseToReplace com old="${reference.exerciseName}" e new="nome do novo exercício"
- Você DEVE retornar TODOS os ${previewWorkouts.length} workouts no array workouts
- Apenas MODIFIQUE o exercício referenciado`;
						}
					} else if (reference) {
						const workoutIdentifier =
							reference.workoutId || reference.workoutTitle;
						if (reference.type === "workout") {
							enhancedSystemPrompt += `\n\n⚠️ ATENÇÃO CRÍTICA: O usuário está REFERENCIANDO o treino "${reference.workoutTitle}" (Identificador: ${workoutIdentifier}).
- Você DEVE usar action="update_workout"
- Você DEVE usar targetWorkoutId="${workoutIdentifier}"`;
						} else if (
							reference.type === "exercise" &&
							reference.exerciseName
						) {
							enhancedSystemPrompt += `\n\n⚠️ ATENÇÃO CRÍTICA: O usuário está REFERENCIANDO o exercício "${reference.exerciseName}" do treino "${reference.workoutTitle}".
- Você DEVE usar action="replace_exercise" ou "remove_exercise"
- Você DEVE usar targetWorkoutId="${workoutIdentifier}"`;
						}
					}
				}

				if (student?.profile) {
					const profileData = student.profile;
					const profileInfo: string[] = [];
					if (profileData.fitnessLevel)
						profileInfo.push(`Nível de fitness: ${profileData.fitnessLevel}`);
					if (profileData.weeklyWorkoutFrequency)
						profileInfo.push(
							`Frequência semanal: ${profileData.weeklyWorkoutFrequency} dias`,
						);
					if (profileData.workoutDuration)
						profileInfo.push(
							`Duração preferida: ${profileData.workoutDuration} minutos`,
						);
					if (profileData.preferredSets)
						profileInfo.push(`Séries preferidas: ${profileData.preferredSets}`);
					if (profileData.preferredRepRange)
						profileInfo.push(
							`Faixa de repetições preferida: ${profileData.preferredRepRange}`,
						);
					if (profileData.restTime)
						profileInfo.push(
							`Tempo de descanso preferido: ${profileData.restTime}`,
						);
					if (profileData.gymType)
						profileInfo.push(`Tipo de academia: ${profileData.gymType}`);
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
						enhancedSystemPrompt += `\n\nPERFIL DO USUÁRIO:\n${profileInfo.join(
							"\n",
						)}\n\nUse essas informações como padrão quando o usuário não especificar preferências.`;
					}
				}

				sendSSE("status", {
					status: "processing",
					message: "Gerando treino...",
				});

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

				try {
					if (
						message.trim().startsWith("{") ||
						message.trim().startsWith("[")
					) {
						const rawJson = JSON.parse(message);
						parsed = tryParseImportedWorkout(rawJson);
						sendSSE("status", {
							status: "imported",
							message: "Treino importado com sucesso!",
						});
					}
				} catch {}

				if (!parsed) {
					sendSSE("status", {
						status: "calling_ai",
						message: "Consultando IA...",
					});

					const messagesArr = [
						...conversationHistory,
						{ role: "user" as const, content: message },
					];

					try {
						const response = await chatCompletion({
							messages: messagesArr,
							systemPrompt: enhancedSystemPrompt,
							temperature: 0.7,
							responseFormat: "json_object",
						});

						sendSSE("status", {
							status: "parsing",
							message: "Processando resposta...",
						});
						parsed = parseWorkoutResponse(response);
					} catch (error: any) {
						sendSSE("error", {
							error: error.message || "Erro ao processar mensagem",
						});
						controller.close();
						return;
					}
				}

				if (
					reference &&
					Array.isArray(previewWorkouts) &&
					previewWorkouts.length > 0 &&
					parsed?.workouts
				) {
					const modifiedIndex =
						typeof reference.workoutIndex === "number"
							? reference.workoutIndex
							: 0;
					const mergedWorkouts = [...previewWorkouts];

					if (parsed.workouts.length === previewWorkouts.length) {
						mergedWorkouts[modifiedIndex] = parsed.workouts[modifiedIndex];
					} else if (parsed.workouts.length === 1) {
						mergedWorkouts[modifiedIndex] = parsed.workouts[0];
					} else {
						const byTitle = parsed.workouts.find(
							(w: any) =>
								w.title?.toLowerCase().trim() ===
								reference.workoutTitle?.toLowerCase().trim(),
						);
						mergedWorkouts[modifiedIndex] = byTitle || parsed.workouts[0];
					}

					parsed.workouts = mergedWorkouts;
					parsed.action = parsed.action || "update_workout";
					parsed.targetWorkoutId = reference.workoutTitle;
				}

				if (!isAdmin && chatUsage) {
					await db.nutritionChatUsage.update({
						where: { id: chatUsage.id },
						data: { messageCount: { increment: 1 } },
					});
				}

				if (parsed.workouts && parsed.workouts.length > 0) {
					for (let i = 0; i < parsed.workouts.length; i++) {
						const workout = parsed.workouts[i];
						sendSSE("workout_progress", {
							workout,
							index: i,
							total: parsed.workouts.length,
						});

						if (i < parsed.workouts.length - 1) {
							await new Promise((resolve) => setTimeout(resolve, 300));
						}
					}
				}

				const remainingMessages = isAdmin
					? null
					: MAX_MESSAGES_PER_DAY - (chatUsage?.messageCount || 0) - 1;

				sendSSE("complete", {
					...parsed,
					remainingMessages,
				});

				controller.close();
			} catch (error: any) {
				console.error("[workouts/chat-stream] Erro:", error);
				sendSSE("error", {
					error: error.message || "Erro ao processar mensagem",
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

async function createExercisesInBatch(
	workoutId: string,
	exercises: Array<{
		name: string;
		sets: number;
		reps: string;
		rest: number;
		notes?: string;
		alternatives?: string[];
	}>,
	profile: any,
	defaultDifficulty: string,
	startOrder = 0,
	prismaClient: typeof db = db,
): Promise<any[]> {
	const createdExercises = [];

	for (let i = 0; i < exercises.length; i++) {
		const exercisePlan = exercises[i];

		try {
			const exerciseInfo = findOrCreateExercise(exercisePlan.name);

			const calculatedSets =
				exercisePlan.sets ||
				calculateSets(
					profile.preferredSets,
					profile.activityLevel,
					profile.fitnessLevel,
				);
			const calculatedReps =
				exercisePlan.reps ||
				calculateReps(
					profile.preferredRepRange,
					profile.goals ? JSON.parse(profile.goals) : [],
				);
			const calculatedRest =
				exercisePlan.rest !== undefined
					? exercisePlan.rest
					: calculateRest(profile.restTime, profile.preferredRepRange);

			const exercise = await prismaClient.workoutExercise.create({
				data: {
					workoutId,
					name: exerciseInfo.name,
					sets: calculatedSets,
					reps: calculatedReps,
					rest: calculatedRest,
					notes: exercisePlan.notes || null,
					educationalId: exerciseInfo.id,
					order: startOrder + i,
					primaryMuscles: exerciseInfo.primaryMuscles?.length
						? JSON.stringify(exerciseInfo.primaryMuscles)
						: null,
					secondaryMuscles: exerciseInfo.secondaryMuscles?.length
						? JSON.stringify(exerciseInfo.secondaryMuscles)
						: null,
					difficulty: exerciseInfo.difficulty || defaultDifficulty,
					equipment: exerciseInfo.equipment?.length
						? JSON.stringify(exerciseInfo.equipment)
						: null,
					instructions: exerciseInfo.instructions?.length
						? JSON.stringify(exerciseInfo.instructions)
						: null,
					tips: exerciseInfo.tips?.length
						? JSON.stringify(exerciseInfo.tips)
						: null,
					commonMistakes: exerciseInfo.commonMistakes?.length
						? JSON.stringify(exerciseInfo.commonMistakes)
						: null,
					benefits: exerciseInfo.benefits?.length
						? JSON.stringify(exerciseInfo.benefits)
						: null,
					scientificEvidence: exerciseInfo.scientificEvidence || null,
				},
			});

			try {
				let alternativesToCreate: Array<{
					name: string;
					reason: string;
					educationalId: string | null;
				}> = [];

				if (
					exercisePlan.alternatives &&
					Array.isArray(exercisePlan.alternatives) &&
					exercisePlan.alternatives.length > 0
				) {
					alternativesToCreate = exercisePlan.alternatives
						.slice(0, 3)
						.map((altName: string) => ({
							name: altName.trim(),
							reason: "Alternativa sugerida pela IA",
							educationalId: null,
						}));
				} else if (profile && exerciseInfo) {
					const physicalLimitations = profile.physicalLimitations
						? JSON.parse(profile.physicalLimitations)
						: [];
					const motorLimitations = profile.motorLimitations
						? JSON.parse(profile.motorLimitations)
						: [];
					const medicalConditions = profile.medicalConditions
						? JSON.parse(profile.medicalConditions)
						: [];
					const limitations = [
						...physicalLimitations,
						...motorLimitations,
						...medicalConditions,
					];

					const generatedAlternatives = generateAlternatives(
						exerciseInfo,
						profile.gymType,
						limitations,
					);

					alternativesToCreate = generatedAlternatives.map((alt) => ({
						name: alt.name,
						reason: alt.reason,
						educationalId: alt.educationalId || null,
					}));
				}

				if (alternativesToCreate.length > 0) {
					await db.alternativeExercise.createMany({
						data: alternativesToCreate.map((alt, index) => ({
							workoutExerciseId: exercise.id,
							name: alt.name,
							reason: alt.reason,
							educationalId: alt.educationalId,
							order: index,
						})),
					});
				}
			} catch (altError) {
				console.error(
					"[createExercisesInBatch] Erro ao adicionar alternativas:",
					altError,
				);
			}

			createdExercises.push(exercise);
		} catch (exerciseError) {
			console.error(
				`[createExercisesInBatch] Erro ao criar exercício ${exercisePlan.name}:`,
				exerciseError,
			);
		}
	}

	return createdExercises;
}

function findOrCreateExercise(exerciseName: string): ExerciseInfo {
	const normalizedName = exerciseName
		.toLowerCase()
		.trim()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");

	let exerciseInfo = exerciseDatabase.find((ex) => {
		const exName = ex.name
			.toLowerCase()
			.trim()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "");

		return (
			exName === normalizedName ||
			exName.includes(normalizedName) ||
			normalizedName.includes(exName)
		);
	});

	if (!exerciseInfo) {
		const generatedId = exerciseName
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");

		const inferMuscleGroup = (name: string): string[] => {
			const normalized = name
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "");

			const rules: Array<{ muscles: string[]; keywords: string[] }> = [
				{ muscles: ["peito"], keywords: ["peito", "supino", "crucifixo"] },
				{
					muscles: ["costas"],
					keywords: ["costas", "remada", "puxada", "barra fixa"],
				},
				{
					muscles: ["pernas"],
					keywords: [
						"pernas",
						"perna",
						"agachamento",
						"leg press",
						"extensora",
						"flexora",
						"afundo",
						"quadriceps",
						"quadríceps",
					],
				},
				{
					muscles: ["pernas", "gluteos"],
					keywords: ["posterior", "stiff", "gluteo", "glúteo"],
				},
				{
					muscles: ["ombros"],
					keywords: ["ombros", "desenvolvimento", "elevacao", "elevação"],
				},
				{
					muscles: ["bracos"],
					keywords: [
						"triceps",
						"tríceps",
						"pulley",
						"biceps",
						"bíceps",
						"rosca",
					],
				},
				{
					muscles: ["core"],
					keywords: ["abdominal", "abdomen", "core", "prancha"],
				},
			];

			for (const rule of rules) {
				if (rule.keywords.some((kw) => normalized.includes(kw))) {
					return rule.muscles;
				}
			}
			return ["full-body"];
		};

		const inferEquipment = (name: string): string[] => {
			const normalized = name
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "");

			const rules: Array<{ equipment: string[]; keywords: string[] }> = [
				{
					equipment: ["Máquina"],
					keywords: ["maquina", "máquina", "cadeira", "leg press"],
				},
				{ equipment: ["Barra", "Anilhas"], keywords: ["barra", "supino"] },
				{ equipment: ["Halteres"], keywords: ["halter", "rosca"] },
				{ equipment: ["Cabo", "Polia"], keywords: ["cabo", "pulley", "polia"] },
			];

			for (const rule of rules) {
				if (rule.keywords.some((kw) => normalized.includes(kw))) {
					return rule.equipment;
				}
			}

			return [];
		};

		exerciseInfo = {
			id: generatedId,
			name: exerciseName,
			primaryMuscles: inferMuscleGroup(exerciseName) as any,
			secondaryMuscles: [] as any[],
			difficulty: "intermediario",
			equipment: inferEquipment(exerciseName),
			instructions: [
				`Execute ${exerciseName} com forma correta`,
				"Mantenha o movimento controlado",
				"Use peso adequado",
			],
			tips: [
				"Mantenha a forma correta",
				"Controle o movimento",
				"Use amplitude completa",
			],
			commonMistakes: [
				"Não usar amplitude completa",
				"Peso excessivo",
				"Forma incorreta",
			],
			benefits: ["Desenvolvimento muscular", "Aumento de força"],
			scientificEvidence: undefined,
		};
	}

	return exerciseInfo as ExerciseInfo;
}
