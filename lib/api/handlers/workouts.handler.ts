/**
 * Handler de Workouts
 *
 * Centraliza toda a lógica das rotas relacionadas a workouts
 */

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, getWeekStart } from "@/lib/utils/week";
import { requireStudent } from "../middleware/auth.middleware";
import {
	validateBody,
	validateQuery,
} from "../middleware/validation.middleware";
import {
	completeWorkoutSchema,
	saveWorkoutProgressSchema,
	updateExerciseLogSchema,
	workoutHistoryQuerySchema,
} from "../schemas";
import {
	badRequestResponse,
	internalErrorResponse,
	notFoundResponse,
	successResponse,
} from "../utils/response.utils";

/**
 * Calcula o streak baseado em dias consecutivos de treino
 * @param studentId ID do estudante
 * @returns Número de dias consecutivos que o estudante treinou
 */
async function calculateStreak(studentId: string): Promise<number> {
	// Buscar todos os workouts do histórico
	const allWorkoutHistory = await db.workoutHistory.findMany({
		where: { studentId },
		select: { date: true },
		orderBy: { date: "desc" },
	});

	// Agrupar por dia (ignorar hora)
	const workoutDays = new Set<string>();
	allWorkoutHistory.forEach((wh) => {
		const dateOnly = new Date(wh.date);
		dateOnly.setHours(0, 0, 0, 0);
		workoutDays.add(dateOnly.toISOString().split("T")[0]);
	});

	// Calcular dias consecutivos desde hoje para trás
	let currentStreak = 0;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const checkDate = new Date(today);

	while (true) {
		const dateStr = checkDate.toISOString().split("T")[0];
		if (workoutDays.has(dateStr)) {
			currentStreak++;
			// Ir para o dia anterior
			checkDate.setDate(checkDate.getDate() - 1);
		} else {
			break;
		}
	}

	return currentStreak;
}

/**
 * GET /api/workouts/units
 * Busca units com workouts e exercícios
 */
