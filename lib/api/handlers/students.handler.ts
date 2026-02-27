/**
 * Handler de Students
 *
 * Centraliza toda a lógica das rotas relacionadas a students
 */

import { type NextRequest, NextResponse } from "next/server";
import { getAllStudentData } from "@/app/student/actions-unified";
import { db } from "@/lib/db";
import { getNextMonday } from "@/lib/utils/week";
import { updateStudentProfileUseCase } from "@/lib/use-cases/students/update-profile";
import { requireStudent } from "../middleware/auth.middleware";
import {
	validateBody,
	validateQuery,
} from "../middleware/validation.middleware";
import {
	addWeightSchema,
	studentSectionsQuerySchema,
	updateStudentProfileSchema,
	updateStudentProgressSchema,
	weightHistoryQuerySchema,
} from "../schemas";
import {
	badRequestResponse,
	internalErrorResponse,
	successResponse,
} from "../utils/response.utils";

/**
 * GET /api/students/all
 * Retorna todos os dados do student ou seções específicas
 */
export async function getAllStudentDataHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		// Validar query params com Zod
		const queryValidation = await validateQuery(
			request,
			studentSectionsQuerySchema,
		);
		if (!queryValidation.success) {
			return queryValidation.response;
		}

		const sectionsParam = queryValidation.data.sections;
		let sections: string[] | undefined;
		if (sectionsParam) {
			sections = sectionsParam.split(",").map((s: string) => s.trim());
		}

		// Buscar dados
		const data = await getAllStudentData(sections);

		return NextResponse.json(data, {
			status: 200,
			headers: {
				"Cache-Control": "private, no-cache, no-store, must-revalidate",
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("[getAllStudentDataHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar dados do student", error);
	}
}

/**
 * GET /api/students/profile
 * Verifica se o student tem perfil completo
 */
export async function getStudentProfileHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const userId = auth.userId;

		const user = await db.user.findUnique({
			where: { id: userId },
			include: {
				student: {
					include: {
						profile: true,
					},
				},
			},
		});

		if (!user || !user.student) {
			return successResponse({
				hasProfile: false,
			});
		}

		const hasProfile =
			!!user.student.profile &&
			user.student.profile.height !== null &&
			user.student.profile.weight !== null &&
			user.student.profile.fitnessLevel !== null;

		return successResponse({
			hasProfile,
			// Incluir informações do Student também (isTrans, usesHormones, hormoneType)
			student: {
				id: user.student.id,
				age: user.student.age,
				gender: user.student.gender,
				isTrans: user.student.isTrans ?? false,
				usesHormones: user.student.usesHormones ?? false,
				hormoneType: user.student.hormoneType || null,
			},
			profile: user.student.profile
				? {
						height: user.student.profile.height,
						weight: user.student.profile.weight,
						fitnessLevel: user.student.profile.fitnessLevel,
						weeklyWorkoutFrequency: user.student.profile.weeklyWorkoutFrequency,
						workoutDuration: user.student.profile.workoutDuration,
						goals: user.student.profile.goals
							? JSON.parse(user.student.profile.goals)
							: [],
						availableEquipment: user.student.profile.availableEquipment
							? JSON.parse(user.student.profile.availableEquipment)
							: [],
						gymType: user.student.profile.gymType,
						preferredWorkoutTime: user.student.profile.preferredWorkoutTime,
						preferredSets: user.student.profile.preferredSets,
						preferredRepRange: user.student.profile.preferredRepRange,
						restTime: user.student.profile.restTime,
						// Valores metabólicos
						bmr: user.student.profile.bmr,
						tdee: user.student.profile.tdee,
						targetCalories: user.student.profile.targetCalories,
						targetProtein: user.student.profile.targetProtein,
						targetCarbs: user.student.profile.targetCarbs,
						targetFats: user.student.profile.targetFats,
						// Nível de atividade e tratamento hormonal
						activityLevel: user.student.profile.activityLevel,
						hormoneTreatmentDuration:
							user.student.profile.hormoneTreatmentDuration,
						// Limitações
						physicalLimitations: user.student.profile.physicalLimitations
							? JSON.parse(user.student.profile.physicalLimitations)
							: [],
						motorLimitations: user.student.profile.motorLimitations
							? JSON.parse(user.student.profile.motorLimitations)
							: [],
						medicalConditions: user.student.profile.medicalConditions
							? JSON.parse(user.student.profile.medicalConditions)
							: [],
						limitationDetails: user.student.profile.limitationDetails
							? JSON.parse(user.student.profile.limitationDetails)
							: null,
						// Horas disponíveis por dia para treino
						dailyAvailableHours: user.student.profile.dailyAvailableHours,
						// Manter compatibilidade com campo antigo
						injuries: user.student.profile.injuries
							? JSON.parse(user.student.profile.injuries)
							: [],
					}
				: null,
		});
	} catch (error) {
		console.error("[getStudentProfileHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar perfil", error);
	}
}

