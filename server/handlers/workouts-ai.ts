import type { Context } from "elysia";
import { chatCompletion } from "@/lib/ai/client";
import type { JsonValue } from "@/lib/types/api-error";
import type {
	ParsedWorkoutPlan,
	ParsedWorkoutPlanExercise,
	ParsedWorkoutPlanItem,
	WorkoutsAiProfile,
} from "../types/workouts-ai";
import { parseWorkoutResponse } from "@/lib/ai/parsers/workout-parser";
import { WORKOUT_SYSTEM_PROMPT } from "@/lib/ai/prompts/workout";
import { db } from "@/lib/db";
import { hasActivePremiumStatus } from "@/lib/utils/subscription";
import { createExercisesInBatch } from "@/lib/services/workout-ai/create-exercises-batch";
import {
	generatePersonalizedWorkoutPlan,
	updateExercisesWithAlternatives,
} from "@/lib/services/personalized-workout-generator";
import { populateWorkoutExercisesWithEducationalData } from "@/lib/services/populate-workout-exercises-educational-data";
import {
	badRequestResponse,
	internalErrorResponse,
	successResponse,
} from "../utils/response";

type WorkoutsAiContext = {
	set: Context["set"];
	body?: Record<string, JsonValue>;
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

		const profile: WorkoutsAiProfile = {
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
		const { parsedPlan: rawPlan, unitId } = body || {};

		if (!rawPlan || typeof rawPlan !== "object" || Array.isArray(rawPlan)) {
			return badRequestResponse(set, "Comando inválido");
		}
		const parsedPlan = rawPlan as ParsedWorkoutPlan;

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

		const workouts = parsedPlan.workouts ?? [];
		switch (parsedPlan.action) {
			case "create_workouts": {
				for (let i = 0; i < workouts.length; i++) {
					const workoutPlan = workouts[i];
					try {
						const lastOrder =
							unit.workouts.length > 0
								? Math.max(...unit.workouts.map((w: { order?: number }) => w.order || 0)) +
									i +
									1
								: i;

						const workout = await db.workout.create({
							data: {
								unitId,
								title: workoutPlan.title ?? workoutPlan.name ?? "Treino",
								description: workoutPlan.description ?? "",
								type: (workoutPlan.type ?? "strength") as "strength" | "cardio" | "flexibility",
								muscleGroup: workoutPlan.muscleGroup ?? "full-body",
								difficulty: (workoutPlan.difficulty ?? "intermediario") as "iniciante" | "intermediario" | "avancado",
								estimatedTime: 0,
								order: lastOrder,
							},
						});

						const planExercises = (workoutPlan.exercises ?? [])
							.filter((e): e is ParsedWorkoutPlanExercise & { name: string } => !!e?.name)
							.map((e) => ({ name: e.name!, sets: e.sets, reps: e.reps, rest: e.rest, notes: e.notes, alternatives: e.alternatives }));
						const exercises = await createExercisesInBatch(
							workout.id,
							planExercises,
							student.profile,
							workoutPlan.difficulty ?? "intermediario",
						);

						results.created.push(`Workout: ${workoutPlan.title ?? workoutPlan.name ?? "Treino"}`);
						results.created.push(
							`${exercises.length} exercícios em ${workoutPlan.title ?? workoutPlan.name ?? "Treino"}`,
						);
					} catch (error) {
						const err = error as Error;
						results.errors.push(
							`Erro ao criar workout ${workoutPlan.title ?? workoutPlan.name ?? "Treino"}: ${err.message}`,
						);
					}
				}
				break;
			}
			case "delete_workout": {
				const deleteTargetId = parsedPlan.targetWorkoutId;
				if (deleteTargetId) {
					const workout = unit.workouts.find(
						(w: { id: string }) => w.id === deleteTargetId,
					);
					if (workout) {
						await db.workout.delete({
							where: { id: deleteTargetId },
						});
						results.deleted.push(`Workout: ${workout.title}`);
					}
				}
				break;
			}
			case "add_exercise": {
				if (parsedPlan.targetWorkoutId && workouts.length > 0) {
					const workoutPlan = workouts[0];
					const targetWorkout = unit.workouts.find(
						(w: { id: string }) => w.id === parsedPlan.targetWorkoutId,
					);

					if (targetWorkout) {
						const currentExerciseCount = targetWorkout.exercises.length;
						const addExercises = (workoutPlan.exercises ?? [])
							.filter((e): e is ParsedWorkoutPlanExercise & { name: string } => !!e?.name)
							.map((e) => ({ name: e.name!, sets: e.sets, reps: e.reps, rest: e.rest, notes: e.notes, alternatives: e.alternatives }));
						const exercises = await createExercisesInBatch(
							parsedPlan.targetWorkoutId,
							addExercises,
							student.profile,
							workoutPlan.difficulty ?? "intermediario",
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
						(w: { id: string }) => w.id === parsedPlan.targetWorkoutId,
					);
					if (workout) {
						const toRemove = (parsedPlan.exerciseToRemove ?? "").toLowerCase();
						const exercise = workout.exercises.find(
							(e: { name: string }) =>
								e.name.toLowerCase().includes(toRemove) ||
								toRemove.includes(e.name.toLowerCase()),
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
				if (workouts.length > 1) {
					await db.workoutExercise.deleteMany({
						where: { workout: { unitId } },
					});
					await db.workout.deleteMany({ where: { unitId } });

					for (let i = 0; i < workouts.length; i++) {
						const workoutPlan = workouts[i];
						const newWorkout = await db.workout.create({
							data: {
								unitId,
								title: workoutPlan.title ?? workoutPlan.name ?? "Treino",
								description: workoutPlan.description ?? "",
								type: (workoutPlan.type ?? "strength") as "strength" | "cardio" | "flexibility",
								muscleGroup: workoutPlan.muscleGroup ?? "full-body",
								difficulty: (workoutPlan.difficulty ?? "intermediario") as "iniciante" | "intermediario" | "avancado",
								estimatedTime: 0,
								order: i,
							},
						});

						const repExercises = (workoutPlan.exercises ?? [])
							.filter((e): e is ParsedWorkoutPlanExercise & { name: string } => !!e?.name)
							.map((e) => ({ name: e.name!, sets: e.sets, reps: e.reps, rest: e.rest, notes: e.notes, alternatives: e.alternatives }));
						const exercises = await createExercisesInBatch(
							newWorkout.id,
							repExercises,
							student.profile,
							workoutPlan.difficulty ?? "intermediario",
							0,
							db,
						);

						results.created.push(`Workout: ${workoutPlan.title ?? workoutPlan.name ?? "Treino"}`);
						results.created.push(
							`${exercises.length} exercícios em ${workoutPlan.title ?? workoutPlan.name ?? "Treino"}`,
						);
					}
				} else if (
					parsedPlan.targetWorkoutId &&
					parsedPlan.exerciseToReplace &&
					workouts.length > 0
				) {
					const workout = unit.workouts.find(
						(w: { id: string }) => w.id === parsedPlan.targetWorkoutId,
					);
					if (workout) {
						const toReplaceOld = (parsedPlan.exerciseToReplace?.old ?? "").toLowerCase();
						const oldExercise = workout.exercises.find(
							(e: { name: string }) =>
								e.name.toLowerCase().includes(toReplaceOld) ||
								toReplaceOld.includes(e.name.toLowerCase()),
						);

						const firstWorkoutExercises = workouts[0]?.exercises ?? [];
						if (oldExercise && firstWorkoutExercises.length > 0) {
							const newEx = firstWorkoutExercises[0];
							const newExercisePlan = newEx?.name ? { name: newEx.name, sets: newEx.sets, reps: newEx.reps, rest: newEx.rest, notes: newEx.notes, alternatives: newEx.alternatives } : null;
							const order = oldExercise.order || 0;

							await db.workoutExercise.delete({
								where: { id: oldExercise.id },
							});

							const replaceTargetId = parsedPlan.targetWorkoutId;
							if (newExercisePlan && replaceTargetId) {
								await createExercisesInBatch(
									replaceTargetId,
									[newExercisePlan],
									student.profile,
									"intermediario",
									order,
									db,
								);
							}

							results.deleted.push(`Exercício: ${oldExercise.name}`);
							if (newEx?.name) results.created.push(`Exercício: ${newEx.name}`);
						}
					}
				}
				break;
			}
			case "update_workout": {
				if (workouts.length > 1) {
					await db.workoutExercise.deleteMany({
						where: { workout: { unitId } },
					});
					await db.workout.deleteMany({ where: { unitId } });

					for (let i = 0; i < workouts.length; i++) {
						const workoutPlan = workouts[i];
						const newWorkout = await db.workout.create({
							data: {
								unitId,
								title: workoutPlan.title ?? workoutPlan.name ?? "Treino",
								description: workoutPlan.description ?? "",
								type: (workoutPlan.type ?? "strength") as "strength" | "cardio" | "flexibility",
								muscleGroup: workoutPlan.muscleGroup ?? "full-body",
								difficulty: (workoutPlan.difficulty ?? "intermediario") as "iniciante" | "intermediario" | "avancado",
								estimatedTime: 0,
								order: i,
							},
						});

						const updExercises = (workoutPlan.exercises ?? [])
							.filter((e): e is ParsedWorkoutPlanExercise & { name: string } => !!e?.name)
							.map((e) => ({ name: e.name!, sets: e.sets, reps: e.reps, rest: e.rest, notes: e.notes, alternatives: e.alternatives }));
						const exercises = await createExercisesInBatch(
							newWorkout.id,
							updExercises,
							student.profile,
							workoutPlan.difficulty ?? "intermediario",
							0,
							db,
						);

						results.created.push(`Workout: ${workoutPlan.title ?? workoutPlan.name ?? "Treino"}`);
						results.created.push(
							`${exercises.length} exercícios em ${workoutPlan.title ?? workoutPlan.name ?? "Treino"}`,
						);
					}
				} else if (
					parsedPlan.targetWorkoutId &&
					workouts.length > 0
				) {
					const workoutPlan = workouts[0];
					let targetWorkout = unit.workouts.find(
						(w: { id: string }) => w.id === parsedPlan.targetWorkoutId,
					);

					if (!targetWorkout && parsedPlan.targetWorkoutId) {
						const targetId = parsedPlan.targetWorkoutId;
						targetWorkout = unit.workouts.find((w: { id: string; title: string }) => {
							const targetTitle = targetId.toLowerCase().trim();
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
								title: workoutPlan.title ?? workoutPlan.name ?? "Treino",
								description: workoutPlan.description ?? "",
								type: (workoutPlan.type ?? "strength") as "strength" | "cardio" | "flexibility",
								muscleGroup: workoutPlan.muscleGroup ?? "full-body",
								difficulty: (workoutPlan.difficulty ?? "intermediario") as "iniciante" | "intermediario" | "avancado",
							},
						});

						await db.workoutExercise.deleteMany({
							where: { workoutId: targetWorkout.id },
						});

						const updPlanExercises = (workoutPlan.exercises ?? [])
							.filter((e): e is ParsedWorkoutPlanExercise & { name: string } => !!e?.name)
							.map((e) => ({ name: e.name!, sets: e.sets, reps: e.reps, rest: e.rest, notes: e.notes, alternatives: e.alternatives }));
						const exercises = await createExercisesInBatch(
							targetWorkout.id,
							updPlanExercises,
							student.profile,
							workoutPlan.difficulty ?? "intermediario",
						);

						results.updated.push(`Workout: ${workoutPlan.title ?? workoutPlan.name ?? "Treino"}`);
						results.created.push(
							`${exercises.length} exercícios em ${workoutPlan.title ?? workoutPlan.name ?? "Treino"}`,
						);
					} else {
						const lastOrder =
							unit.workouts.length > 0
								? Math.max(...unit.workouts.map((w: { order?: number }) => w.order || 0)) + 1
								: 0;

						const newWorkout = await db.workout.create({
							data: {
								unitId,
								title: workoutPlan.title ?? workoutPlan.name ?? "Treino",
								description: workoutPlan.description ?? "",
								type: (workoutPlan.type ?? "strength") as "strength" | "cardio" | "flexibility",
								muscleGroup: workoutPlan.muscleGroup ?? "full-body",
								difficulty: (workoutPlan.difficulty ?? "intermediario") as "iniciante" | "intermediario" | "avancado",
								estimatedTime: 0,
								order: lastOrder,
							},
						});

						const elseExercises = (workoutPlan.exercises ?? [])
							.filter((e): e is ParsedWorkoutPlanExercise & { name: string } => !!e?.name)
							.map((e) => ({ name: e.name!, sets: e.sets, reps: e.reps, rest: e.rest, notes: e.notes, alternatives: e.alternatives }));
						const exercises = await createExercisesInBatch(
							newWorkout.id,
							elseExercises,
							student.profile,
							workoutPlan.difficulty ?? "intermediario",
						);

						results.created.push(`Workout: ${workoutPlan.title ?? workoutPlan.name ?? "Treino"}`);
						results.created.push(
							`${exercises.length} exercícios em ${workoutPlan.title ?? workoutPlan.name ?? "Treino"}`,
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

		if (!hasActivePremiumStatus(subscription)) {
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

		const workoutsInfo = unit.workouts.map((w: { id: string; title: string; type: string; muscleGroup: string; exercises: Array<{ id: string; name: string; sets: number; reps: string }> }) => ({
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

		const student = await db.student.findUnique({
			where: { id: studentId },
			include: { profile: true },
		});

		let enhancedSystemPrompt = WORKOUT_SYSTEM_PROMPT;
		if (workoutsInfo.length > 0) {
			const workoutsInfoText = workoutsInfo
				.map(
					(w) =>
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

		let parsed: { intent?: string; action?: string; workouts?: Array<{ title?: string; exercises?: Array<Record<string, JsonValue>> }>; message?: string } | null = null;
		const tryParseImportedWorkout = (raw: Record<string, JsonValue> | JsonValue[]) => {
			const normalizeExercises = (exercises: Array<Record<string, JsonValue>>): Array<Record<string, JsonValue>> =>
				(exercises || []).map((ex: Record<string, JsonValue>) => ({
					name: ex.name,
					sets: ex.sets ?? 3,
					reps: ex.reps ?? "8-12",
					rest: ex.rest ?? 60,
					notes: ex.notes ?? null,
					focus: ex.focus ?? null,
					alternatives:
						Array.isArray(ex.alternatives) && ex.alternatives.length > 0
							? ex.alternatives.slice(0, 3)
							: [],
				}));

			const normalizeWorkout = (w: Record<string, JsonValue>) => ({
				title: (w.title ?? w.name ?? "Treino") as string,
				description: (w.description ?? "") as string,
				type: (w.type ?? "strength") as string,
				muscleGroup: (w.muscleGroup ?? "full-body") as string,
				difficulty: (w.difficulty ?? "intermediario") as string,
				exercises: normalizeExercises(Array.isArray(w.exercises) ? (w.exercises as Array<Record<string, JsonValue>>) : []),
			});

			let workoutsArr: Array<Record<string, JsonValue>> = [];
			const rawObj = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, JsonValue>) : null;
			if (rawObj?.workouts && Array.isArray(rawObj.workouts)) {
				workoutsArr = rawObj.workouts as Array<Record<string, JsonValue>>;
			} else if (Array.isArray(raw)) {
				workoutsArr = raw as Array<Record<string, JsonValue>>;
			} else if (rawObj?.exercises) {
				workoutsArr = [rawObj];
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
				const rawJson = JSON.parse(message) as Record<string, JsonValue> | JsonValue[];
				parsed = tryParseImportedWorkout(rawJson);
			}
		} catch {}

		if (!parsed) {
			const history = Array.isArray(conversationHistory) ? conversationHistory : [];
			const messagesArr: Array<{ role: "user" | "assistant"; content: string }> = [
				...(history as Array<{ role: "user" | "assistant"; content: string }>),
				{ role: "user", content: message },
			];

			const response = await chatCompletion({
				messages: messagesArr,
				systemPrompt: enhancedSystemPrompt,
				temperature: 0.7,
				responseFormat: "json_object",
			});

			parsed = parseWorkoutResponse(response) as NonNullable<typeof parsed>;
		}

		await db.nutritionChatUsage.update({
			where: { id: chatUsage.id },
			data: { messageCount: { increment: 1 } },
		});

		return {
			...(parsed as Record<string, unknown>),
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
			const sendSSE = (event: string, data: JsonValue) => {
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

				if (!hasActivePremiumStatus(subscription)) {
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

				const workoutsInfo = unit.workouts.map((w: { id: string; title: string; type: string; muscleGroup: string; exercises: Array<{ id: string; name: string; sets: number; reps: string }> }) => ({
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

				const student = await db.student.findUnique({
					where: { id: studentId },
					include: { profile: true },
				});

				let enhancedSystemPrompt = WORKOUT_SYSTEM_PROMPT;
				if (workoutsInfo.length > 0) {
					const workoutsInfoText = workoutsInfo
						.map(
							(w) =>
								`- ${w.title} (ID: ${w.id}, ${w.type}, ${w.muscleGroup}): ${w.exercises.length} exercícios`,
						)
						.join("\n");
					enhancedSystemPrompt += `\n\nWORKOUTS JÁ EXISTENTES NA UNIT:\n${workoutsInfoText}\n\nUse essas informações para entender o contexto. Se o usuário pedir para editar ou deletar, use os IDs e nomes corretos.`;

					const previews = Array.isArray(previewWorkouts) ? (previewWorkouts as Array<Record<string, JsonValue>>) : [];
					const ref = reference && typeof reference === "object" && !Array.isArray(reference) ? (reference as Record<string, JsonValue>) : null;
					if (ref && previews.length > 0) {
						const workoutIdentifier =
							(ref.workoutId as string) || (ref.workoutTitle as string);
						const previewsText = previews
							.map(
								(w, idx) =>
									`${idx + 1}. ${(w.title as string) ?? ""} (${(w.type as string) ?? ""}, ${(w.muscleGroup as string) ?? ""}): ${
										Array.isArray(w.exercises) ? w.exercises.length : 0
									} exercícios`,
							)
							.join("\n");

						enhancedSystemPrompt += `\n\nWORKOUTS EM PREVIEW (AINDA NÃO SALVOS):\n${previewsText}\n\n`;

						if (ref.type === "workout") {
							const previewsStructure = previews
								.map((w, idx) => {
									if (idx === (ref.workoutIndex as number)) {
										return `  {
    "title": "[MODIFICAR conforme pedido - se pedir mudança de foco, altere o título também]",
    "description": "${(w.description as string) || ""}",
    "type": "${(w.type as string) ?? "strength"}",
    "muscleGroup": "[MODIFICAR se necessário conforme pedido]",
    "difficulty": "${(w.difficulty as string) ?? "intermediario"}",
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
    "title": "${(w.title as string) ?? "Treino"}",
    "description": "${(w.description as string) || ""}",
    "type": "${(w.type as string) ?? "strength"}",
    "muscleGroup": "${(w.muscleGroup as string) ?? "full-body"}",
    "difficulty": "${(w.difficulty as string) ?? "intermediario"}",
    "exercises": ${exercisesJson}
  }`;
								})
								.join(",\n");

							enhancedSystemPrompt += `⚠️ ATENÇÃO CRÍTICA: O usuário está REFERENCIANDO o treino "${ref.workoutTitle}" (posição ${
								((ref.workoutIndex as number) ?? 0) + 1
							} na lista acima). 

REGRA ABSOLUTA: Você DEVE retornar TODOS os ${
								previews.length
							} workouts no array "workouts", modificando APENAS o referenciado.

- Você DEVE usar action="update_workout" 
- Você DEVE usar targetWorkoutId="${ref.workoutTitle}"
- Você DEVE atualizar o título se o usuário pedir mudança
- CRÍTICO: Retorne TODOS os ${
								previews.length
							} workouts no array "workouts"
- O workout na posição ${ref.workoutIndex} (índice ${
								ref.workoutIndex
							}) DEVE ser o MODIFICADO
- Todos os outros workouts devem ser COPIADOS EXATAMENTE como estão abaixo
- Estrutura esperada:
"workouts": [
${previewsStructure}
]
- NÃO crie novos workouts, apenas ATUALIZE o referenciado`;
						} else if (
							ref.type === "exercise" &&
							ref.exerciseName
						) {
							enhancedSystemPrompt += `⚠️ ATENÇÃO CRÍTICA: O usuário está REFERENCIANDO o exercício "${ref.exerciseName}" do treino "${ref.workoutTitle}".
- Você DEVE usar action="replace_exercise" ou "remove_exercise"
- Você DEVE usar targetWorkoutId="${workoutIdentifier}"
- Você DEVE usar exerciseToReplace com old="${ref.exerciseName}" e new="nome do novo exercício"
- Você DEVE retornar TODOS os ${previews.length} workouts no array workouts
- Apenas MODIFIQUE o exercício referenciado`;
						}
					} else if (ref) {
						const workoutIdentifier =
							(ref.workoutId as string) || (ref.workoutTitle as string);
						if (ref.type === "workout") {
							enhancedSystemPrompt += `\n\n⚠️ ATENÇÃO CRÍTICA: O usuário está REFERENCIANDO o treino "${ref.workoutTitle}" (Identificador: ${workoutIdentifier}).
- Você DEVE usar action="update_workout"
- Você DEVE usar targetWorkoutId="${workoutIdentifier}"`;
						} else if (
							ref.type === "exercise" &&
							ref.exerciseName
						) {
							enhancedSystemPrompt += `\n\n⚠️ ATENÇÃO CRÍTICA: O usuário está REFERENCIANDO o exercício "${ref.exerciseName}" do treino "${ref.workoutTitle}".
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

				let parsed: { intent?: string; action?: string; workouts?: Array<{ title?: string; exercises?: Array<Record<string, JsonValue>> }>; message?: string } | null = null;
				const tryParseImportedWorkout = (raw: Record<string, JsonValue> | JsonValue[]) => {
					const normalizeExercises = (exercises: Array<Record<string, JsonValue>>): Array<Record<string, JsonValue>> =>
						(exercises || []).map((ex: Record<string, JsonValue>) => ({
							name: ex.name,
							sets: ex.sets ?? 3,
							reps: ex.reps ?? "8-12",
							rest: ex.rest ?? 60,
							notes: ex.notes ?? null,
							focus: ex.focus ?? null,
							alternatives:
								Array.isArray(ex.alternatives) && ex.alternatives.length > 0
									? ex.alternatives.slice(0, 3)
									: [],
						}));

					const normalizeWorkout = (w: Record<string, JsonValue>) => ({
						title: (w.title ?? w.name ?? "Treino") as string,
						description: (w.description ?? "") as string,
						type: (w.type ?? "strength") as string,
						muscleGroup: (w.muscleGroup ?? "full-body") as string,
						difficulty: (w.difficulty ?? "intermediario") as string,
						exercises: normalizeExercises(Array.isArray(w.exercises) ? (w.exercises as Array<Record<string, JsonValue>>) : []),
					});

					const rawObj = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, JsonValue>) : null;
					let workoutsArr: Array<Record<string, JsonValue>> = [];
					if (rawObj?.workouts && Array.isArray(rawObj.workouts)) {
						workoutsArr = rawObj.workouts as Array<Record<string, JsonValue>>;
					} else if (Array.isArray(raw)) {
						workoutsArr = raw as Array<Record<string, JsonValue>>;
					} else if (rawObj?.exercises) {
						workoutsArr = [rawObj];
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
						const rawJson = JSON.parse(message) as Record<string, JsonValue> | JsonValue[];
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

					const streamHistory = Array.isArray(conversationHistory) ? conversationHistory : [];
					const messagesArr: Array<{ role: "user" | "assistant"; content: string }> = [
						...(streamHistory as Array<{ role: "user" | "assistant"; content: string }>),
						{ role: "user", content: message },
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
						parsed = parseWorkoutResponse(response) as NonNullable<typeof parsed>;
					} catch (error) {
						const err = error as Error;
						sendSSE("error", {
							error: err.message || "Erro ao processar mensagem",
						});
						controller.close();
						return;
					}
				}

				const streamRef = reference && typeof reference === "object" && !Array.isArray(reference) ? (reference as Record<string, JsonValue>) : null;
				const streamPreviews = Array.isArray(previewWorkouts) ? previewWorkouts : [];
				if (
					streamRef &&
					streamPreviews.length > 0 &&
					parsed?.workouts
				) {
					const modifiedIndex =
						typeof streamRef.workoutIndex === "number"
							? streamRef.workoutIndex
							: 0;
					const mergedWorkouts = [...streamPreviews] as typeof parsed.workouts;

					if (parsed.workouts.length === streamPreviews.length) {
						mergedWorkouts[modifiedIndex] = parsed.workouts[modifiedIndex];
					} else if (parsed.workouts.length === 1) {
						mergedWorkouts[modifiedIndex] = parsed.workouts[0];
					} else {
						const refTitle = (streamRef.workoutTitle as string)?.toLowerCase().trim();
						const byTitle = parsed.workouts.find(
							(w) =>
								(w.title ?? (w as Record<string, JsonValue>).name ?? "").toString().toLowerCase().trim() === refTitle,
						);
						mergedWorkouts[modifiedIndex] = byTitle || parsed.workouts[0];
					}

					(parsed as Record<string, unknown>).workouts = mergedWorkouts;
					(parsed as Record<string, unknown>).action = parsed.action || "update_workout";
					(parsed as Record<string, unknown>).targetWorkoutId = streamRef.workoutTitle;
				}

				if (!parsed) {
					sendSSE("error", { error: "Não foi possível processar a mensagem" });
					controller.close();
					return;
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
			} catch (error) {
				const err = error as Error;
				console.error("[workouts/chat-stream] Erro:", err);
				sendSSE("error", {
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