export async function getUnitsHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student.id;

		// Buscar units personalizadas do aluno primeiro, se não houver, buscar treinos globais
		let units = await db.unit.findMany({
			where: { studentId: studentId }, // Treinos personalizados do aluno
			orderBy: { order: "asc" },
			include: {
				workouts: {
					orderBy: { order: "asc" },
					include: {
						exercises: {
							orderBy: { order: "asc" },
							include: {
								alternatives: {
									orderBy: { order: "asc" },
								},
							},
						},
						completions: {
							where: {
								studentId: studentId,
							},
							orderBy: {
								date: "desc",
							},
							take: 1,
						},
					},
				},
			},
		});

		// Se não houver treinos personalizados, buscar treinos globais (fallback)
		if (units.length === 0) {
			units = await db.unit.findMany({
				where: { studentId: null }, // Treinos globais
				orderBy: { order: "asc" },
				include: {
					workouts: {
						orderBy: { order: "asc" },
						include: {
							exercises: {
								orderBy: { order: "asc" },
								include: {
									alternatives: {
										orderBy: { order: "asc" },
									},
								},
							},
							completions: {
								where: {
									studentId: studentId,
								},
								orderBy: {
									date: "desc",
								},
								take: 1,
							},
						},
					},
				},
			});
		}

		// Buscar histórico de workouts completados
		const completedWorkoutIds = await db.workoutHistory.findMany({
			where: {
				studentId: studentId,
			},
			select: {
				workoutId: true,
			},
			distinct: ["workoutId"],
		});

		const completedIdsSet = new Set(
			completedWorkoutIds.map((wh) => wh.workoutId),
		);

		// Transformar dados
		const formattedUnits = units.map((unit) => ({
			id: unit.id,
			title: unit.title,
			description: unit.description || "",
			color: unit.color || "#58CC02",
			icon: unit.icon || "💪",
			workouts: unit.workouts.map((workout) => {
				const isCompleted = completedIdsSet.has(workout.id);
				const lastCompletion = workout.completions[0];

				// Calcular locked
				let isLocked = workout.locked;
				const workoutIndex = unit.workouts.findIndex(
					(w) => w.id === workout.id,
				);
				const unitIndex = units.findIndex((u) => u.id === unit.id);

				if (unitIndex === 0 && workoutIndex === 0) {
					isLocked = false;
				} else if (!isLocked) {
					if (unitIndex > 0 || workoutIndex > 0) {
						let previousWorkout = null;

						if (workoutIndex > 0) {
							previousWorkout = unit.workouts[workoutIndex - 1];
						} else if (unitIndex > 0) {
							const previousUnit = units[unitIndex - 1];
							if (previousUnit.workouts.length > 0) {
								previousWorkout =
									previousUnit.workouts[previousUnit.workouts.length - 1];
							}
						}

						if (previousWorkout) {
							isLocked = !completedIdsSet.has(previousWorkout.id);
						}
					}
				}

				// Calcular stars
				let stars: number | undefined;
				if (lastCompletion) {
					if (lastCompletion.overallFeedback === "excelente") {
						stars = 3;
					} else if (lastCompletion.overallFeedback === "bom") {
						stars = 2;
					} else if (lastCompletion.overallFeedback === "regular") {
						stars = 1;
					} else {
						stars = 0;
					}
				}

				return {
					id: workout.id,
					title: workout.title,
					description: workout.description || "",
					type: workout.type as "strength" | "cardio" | "flexibility" | "rest",
					muscleGroup: workout.muscleGroup,
					difficulty: workout.difficulty as
						| "iniciante"
						| "intermediario"
						| "avancado",
					exercises: workout.exercises.map((exercise) => ({
						id: exercise.id,
						name: exercise.name,
						sets: exercise.sets,
						reps: exercise.reps,
						rest: exercise.rest,
						notes: exercise.notes || undefined,
						videoUrl: exercise.videoUrl || undefined,
						educationalId: exercise.educationalId || undefined,
						// Dados educacionais
						primaryMuscles: exercise.primaryMuscles
							? JSON.parse(exercise.primaryMuscles)
							: undefined,
						secondaryMuscles: exercise.secondaryMuscles
							? JSON.parse(exercise.secondaryMuscles)
							: undefined,
						difficulty: exercise.difficulty || undefined,
						equipment: exercise.equipment
							? JSON.parse(exercise.equipment)
							: undefined,
						instructions: exercise.instructions
							? JSON.parse(exercise.instructions)
							: undefined,
						tips: exercise.tips ? JSON.parse(exercise.tips) : undefined,
						commonMistakes: exercise.commonMistakes
							? JSON.parse(exercise.commonMistakes)
							: undefined,
						benefits: exercise.benefits
							? JSON.parse(exercise.benefits)
							: undefined,
						scientificEvidence: exercise.scientificEvidence || undefined,
						alternatives:
							exercise.alternatives.length > 0
								? exercise.alternatives.map((alt) => ({
										id: alt.id,
										name: alt.name,
										reason: alt.reason,
										educationalId: alt.educationalId || undefined,
									}))
								: undefined,
					})),
					xpReward: workout.xpReward,
					estimatedTime: workout.estimatedTime,
					locked: isLocked,
					completed: isCompleted,
					stars: stars,
					completedAt: lastCompletion?.date || undefined,
				};
			}),
		}));

		return successResponse({ units: formattedUnits });
	} catch (error: any) {
		console.error("[getUnitsHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar treinos", error);
	}
}

/**
 * GET /api/workouts/weekly-plan
 * Busca WeeklyPlan com 7 slots (Seg-Dom), locked/completed por semana
 */