/**
 * POST /api/students/profile
 * Cria ou atualiza o perfil do student
 */
export async function updateStudentProfileHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) return auth.response;

		const validation = await validateBody(request, updateStudentProfileSchema);
		if (!validation.success) return validation.response;

		await updateStudentProfileUseCase({
			userId: auth.userId,
			data: validation.data,
		});

		return successResponse({ message: "Perfil salvo com sucesso" });
	} catch (error) {
		console.error("[updateStudentProfileHandler] Erro:", error);
		if (error instanceof Error) {
			if (error.message === "Usuário não encontrado")
				return badRequestResponse("Usuário não encontrado");
			if (error.message === "Usuário não é um aluno")
				return badRequestResponse("Usuário não é um aluno");
		}
		return internalErrorResponse("Erro ao salvar perfil", error);
	}
}

/**
 * GET /api/students/weight
 * Busca histórico de peso com paginação
 */
export async function getWeightHistoryHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student!.id;

		// Validar query params com Zod
		const queryValidation = await validateQuery(
			request,
			weightHistoryQuerySchema,
		);
		if (!queryValidation.success) {
			return queryValidation.response;
		}

		const limit = queryValidation.data.limit || 30;
		const offset = queryValidation.data.offset || 0;

		// Buscar histórico de peso
		const weightHistory = await db.weightHistory.findMany({
			where: {
				studentId: studentId,
			},
			orderBy: {
				date: "desc",
			},
			take: limit,
			skip: offset,
		});

		// Transformar para formato esperado
		const formattedHistory = weightHistory.map((wh) => ({
			date: wh.date,
			weight: wh.weight,
			notes: wh.notes || undefined,
		}));

		// Contar total de registros
		const total = await db.weightHistory.count({
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
	} catch (error) {
		console.error("[getWeightHistoryHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar histórico", error);
	}
}

/**
 * POST /api/students/weight
 * Adiciona uma nova entrada de peso
 */
export async function addWeightHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student!.id;

		// Validar body com Zod
		const validation = await validateBody(request, addWeightSchema);
		if (!validation.success) {
			return validation.response;
		}

		const { weight, date, notes } = validation.data;

		// Criar entrada de peso
		const weightEntry = await db.weightHistory.create({
			data: {
				studentId: studentId,
				weight: weight,
				date: date ? new Date(date) : new Date(),
				notes: notes || null,
			},
		});

		// Atualizar peso atual no StudentProfile
		await db.studentProfile.update({
			where: { studentId: studentId },
			data: { weight: weight },
		});

		return successResponse({
			weightEntry: {
				id: weightEntry.id,
				weight: weightEntry.weight,
				date: weightEntry.date,
				notes: weightEntry.notes,
			},
		});
	} catch (error) {
		console.error("[addWeightHandler] Erro:", error);
		return internalErrorResponse("Erro ao salvar peso", error);
	}
}

/**
 * GET /api/students/weight-history
 * Busca histórico de peso com filtros de data
 */
export async function getWeightHistoryFilteredHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student!.id;

		// Validar query params com Zod
		const queryValidation = await validateQuery(
			request,
			weightHistoryQuerySchema,
		);
		if (!queryValidation.success) {
			return queryValidation.response;
		}

		const limit = queryValidation.data.limit || 30;
		const offset = queryValidation.data.offset || 0;
		const startDate = queryValidation.data.startDate;
		const endDate = queryValidation.data.endDate;

		// Construir filtros
		const where: {
			studentId: string;
			date?: { gte?: Date; lte?: Date };
		} = {
			studentId: studentId,
		};

		if (startDate || endDate) {
			where.date = {};
			if (startDate) {
				where.date.gte = new Date(startDate);
			}
			if (endDate) {
				where.date.lte = new Date(endDate);
			}
		}

		// Buscar histórico de peso
		const weightHistory = await db.weightHistory.findMany({
			where,
			orderBy: {
				date: "desc",
			},
			take: limit,
			skip: offset,
		});

		// Transformar para formato esperado
		const formattedHistory = weightHistory.map((wh) => ({
			date: wh.date,
			weight: wh.weight,
			notes: wh.notes || undefined,
		}));

		// Contar total de registros
		const total = await db.weightHistory.count({
			where: where,
		});

		return successResponse({
			history: formattedHistory,
			total: total,
			limit: limit,
			offset: offset,
		});
	} catch (error) {
		console.error("[getWeightHistoryFilteredHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar histórico", error);
	}
}