export async function getWeeklyPlanHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student.id;

		const student = await db.student.findUnique({
			where: { id: studentId },
			select: { weekOverride: true },
		});

		const weekStart = getWeekStart(student?.weekOverride ?? null);
		const weekEnd = addDays(weekStart, 7);

		let weeklyPlan = await db.weeklyPlan.findUnique({
			where: { studentId },
			include: {
				slots: {
					orderBy: { dayOfWeek: "asc" },
					include: {
						workout: {
							include: {
								exercises: {
									orderBy: { order: "asc" },
									include: {
										alternatives: { orderBy: { order: "asc" } },
									},
								},
								completions: {
									where: { studentId },
									orderBy: { date: "desc" },
									take: 1,
								},
							},
						},
					},
				},
			},
		});

		if (!weeklyPlan) {
			return successResponse({
				weeklyPlan: null,
				message: "Nenhum plano semanal. Crie um plano para começar.",
			});
		}

		const completionsThisWeek = await db.workoutHistory.findMany({
			where: {
				studentId,
				date: { gte: weekStart, lt: weekEnd },
				workoutId: { not: null },
			},
			select: { workoutId: true, overallFeedback: true, date: true },
		});

		const completedByWorkoutId = new Map(
			completionsThisWeek.map((c) => [
				c.workoutId!,
				{ feedback: c.overallFeedback, date: c.date },
			]),
		);

		const formattedSlots = weeklyPlan.slots.map((slot, index) => {
			const isRest = slot.type === "rest";
			const completed = isRest
				? true
				: slot.workoutId
					? completedByWorkoutId.has(slot.workoutId)
					: false;

			const prevSlot = index > 0 ? weeklyPlan!.slots[index - 1] : null;
			const prevCompleted =
				!prevSlot || prevSlot.type === "rest"
					? true
					: prevSlot.workoutId
						? completedByWorkoutId.has(prevSlot.workoutId)
						: false;

			const locked = isRest ? false : !prevCompleted;

			const completion = slot.workoutId
				? completedByWorkoutId.get(slot.workoutId)
				: null;
			let stars: number | undefined;
			if (completion?.feedback) {
				stars =
					completion.feedback === "excelente"
						? 3
						: completion.feedback === "bom"
							? 2
							: completion.feedback === "regular"
								? 1
								: 0;
			}

			if (isRest) {
				return {
					id: slot.id,
					dayOfWeek: slot.dayOfWeek,
					type: "rest" as const,
					locked: false,
					completed: true,
				};
			}

			const workout = slot.workout;
			if (!workout) {
				return {
					id: slot.id,
					dayOfWeek: slot.dayOfWeek,
					type: "rest" as const,
					locked: false,
					completed: true,
				};
			}

			return {
				id: slot.id,
				dayOfWeek: slot.dayOfWeek,
				type: "workout" as const,
				workout: {
					id: workout.id,
					title: workout.title,
					description: workout.description || "",
					type: workout.type as "strength" | "cardio" | "flexibility" | "rest",
					muscleGroup: workout.muscleGroup,
					difficulty: workout.difficulty as
						| "iniciante"
						| "intermediario"
						| "avancado",
					exercises: workout.exercises.map((ex) => ({
						id: ex.id,
						name: ex.name,
						sets: ex.sets,
						reps: ex.reps,
						rest: ex.rest,
						notes: ex.notes || undefined,
						videoUrl: ex.videoUrl || undefined,
						educationalId: ex.educationalId || undefined,
						primaryMuscles: ex.primaryMuscles
							? JSON.parse(ex.primaryMuscles)
							: undefined,
						secondaryMuscles: ex.secondaryMuscles
							? JSON.parse(ex.secondaryMuscles)
							: undefined,
						difficulty: ex.difficulty || undefined,
						equipment: ex.equipment ? JSON.parse(ex.equipment) : undefined,
						instructions: ex.instructions
							? JSON.parse(ex.instructions)
							: undefined,
						tips: ex.tips ? JSON.parse(ex.tips) : undefined,
						commonMistakes: ex.commonMistakes
							? JSON.parse(ex.commonMistakes)
							: undefined,
						benefits: ex.benefits ? JSON.parse(ex.benefits) : undefined,
						scientificEvidence: ex.scientificEvidence || undefined,
						alternatives:
							ex.alternatives.length > 0
								? ex.alternatives.map((alt) => ({
										id: alt.id,
										name: alt.name,
										reason: alt.reason,
										educationalId: alt.educationalId || undefined,
									}))
								: undefined,
					})),
					xpReward: workout.xpReward,
					estimatedTime: workout.estimatedTime,
					locked,
					completed,
					stars,
					completedAt: completion?.date || undefined,
				},
				locked,
				completed,
				stars,
				completedAt: completion?.date || undefined,
			};
		});

		return successResponse({
			weeklyPlan: {
				id: weeklyPlan.id,
				title: weeklyPlan.title,
				slots: formattedSlots,
			},
			weekStart: weekStart.toISOString(),
		});
	} catch (error: unknown) {
		console.error("[getWeeklyPlanHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar plano semanal");
	}
}

/**
 * POST /api/workouts/[id]/complete
 * Completa um workout
 */
export async function completeWorkoutHandler(
	request: NextRequest,
	workoutId: string,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student.id;

		if (!workoutId) {
			return badRequestResponse("ID do workout não fornecido");
		}

		// Verificar se o workout existe
		const workout = await db.workout.findUnique({
			where: { id: workoutId },
		});

		if (!workout) {
			return notFoundResponse("Workout não encontrado");
		}

		// Validar body com Zod
		const validation = await validateBody(request, completeWorkoutSchema);
		if (!validation.success) {
			return validation.response;
		}

		const {
			exerciseLogs,
			duration,
			totalVolume,
			overallFeedback,
			bodyPartsFatigued,
			startTime,
		} = validation.data;

		// Calcular duração
		// Se duration for 0 ou não fornecido, calcular a partir do startTime ou usar estimatedTime
		const workoutDuration =
			duration !== undefined && duration !== null
				? duration
				: startTime
					? Math.round((Date.now() - new Date(startTime).getTime()) / 60000)
					: workout.estimatedTime;

		// Criar WorkoutHistory
		const workoutHistory = await db.workoutHistory.create({
			data: {
				studentId: studentId,
				workoutId: workoutId,
				date: new Date(),
				duration: workoutDuration,
				totalVolume: totalVolume || 0,
				overallFeedback: overallFeedback || "regular",
				bodyPartsFatigued: bodyPartsFatigued
					? JSON.stringify(bodyPartsFatigued)
					: null,
			},
		});

		// Criar ExerciseLogs
		if (exerciseLogs && Array.isArray(exerciseLogs)) {
			for (const log of exerciseLogs) {
				await db.exerciseLog.create({
					data: {
						workoutHistoryId: workoutHistory.id,
						exerciseId: log.exerciseId,
						exerciseName: log.exerciseName,
						sets: JSON.stringify(log.sets || []),
						notes: log.notes || null,
						formCheckScore: log.formCheckScore || null,
						difficulty: log.difficulty || null,
					},
				});
			}
		}

		// Calcular streak baseado em dias consecutivos
		// Nota: O workoutHistory já foi criado acima, então o calculateStreak
		// já vai incluir o dia de hoje automaticamente
		const currentStreak = await calculateStreak(studentId);

		// Atualizar StudentProgress
		const progress = await db.studentProgress.findUnique({
			where: { studentId: studentId },
		});

		if (progress) {
			const longestStreak = Math.max(
				currentStreak,
				progress.longestStreak || 0,
			);

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			await db.studentProgress.update({
				where: { studentId: studentId },
				data: {
					totalXP: progress.totalXP + (workout.xpReward || 0),
					currentStreak: currentStreak,
					longestStreak: longestStreak,
					workoutsCompleted: progress.workoutsCompleted + 1,
					lastActivityDate: today,
				},
			});
		}

		// Limpar progresso parcial do workout (já foi salvo como completo)
		// Fazer de forma não-bloqueante - ignorar erros 404 (progresso pode não existir)
		try {
			await db.workoutProgress.delete({
				where: {
					studentId_workoutId: {
						studentId: studentId,
						workoutId: workoutId,
					},
				},
			});
		} catch (error: any) {
			// Ignorar erro se progresso não existir (P2025 = Record not found)
			if (error.code !== "P2025") {
				console.error(
					"[completeWorkoutHandler] Erro ao limpar progresso:",
					error,
				);
				// Não falhar a requisição por causa disso
			}
		}

		return successResponse({
			workoutHistoryId: workoutHistory.id,
			xpEarned: workout.xpReward || 0,
		});
	} catch (error: any) {
		console.error("[completeWorkoutHandler] Erro:", error);
		return internalErrorResponse("Erro ao completar workout", error);
	}
}

/**
 * POST /api/workouts/[id]/progress
 * Salva progresso parcial de um workout
 */