/**
 * GET /api/students/progress
 * Busca progresso do student (XP, streaks, achievements, etc.)
 */
export async function getStudentProgressHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student!.id;

		const progress = await db.studentProgress.findUnique({
			where: { studentId },
		});

		if (!progress) {
			return successResponse({
				currentStreak: 0,
				longestStreak: 0,
				totalXP: 0,
				currentLevel: 1,
				xpToNextLevel: 100,
				workoutsCompleted: 0,
				todayXP: 0,
				achievements: [],
				lastActivityDate: new Date().toISOString(),
				dailyGoalXP: 50,
				weeklyXP: [0, 0, 0, 0, 0, 0, 0],
			});
		}

		// Buscar achievements
		const achievementUnlocks = await db.achievementUnlock.findMany({
			where: { studentId },
			include: { achievement: true },
			orderBy: { unlockedAt: "desc" },
		});

		const achievements = achievementUnlocks.map((unlock) => ({
			id: unlock.achievement.id,
			title: unlock.achievement.title,
			description: unlock.achievement.description || "",
			icon: unlock.achievement.icon || "🏆",
			unlockedAt: unlock.unlockedAt,
			progress: unlock.progress || undefined,
			target: unlock.achievement.target || undefined,
			category: unlock.achievement.category as
				| "streak"
				| "workouts"
				| "xp"
				| "perfect"
				| "special",
			level: unlock.achievement.level || undefined,
			color: unlock.achievement.color || "#58CC02",
		}));

		// Calcular weeklyXP
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const workoutHistoryForXP = await db.workoutHistory.findMany({
			where: {
				studentId,
				date: { gte: sevenDaysAgo },
			},
			include: {
				workout: { select: { xpReward: true } },
			},
		});

		const weeklyXP = [0, 0, 0, 0, 0, 0, 0];
		workoutHistoryForXP.forEach((wh) => {
			const dayOfWeek = wh.date.getDay();
			weeklyXP[dayOfWeek] += wh.workout?.xpReward ?? 0;
		});

		// Recalcular streak baseado em dias consecutivos
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
		let calculatedStreak = 0;
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const checkDate = new Date(today);

		while (true) {
			const dateStr = checkDate.toISOString().split("T")[0];
			if (workoutDays.has(dateStr)) {
				calculatedStreak++;
				// Ir para o dia anterior
				checkDate.setDate(checkDate.getDate() - 1);
			} else {
				break;
			}
		}

		// Atualizar o streak no banco se estiver diferente
		if (calculatedStreak !== (progress.currentStreak || 0)) {
			const longestStreak = Math.max(
				calculatedStreak,
				progress.longestStreak || 0,
			);

			await db.studentProgress.update({
				where: { studentId },
				data: {
					currentStreak: calculatedStreak,
					longestStreak: longestStreak,
				},
			});
		}

		return successResponse({
			currentStreak: calculatedStreak,
			longestStreak: Math.max(calculatedStreak, progress.longestStreak || 0),
			totalXP: progress.totalXP || 0,
			currentLevel: progress.currentLevel || 1,
			xpToNextLevel: progress.xpToNextLevel || 100,
			workoutsCompleted: progress.workoutsCompleted || 0,
			todayXP: progress.todayXP || 0,
			achievements,
			lastActivityDate: progress.lastActivityDate
				? progress.lastActivityDate.toISOString()
				: new Date().toISOString(),
			dailyGoalXP: progress.dailyGoalXP || 50,
			weeklyXP,
		});
	} catch (error) {
		console.error("[getStudentProgressHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar progresso", error);
	}
}

/**
 * PUT /api/students/progress
 * Atualiza o progresso do student
 */