export async function saveWorkoutProgressHandler(
	request: NextRequest,
	workoutId: string,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student.id;

		if (!workoutId) {
			return badRequestResponse("ID do workout não fornecido");
		}

		// Validar body com Zod
		const validation = await validateBody(request, saveWorkoutProgressSchema);
		if (!validation.success) {
			return validation.response;
		}

		const {
			currentExerciseIndex,
			exerciseLogs,
			skippedExercises,
			selectedAlternatives,
			xpEarned,
			totalVolume,
			completionPercentage,
			startTime,
			cardioPreference,
			cardioDuration,
			selectedCardioType,
		} = validation.data;

		// Verificar se o workout existe
		const workout = await db.workout.findUnique({
			where: { id: workoutId },
		});

		if (!workout) {
			return notFoundResponse("Workout não encontrado");
		}

		// Upsert progress
		await db.workoutProgress.upsert({
			where: {
				studentId_workoutId: {
					studentId: studentId,
					workoutId: workoutId,
				},
			},
			create: {
				studentId: studentId,
				workoutId: workoutId,
				currentExerciseIndex: currentExerciseIndex,
				exerciseLogs: JSON.stringify(exerciseLogs || []),
				skippedExercises: skippedExercises
					? JSON.stringify(skippedExercises)
					: null,
				selectedAlternatives: selectedAlternatives
					? JSON.stringify(selectedAlternatives)
					: null,
				xpEarned: xpEarned || 0,
				totalVolume: totalVolume || 0,
				completionPercentage: completionPercentage || 0,
				startTime: startTime ? new Date(startTime) : new Date(),
				cardioPreference: cardioPreference || null,
				cardioDuration: cardioDuration || null,
				selectedCardioType: selectedCardioType || null,
			},
			update: {
				currentExerciseIndex: currentExerciseIndex,
				exerciseLogs: JSON.stringify(exerciseLogs || []),
				skippedExercises: skippedExercises
					? JSON.stringify(skippedExercises)
					: null,
				selectedAlternatives: selectedAlternatives
					? JSON.stringify(selectedAlternatives)
					: null,
				xpEarned: xpEarned || 0,
				totalVolume: totalVolume || 0,
				completionPercentage: completionPercentage || 0,
				cardioPreference: cardioPreference || null,
				cardioDuration: cardioDuration || null,
				selectedCardioType: selectedCardioType || null,
			},
		});

		return successResponse({ message: "Progresso salvo com sucesso" });
	} catch (error: any) {
		console.error("[saveWorkoutProgressHandler] Erro:", error);

		// Verificar se a tabela não existe
		if (
			error.message?.includes("does not exist") ||
			error.message?.includes("Unknown table") ||
			error.code === "P2021"
		) {
			return NextResponse.json(
				{
					error: "Tabela workout_progress não existe",
					code: "MIGRATION_REQUIRED",
					message:
						"Execute a migration: node scripts/migration/apply-workout-progress-migration.js",
				},
				{ status: 503 }, // Service Unavailable
			);
		}

		// Verificar se é erro de Prisma (tabela não encontrada)
		if (error.code === "P2021" || error.code === "P1001") {
			return NextResponse.json(
				{
					error: "Erro de conexão com banco de dados",
					code: "DATABASE_ERROR",
				},
				{ status: 503 },
			);
		}

		return internalErrorResponse("Erro ao salvar progresso", error);
	}
}

/**
 * GET /api/workouts/[id]/progress
 * Busca progresso parcial de um workout
 */
export async function getWorkoutProgressHandler(
	request: NextRequest,
	workoutId: string,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student.id;

		if (!workoutId) {
			return badRequestResponse("ID do workout não fornecido");
		}

		const progress = await db.workoutProgress.findUnique({
			where: {
				studentId_workoutId: {
					studentId,
					workoutId,
				},
			},
		});

		if (!progress) {
			return successResponse({
				progress: null,
				message: "Nenhum progresso encontrado",
			});
		}

		// Parsear JSON strings
		const exerciseLogs = JSON.parse(progress.exerciseLogs || "[]");
		const skippedExercises = progress.skippedExercises
			? JSON.parse(progress.skippedExercises)
			: [];
		const selectedAlternatives = progress.selectedAlternatives
			? JSON.parse(progress.selectedAlternatives)
			: {};

		return successResponse({
			progress: {
				id: progress.id,
				workoutId: progress.workoutId,
				currentExerciseIndex: progress.currentExerciseIndex,
				exerciseLogs,
				skippedExercises,
				selectedAlternatives,
				xpEarned: progress.xpEarned,
				totalVolume: progress.totalVolume,
				completionPercentage: progress.completionPercentage,
				startTime: progress.startTime,
				cardioPreference: progress.cardioPreference,
				cardioDuration: progress.cardioDuration,
				selectedCardioType: progress.selectedCardioType,
				lastUpdated: progress.updatedAt,
			},
		});
	} catch (error: any) {
		console.error("[getWorkoutProgressHandler] Erro:", error);
		// Se a tabela não existir, retornar null sem erro
		if (
			error.message?.includes("does not exist") ||
			error.message?.includes("workout_progress")
		) {
			return successResponse({
				progress: null,
				message:
					"Tabela workout_progress não existe. Execute: node scripts/migration/apply-workout-progress-migration.js",
			});
		}
		return internalErrorResponse("Erro ao buscar progresso", error);
	}
}

/**
 * DELETE /api/workouts/[id]/progress
 * Deleta progresso parcial de um workout
 * Operação idempotente: se o progresso não existir, retorna sucesso
 */
export async function deleteWorkoutProgressHandler(
	request: NextRequest,
	workoutId: string,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student.id;

		if (!workoutId) {
			return badRequestResponse("ID do workout não fornecido");
		}

		// Verificar se o progresso existe antes de deletar (idempotência)
		const existingProgress = await db.workoutProgress.findUnique({
			where: {
				studentId_workoutId: {
					studentId,
					workoutId,
				},
			},
		});

		// Se não existe, retornar sucesso (operção idempotente)
		if (!existingProgress) {
			return successResponse({
				message: "Progresso não encontrado (já estava deletado)",
			});
		}

		await db.workoutProgress.delete({
			where: {
				studentId_workoutId: {
					studentId,
					workoutId,
				},
			},
		});

		return successResponse({ message: "Progresso deletado com sucesso" });
	} catch (error: any) {
		console.error("[deleteWorkoutProgressHandler] Erro:", error);
		// Se o erro for P2025 (record not found), tratar como sucesso (idempotência)
		if (error.code === "P2025") {
			return successResponse({
				message: "Progresso não encontrado (já estava deletado)",
			});
		}
		return internalErrorResponse("Erro ao deletar progresso", error);
	}
}

/**
 * GET /api/workouts/history
 * Busca histórico de workouts
 */
export async function getWorkoutHistoryHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student.id;

		// Validar query params com Zod
		const queryValidation = await validateQuery(
			request,
			workoutHistoryQuerySchema,
		);
		if (!queryValidation.success) {
			return queryValidation.response;
		}

		const limit = queryValidation.data.limit || 10;
		const offset = queryValidation.data.offset || 0;

		// Buscar histórico
		const workoutHistory = await db.workoutHistory.findMany({
			where: {
				studentId: studentId,
			},
			include: {
				workout: {
					select: {
						id: true,
						title: true,
						type: true,
						muscleGroup: true,
					},
				},
				exercises: {
					orderBy: {
						id: "asc",
					},
				},
			},
			orderBy: {
				date: "desc",
			},
			take: limit,
			skip: offset,
		});

		// Transformar para formato esperado
		const formattedHistory = workoutHistory.map((wh) => {
			// Calcular volume total
			let calculatedVolume = 0;
			if (wh.exercises && wh.exercises.length > 0) {
				calculatedVolume = wh.exercises.reduce((acc, el) => {
					try {
						const sets = JSON.parse(el.sets);
						if (Array.isArray(sets)) {
							return (
								acc +
								sets.reduce((setAcc: number, set: any) => {
									if (set.weight && set.reps && set.completed) {
										return setAcc + set.weight * set.reps;
									}
									return setAcc;
								}, 0)
							);
						}
					} catch (_e) {
						// Ignorar erro de parse
					}
					return acc;
				}, 0);
			}

			// Parse bodyPartsFatigued
			let bodyPartsFatigued: string[] = [];
			if (wh.bodyPartsFatigued) {
				try {
					bodyPartsFatigued = JSON.parse(wh.bodyPartsFatigued);
				} catch (_e) {
					// Ignorar erro de parse
				}
			}

			return {
				date: wh.date,
				workoutId: wh.workoutId,
				workoutName: wh.workout.title,
				duration: wh.duration,
				totalVolume: wh.totalVolume || calculatedVolume,
				exercises: wh.exercises.map((el) => {
					let sets: any[] = [];
					try {
						sets = JSON.parse(el.sets);
					} catch (_e) {
						// Ignorar erro de parse
					}

					return {
						id: el.id,
						exerciseId: el.exerciseId,
						exerciseName: el.exerciseName,
						workoutId: wh.workoutId,
						date: wh.date,
						sets: sets,
						notes: el.notes || undefined,
						formCheckScore: el.formCheckScore || undefined,
						difficulty: el.difficulty || undefined,
					};
				}),
				overallFeedback:
					(wh.overallFeedback as "excelente" | "bom" | "regular" | "ruim") ||
					undefined,
				bodyPartsFatigued: bodyPartsFatigued,
			};
		});

		// Contar total
		const total = await db.workoutHistory.count({
			where: {
				studentId: studentId,
			},
		});

		return successResponse({
			history: formattedHistory,
			total: total,
			limit: limit,
			offset: offset,
		});
	} catch (error: any) {
		console.error("[getWorkoutHistoryHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar histórico", error);
	}
}