export async function updateStudentProgressHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student!.id;

		// Validar body com Zod
		const validation = await validateBody(request, updateStudentProgressSchema);
		if (!validation.success) {
			return validation.response;
		}

		const data = validation.data;

		// Buscar progresso atual
		const progress = await db.studentProgress.findUnique({
			where: { studentId },
		});

		if (!progress) {
			// Criar progresso se não existir
			await db.studentProgress.create({
				data: {
					studentId,
					...data,
				},
			});
		} else {
			// Atualizar progresso
			await db.studentProgress.update({
				where: { studentId },
				data: {
					...data,
					// Converter lastActivityDate para Date se fornecido
					lastActivityDate: data.lastActivityDate
						? new Date(data.lastActivityDate)
						: undefined,
				},
			});
		}

		return successResponse({
			message: "Progresso atualizado com sucesso",
		});
	} catch (error) {
		console.error("[updateStudentProgressHandler] Erro:", error);
		return internalErrorResponse("Erro ao atualizar progresso", error);
	}
}

/**
 * GET /api/students/student
 * Busca informações básicas do student
 */
export async function getStudentInfoHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student!.id;

		const student = await db.student.findUnique({
			where: { id: studentId },
			select: {
				id: true,
				age: true,
				gender: true,
				phone: true,
				avatar: true,
				// Informações sobre identidade de gênero e terapia hormonal
				isTrans: true,
				usesHormones: true,
				hormoneType: true,
			},
		});

		if (!student) {
			return successResponse({
				id: studentId,
				age: null,
				gender: null,
				phone: null,
				avatar: null,
			});
		}

		return successResponse({
			id: student.id,
			age: student.age,
			gender: student.gender,
			phone: student.phone,
			avatar: student.avatar,
			isTrans: student.isTrans ?? false,
			usesHormones: student.usesHormones ?? false,
			hormoneType: student.hormoneType || null,
		});
	} catch (error) {
		console.error("[getStudentInfoHandler] Erro:", error);
		return internalErrorResponse(
			"Erro ao buscar informações do student",
			error,
		);
	}
}

/**
 * GET /api/students/personal-records
 * Busca personal records do student
 */
export async function getPersonalRecordsHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student!.id;

		const personalRecords = await db.personalRecord.findMany({
			where: { studentId },
			orderBy: { date: "desc" },
			take: 50,
		});

		const formattedRecords = personalRecords.map((pr) => ({
			exerciseId: pr.exerciseId,
			exerciseName: pr.exerciseName,
			type: pr.type as "max-weight" | "max-reps" | "max-volume",
			value: pr.value,
			date: pr.date,
			previousBest: pr.previousBest || undefined,
		}));

		return successResponse({
			records: formattedRecords,
			total: formattedRecords.length,
		});
	} catch (error) {
		console.error("[getPersonalRecordsHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar personal records", error);
	}
}

/**
 * GET /api/students/day-passes
 * Busca day passes do student
 */
export async function getDayPassesHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student!.id;

		const dayPasses = await db.dayPass.findMany({
			where: { studentId },
			orderBy: { purchaseDate: "desc" },
			take: 50,
		});

		const formattedDayPasses = dayPasses.map((dp) => ({
			id: dp.id,
			gymId: dp.gymId,
			gymName: dp.gymName,
			purchaseDate: dp.purchaseDate,
			validDate: dp.validDate,
			price: dp.price,
			status: dp.status,
			qrCode: dp.qrCode || undefined,
		}));

		return successResponse({
			dayPasses: formattedDayPasses,
			total: formattedDayPasses.length,
		});
	} catch (error) {
		console.error("[getDayPassesHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar day passes", error);
	}
}

/**
 * GET /api/students/friends
 * Busca amigos do student
 */
export async function getFriendsHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student!.id;

		const friendships = await db.friendship.findMany({
			where: {
				userId: studentId,
				status: "accepted",
			},
			include: {
				friend: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								image: true,
							},
						},
					},
				},
			},
		});

		const friends = {
			count: friendships.length,
			list: friendships.map((f) => ({
				id: f.friend.id,
				name: f.friend.user.name,
				avatar: f.friend.user.image || undefined,
				username: undefined, // Pode ser adicionado depois
			})),
		};

		return successResponse(friends);
	} catch (error) {
		console.error("[getFriendsHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar amigos", error);
	}
}

/**
 * PATCH /api/students/week-reset
 * Reset manual da semana - avança weekOverride para próxima segunda
 */
export async function weekResetHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const studentId = auth.user.student!.id;
		const nextMonday = getNextMonday();

		await db.student.update({
			where: { id: studentId },
			data: { weekOverride: nextMonday },
		});

		return successResponse({
			message: "Semana resetada. Nodes reabilitados!",
			weekStart: nextMonday.toISOString(),
		});
	} catch (error) {
		console.error("[weekResetHandler] Erro:", error);
		return internalErrorResponse("Erro ao resetar semana");
	}
}