/**
 * PUT /api/workouts/history/[historyId]/exercises/[exerciseId]
 * Atualiza um exercício específico em um workout já completado
 */
export async function updateExerciseLogHandler(
	request: NextRequest,
	historyId: string,
	exerciseId: string,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student.id;

		if (!historyId || !exerciseId) {
			return badRequestResponse("historyId e exerciseId são obrigatórios");
		}

		// Verificar se o workout history pertence ao student
		const workoutHistory = await db.workoutHistory.findUnique({
			where: { id: historyId },
			include: {
				exercises: true,
			},
		});

		if (!workoutHistory) {
			return notFoundResponse("Histórico de workout não encontrado");
		}

		if (workoutHistory.studentId !== studentId) {
			return badRequestResponse(
				"Você não tem permissão para atualizar este workout",
			);
		}

		// Verificar se o exercício existe no histórico
		const exerciseLog = workoutHistory.exercises.find(
			(ex) => ex.id === exerciseId,
		);

		if (!exerciseLog) {
			return notFoundResponse("Exercício não encontrado neste workout");
		}

		// Validar body com Zod
		const validation = await validateBody(request, updateExerciseLogSchema);
		if (!validation.success) {
			return validation.response;
		}

		const { sets, notes, formCheckScore, difficulty } = validation.data;

		// Preparar dados para atualização
		const updateData: any = {};

		if (sets !== undefined) {
			updateData.sets = JSON.stringify(sets);
		}

		if (notes !== undefined) {
			updateData.notes = notes || null;
		}

		if (formCheckScore !== undefined) {
			updateData.formCheckScore =
				formCheckScore !== null && formCheckScore !== undefined
					? formCheckScore
					: null;
		}

		if (difficulty !== undefined) {
			updateData.difficulty = difficulty || null;
		}

		// Atualizar o exercício
		const updatedExerciseLog = await db.exerciseLog.update({
			where: { id: exerciseId },
			data: updateData,
		});

		// Recalcular volume total do workout history
		const allExercises = await db.exerciseLog.findMany({
			where: { workoutHistoryId: historyId },
		});

		let newTotalVolume = 0;
		for (const ex of allExercises) {
			try {
				const exerciseSets = JSON.parse(ex.sets);
				if (Array.isArray(exerciseSets)) {
					const exerciseVolume = exerciseSets.reduce(
						(acc: number, set: any) => {
							if (set.weight && set.reps && set.completed) {
								return acc + set.weight * set.reps;
							}
							return acc;
						},
						0,
					);
					newTotalVolume += exerciseVolume;
				}
			} catch (_e) {
				// Ignorar erro de parse
			}
		}

		// Atualizar volume total no workout history
		await db.workoutHistory.update({
			where: { id: historyId },
			data: { totalVolume: newTotalVolume },
		});

		// Parsear sets para retornar
		let parsedSets: any[] = [];
		try {
			parsedSets = JSON.parse(updatedExerciseLog.sets);
		} catch (_e) {
			// Ignorar erro de parse
		}

		return successResponse({
			exerciseLog: {
				id: updatedExerciseLog.id,
				exerciseId: updatedExerciseLog.exerciseId,
				exerciseName: updatedExerciseLog.exerciseName,
				sets: parsedSets,
				notes: updatedExerciseLog.notes || undefined,
				formCheckScore: updatedExerciseLog.formCheckScore || undefined,
				difficulty: updatedExerciseLog.difficulty || undefined,
			},
			totalVolume: newTotalVolume,
		});
	} catch (error: any) {
		console.error("[updateExerciseLogHandler] Erro:", error);
		if (error.code === "P2025") {
			return notFoundResponse("Exercício não encontrado");
		}
		return internalErrorResponse("Erro ao atualizar exercício", error);
	}
}

/**
 * PUT /api/workouts/[id]/progress/exercises/[exerciseId]
 * Atualiza um exercício específico no progresso atual de um workout
 */
export async function updateWorkoutProgressExerciseHandler(
	request: NextRequest,
	workoutId: string,
	exerciseId: string,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student.id;

		if (!workoutId || !exerciseId) {
			return badRequestResponse("workoutId e exerciseId são obrigatórios");
		}

		// Buscar progresso atual
		const progress = await db.workoutProgress.findUnique({
			where: {
				studentId_workoutId: {
					studentId: studentId,
					workoutId: workoutId,
				},
			},
		});

		if (!progress) {
			return notFoundResponse("Progresso do workout não encontrado");
		}

		// Validar body com Zod
		const validation = await validateBody(request, updateExerciseLogSchema);
		if (!validation.success) {
			return validation.response;
		}

		const { sets, notes, formCheckScore, difficulty } = validation.data;

		// Parsear exerciseLogs atual
		let exerciseLogs: any[] = [];
		try {
			exerciseLogs = JSON.parse(progress.exerciseLogs || "[]");
		} catch (_e) {
			exerciseLogs = [];
		}

		// Encontrar e atualizar o exercício
		const exerciseIndex = exerciseLogs.findIndex(
			(log) => log.exerciseId === exerciseId || log.id === exerciseId,
		);

		if (exerciseIndex === -1) {
			return notFoundResponse("Exercício não encontrado no progresso");
		}

		// Atualizar dados do exercício
		if (sets !== undefined) {
			exerciseLogs[exerciseIndex].sets = sets;
		}

		if (notes !== undefined) {
			exerciseLogs[exerciseIndex].notes = notes || null;
		}

		if (formCheckScore !== undefined) {
			exerciseLogs[exerciseIndex].formCheckScore =
				formCheckScore !== null && formCheckScore !== undefined
					? formCheckScore
					: null;
		}

		if (difficulty !== undefined) {
			exerciseLogs[exerciseIndex].difficulty = difficulty || null;
		}

		// Recalcular volume total
		let newTotalVolume = 0;
		for (const log of exerciseLogs) {
			if (log.sets && Array.isArray(log.sets)) {
				const exerciseVolume = log.sets.reduce((acc: number, set: any) => {
					if (set.weight && set.reps && set.completed) {
						return acc + set.weight * set.reps;
					}
					return acc;
				}, 0);
				newTotalVolume += exerciseVolume;
			}
		}

		// Atualizar progresso
		await db.workoutProgress.update({
			where: {
				studentId_workoutId: {
					studentId: studentId,
					workoutId: workoutId,
				},
			},
			data: {
				exerciseLogs: JSON.stringify(exerciseLogs),
				totalVolume: newTotalVolume,
			},
		});

		return successResponse({
			exerciseLog: exerciseLogs[exerciseIndex],
			totalVolume: newTotalVolume,
		});
	} catch (error: any) {
		console.error("[updateWorkoutProgressExerciseHandler] Erro:", error);
		if (error.code === "P2025") {
			return notFoundResponse("Progresso não encontrado");
		}
		return internalErrorResponse("Erro ao atualizar exercício", error);
	}
}
