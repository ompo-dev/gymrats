"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";

import type {
	CheckIn,
	Equipment,
	Expense,
	FinancialSummary,
	GymProfile,
	GymStats,
	Payment,
	StudentData,
	UserProfile,
	WorkoutHistory,
} from "@/lib/types";

import { getSession } from "@/lib/utils/session";

export async function getCurrentUserInfo() {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) {
			console.log("[getCurrentUserInfo] Sem token de sessão");
			return { isAdmin: false, role: null };
		}

		const session = await getSession(sessionToken);
		if (!session) {
			console.log("[getCurrentUserInfo] Sessão não encontrada");
			return { isAdmin: false, role: null };
		}

		const isAdmin = session.user.role === "ADMIN";
		const role = session.user.role;

		console.log("[getCurrentUserInfo] User role:", role, "isAdmin:", isAdmin);

		return {
			isAdmin,
			role,
		};
	} catch (error) {
		console.error(
			"[getCurrentUserInfo] Erro ao buscar informações do usuário:",
			error,
		);
		return { isAdmin: false, role: null };
	}
}

export async function getGymProfile(): Promise<GymProfile | null> {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) return null;

		const session = await getSession(sessionToken);
		if (!session) return null;

		// Buscar o usuário com activeGymId
		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		const gymId = user?.activeGymId;

		if (!gymId) return null;

		const gym = await db.gym.findUnique({
			where: { id: gymId },
			include: {
				profile: true,
			},
		});

		if (!gym || !gym.profile) return null;

		const gymProfile: GymProfile = {
			id: gym.id,
			name: gym.name,
			logo: gym.logo || undefined,
			address: gym.address,
			phone: gym.phone,
			email: gym.email,
			cnpj: gym.cnpj || "",
			plan: gym.plan as "basic" | "premium" | "enterprise",
			totalStudents: gym.profile.totalStudents,
			activeStudents: gym.profile.activeStudents,
			equipmentCount: gym.profile.equipmentCount,
			createdAt: gym.createdAt,
			gamification: {
				level: gym.profile.level,
				xp: gym.profile.xp,
				xpToNextLevel: gym.profile.xpToNextLevel,
				currentStreak: gym.profile.currentStreak,
				longestStreak: gym.profile.longestStreak,
				achievements: [],
				monthlyStudentGoal: gym.profile.monthlyStudentGoal ?? 0,
				avgStudentFrequency: gym.profile.avgStudentFrequency ?? 0,
				equipmentUtilization: gym.profile.equipmentUtilization ?? 0,
				ranking: gym.profile.ranking ?? 0,
			},
		};

		return gymProfile;
	} catch (error) {
		console.error("Erro ao buscar perfil da academia:", error);
		return null;
	}
}

export async function getGymStats(): Promise<GymStats | null> {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) return null;

		const session = await getSession(sessionToken);
		if (!session) return null;

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		const gymId = user?.activeGymId;
		if (!gymId) return null;

		const stats = await db.gymStats.findUnique({
			where: { gymId },
		});

		if (!stats) return null;

		const gymStats: GymStats = {
			today: {
				checkins: stats.todayCheckins,
				activeStudents: stats.todayActiveStudents,
				equipmentInUse: stats.todayEquipmentInUse,
				peakHour: "19:00",
			},
			week: {
				totalCheckins: stats.weekTotalCheckins,
				avgDailyCheckins: stats.weekAvgDailyCheckins,
				newMembers: stats.weekNewMembers,
				canceledMembers: stats.weekCanceledMembers,
				revenue: 0,
			},
			month: {
				totalCheckins: stats.monthTotalCheckins,
				retentionRate: stats.monthRetentionRate,
				growthRate: stats.monthGrowthRate,
				topStudents: [],
				mostUsedEquipment: [],
			},
		};

		return gymStats;
	} catch (error) {
		console.error("Erro ao buscar estatísticas da academia:", error);
		return null;
	}
}

export async function getGymStudents(): Promise<StudentData[]> {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) return [];

		const session = await getSession(sessionToken);
		if (!session) return [];

		const gymUser = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		const gymId = gymUser?.activeGymId;
		if (!gymId) return [];

		const memberships = await db.gymMembership.findMany({
			where: { gymId },
			include: {
				student: {
					include: {
						user: true,
						profile: true,
						progress: true,
					},
				},
			},
		});

		const students: StudentData[] = memberships.map((membership) => {
			const student = membership.student;
			const user = student.user;
			const profile = student.profile;
			const progress = student.progress;

			return {
				id: student.id,
				name: user.name,
				email: user.email,
				avatar: student.avatar || undefined,
				age: student.age ?? 0,
				gender: (student.gender as "male" | "female") || "male",
				phone: student.phone || "",
				membershipStatus: membership.status as
					| "active"
					| "inactive"
					| "suspended",
				joinDate: membership.createdAt,
				lastVisit: undefined,
				totalVisits: 0,
				currentStreak: progress?.currentStreak || 0,
				currentWeight: profile?.weight ?? 0,
				attendanceRate: 0,
				favoriteEquipment: [],
				assignedTrainer: undefined,
				profile: profile
					? {
							id: student.id,
							name: user.name,
							age: student.age ?? 0,
							gender: (student.gender as "male" | "female") || "male",
							height: profile.height ?? 0,
							weight: profile.weight ?? 0,
							fitnessLevel:
								(profile.fitnessLevel as
									| "iniciante"
									| "intermediario"
									| "avancado") || "iniciante",
							weeklyWorkoutFrequency:
								profile.weeklyWorkoutFrequency || undefined,
							workoutDuration: profile.workoutDuration ?? 0,
							goals: profile.goals ? JSON.parse(profile.goals) : [],
							availableEquipment: profile.availableEquipment
								? JSON.parse(profile.availableEquipment)
								: [],
							gymType: profile.gymType || undefined,
							preferredWorkoutTime: profile.preferredWorkoutTime || undefined,
							preferredSets: profile.preferredSets || undefined,
							preferredRepRange: profile.preferredRepRange || undefined,
							restTime: profile.restTime || undefined,
							targetCalories: profile.targetCalories || undefined,
							targetProtein: profile.targetProtein || undefined,
						}
					: {
							id: student.id,
							name: user.name,
							age: student.age ?? 0,
							gender: (student.gender as "male" | "female") || "male",
							height: 0,
							weight: 0,
							fitnessLevel: undefined,
							weeklyWorkoutFrequency: undefined,
							workoutDuration: undefined,
							goals: [],
							availableEquipment: [],
							gymType: undefined,
							preferredWorkoutTime: undefined,
							preferredSets: undefined,
							preferredRepRange: undefined,
							restTime: undefined,
							targetCalories: undefined,
							targetProtein: undefined,
						},
				progress: progress
					? {
							currentStreak: progress.currentStreak || 0,
							longestStreak: progress.longestStreak || 0,
							totalXP: progress.totalXP || 0,
							currentLevel: progress.currentLevel || 1,
							xpToNextLevel: progress.xpToNextLevel || 0,
							workoutsCompleted: progress.workoutsCompleted || 0,
							todayXP: progress.todayXP || 0,
							achievements: [],
							lastActivityDate:
								progress.lastActivityDate?.toISOString() ||
								new Date().toISOString(),
							dailyGoalXP: progress.dailyGoalXP || 50,
							weeklyXP: [0, 0, 0, 0, 0, 0, 0],
						}
					: {
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
						},
				workoutHistory: [],
				personalRecords: [],
				weightHistory: [],
			} as StudentData;
		});

		return students;
	} catch (error) {
		console.error("Erro ao buscar alunos da academia:", error);
		return [];
	}
}

export async function getGymEquipment(): Promise<Equipment[]> {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) return [];

		const session = await getSession(sessionToken);
		if (!session) return [];

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		const gymId = user?.activeGymId;
		if (!gymId) return [];

		const equipment = await db.equipment.findMany({
			where: { gymId },
		});

		const equipmentList: Equipment[] = equipment.map((eq) => ({
			id: eq.id,
			name: eq.name,
			type: eq.type as "cardio" | "musculacao" | "funcional",
			brand: eq.brand || undefined,
			model: eq.model || undefined,
			serialNumber: eq.serialNumber || undefined,
			purchaseDate: eq.purchaseDate || undefined,
			lastMaintenance: eq.lastMaintenance || undefined,
			nextMaintenance: eq.nextMaintenance || undefined,
			status: eq.status as "available" | "in-use" | "maintenance" | "broken",
			currentUser:
				eq.currentUserId && eq.currentUserName && eq.currentStartTime
					? {
							studentId: eq.currentUserId,
							studentName: eq.currentUserName,
							startTime: eq.currentStartTime,
						}
					: undefined,
			usageStats: {
				totalUses: 0,
				avgUsageTime: 0,
				popularTimes: [],
			},
			maintenanceHistory: [],
		}));

		return equipmentList;
	} catch (error) {
		console.error("Erro ao buscar equipamentos da academia:", error);
		return [];
	}
}

export async function getGymFinancialSummary(): Promise<FinancialSummary | null> {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) return null;

		const session = await getSession(sessionToken);
		if (!session) return null;

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		const gymId = user?.activeGymId;
		if (!gymId) return null;

		const payments = await db.payment.findMany({
			where: { gymId },
		});

		const expenses = await db.expense.findMany({
			where: { gymId },
		});

		const totalRevenue = payments
			.filter((p) => p.status === "paid")
			.reduce((sum, p) => sum + p.amount, 0);

		const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

		const pendingPayments = payments
			.filter((p) => p.status === "pending")
			.reduce((sum, p) => sum + p.amount, 0);

		const overduePayments = payments
			.filter((p) => p.status === "overdue")
			.reduce((sum, p) => sum + p.amount, 0);

		const financialSummary: FinancialSummary = {
			totalRevenue,
			totalExpenses,
			netProfit: totalRevenue - totalExpenses,
			monthlyRecurring: totalRevenue,
			pendingPayments,
			overduePayments,
			averageTicket: payments.length > 0 ? totalRevenue / payments.length : 0,
			churnRate: 0,
			revenueGrowth: 0,
		};

		return financialSummary;
	} catch (error) {
		console.error("Erro ao buscar resumo financeiro:", error);
		return null;
	}
}

export async function getGymRecentCheckIns(): Promise<CheckIn[]> {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) return [];

		const session = await getSession(sessionToken);
		if (!session) return [];

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		const gymId = user?.activeGymId;
		if (!gymId) return [];

		const checkIns = await db.checkIn.findMany({
			where: { gymId },
			orderBy: { timestamp: "desc" },
			take: 10,
		});

		const recentCheckIns: CheckIn[] = checkIns.map((checkIn) => ({
			id: checkIn.id,
			studentId: checkIn.studentId,
			studentName: checkIn.studentName,
			timestamp: checkIn.timestamp,
		}));

		return recentCheckIns;
	} catch (error) {
		console.error("Erro ao buscar check-ins recentes:", error);
		return [];
	}
}

export async function getGymEquipmentById(equipmentId: string): Promise<Equipment | null> {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) return null;

		const session = await getSession(sessionToken);
		if (!session) return null;

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		const gymId = user?.activeGymId;
		if (!gymId) return null;

		const equipment = await db.equipment.findUnique({
			where: { id: equipmentId, gymId },
			include: {
				maintenanceHistory: true,
			},
		});

		if (!equipment) {
			return null;
		}

		const equipmentData: Equipment = {
			id: equipment.id,
			name: equipment.name,
			type: equipment.type as "cardio" | "musculacao" | "funcional",
			brand: equipment.brand || undefined,
			model: equipment.model || undefined,
			serialNumber: equipment.serialNumber || undefined,
			purchaseDate: equipment.purchaseDate || undefined,
			lastMaintenance: equipment.lastMaintenance || undefined,
			nextMaintenance: equipment.nextMaintenance || undefined,
			status: equipment.status as
				| "available"
				| "in-use"
				| "maintenance"
				| "broken",
			currentUser:
				equipment.currentUserId &&
				equipment.currentUserName &&
				equipment.currentStartTime
					? {
							studentId: equipment.currentUserId,
							studentName: equipment.currentUserName,
							startTime: equipment.currentStartTime,
						}
					: undefined,
			usageStats: {
				totalUses: 0,
				avgUsageTime: 0,
				popularTimes: [],
			},
			maintenanceHistory: equipment.maintenanceHistory.map((record) => ({
				id: record.id,
				date: record.date,
				type: record.type as "preventive" | "corrective" | "inspection",
				description: record.description || "",
				performedBy: record.performedBy || "",
				cost: record.cost || undefined,
				nextScheduled: record.nextScheduled || undefined,
			})),
		};

		return equipmentData;
	} catch (error) {
		console.error("Erro ao buscar equipamento:", error);
		return null;
	}
}

export async function getGymStudentById(studentId: string): Promise<StudentData | null> {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) return null;

		const session = await getSession(sessionToken);
		if (!session) return null;

		const gymUser = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		const gymId = gymUser?.activeGymId;
		if (!gymId) return null;

		const membership = await db.gymMembership.findFirst({
			where: {
				gymId,
				studentId: studentId,
			},
			include: {
				student: {
					include: {
						user: true,
						profile: true,
						progress: true,
					},
				},
			},
		});

		// Buscar dados reais de histório de treinos, recordes e peso
		const [workoutHistoryRows, personalRecordRows, weightHistoryRows, checkInRows] =
			await Promise.all([
				db.workoutHistory.findMany({
					where: { studentId },
					include: { exercises: true, workout: true },
					orderBy: { date: "desc" },
					take: 30,
				}),
				db.personalRecord.findMany({
					where: { studentId },
					orderBy: { date: "desc" },
				}),
				db.weightHistory.findMany({
					where: { studentId },
					orderBy: { date: "asc" },
					take: 60,
				}),
				db.checkIn.findMany({
					where: { gymId, studentId },
					orderBy: { timestamp: "desc" },
				}),
			]);

		// Calcular totalVisits e lastVisit a partir de check-ins
		const totalVisits = checkInRows.length;
		const lastVisit = checkInRows[0]?.timestamp;

		// Calcular attendanceRate: (check-ins na última semana / 7) × 100 (max 100)
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
		const weekCheckIns = checkInRows.filter((c) => c.timestamp >= oneWeekAgo).length;
		const attendanceRate = Math.min(Math.round((weekCheckIns / 7) * 100), 100);

		if (!membership || !membership.student) {
			return null;
		}

		const student = membership.student;
		const user = student.user;
		const profile = student.profile;
		const progress = student.progress;

		const studentData: StudentData = {
			id: student.id,
			name: user.name,
			email: user.email,
			avatar: student.avatar || undefined,
			age: student.age ?? 0,
			gender: (student.gender as "male" | "female") || "male",
			phone: student.phone || "",
			membershipStatus: membership.status as
				| "active"
				| "inactive"
				| "suspended",
			joinDate: membership.createdAt,
			lastVisit: lastVisit,
			totalVisits,
			currentStreak: progress?.currentStreak || 0,
			currentWeight: profile?.weight ?? 0,
			attendanceRate,
			favoriteEquipment: [],
			assignedTrainer: undefined,
			profile: profile
				? {
						id: student.id,
						name: user.name,
						age: student.age ?? 0,
						gender: (student.gender as "male" | "female") || "male",
						height: profile.height ?? 0,
						weight: profile.weight ?? 0,
						fitnessLevel:
							(profile.fitnessLevel as
								| "iniciante"
								| "intermediario"
								| "avancado") || "iniciante",
						weeklyWorkoutFrequency: profile.weeklyWorkoutFrequency ?? 0,
						workoutDuration: profile.workoutDuration ?? 0,
						goals: profile.goals ? JSON.parse(profile.goals) : [],
						availableEquipment: profile.availableEquipment
							? JSON.parse(profile.availableEquipment)
							: [],
						gymType: profile.gymType || undefined,
						preferredWorkoutTime: profile.preferredWorkoutTime || undefined,
						preferredSets: profile.preferredSets || undefined,
						preferredRepRange: profile.preferredRepRange || undefined,
						restTime: profile.restTime || undefined,
						targetCalories: profile.targetCalories || undefined,
						targetProtein: profile.targetProtein || undefined,
						targetCarbs: profile.targetCarbs || undefined,
						targetFats: profile.targetFats || undefined,
					} as UserProfile
				: {
						id: student.id,
						name: user.name,
						age: student.age ?? 0,
						gender: (student.gender as "male" | "female") || "male",
						height: 0,
						weight: 0,
						fitnessLevel: "iniciante",
						weeklyWorkoutFrequency: 0,
						workoutDuration: 0,
						goals: [],
						availableEquipment: [],
						gymType: "academia-completa",
						preferredWorkoutTime: "manha",
						preferredSets: 3,
						preferredRepRange: "hipertrofia",
						restTime: "medio",
						targetCalories: 2000,
						targetProtein: 100,
						targetCarbs: 200,
						targetFats: 50,
					} as UserProfile,
			progress: progress
				? {
						currentStreak: progress.currentStreak || 0,
						longestStreak: progress.longestStreak || 0,
						totalXP: progress.totalXP || 0,
						currentLevel: progress.currentLevel || 1,
						xpToNextLevel: progress.xpToNextLevel || 0,
						workoutsCompleted: progress.workoutsCompleted || 0,
						todayXP: progress.todayXP || 0,
						achievements: [],
						lastActivityDate:
							progress.lastActivityDate?.toISOString() ||
							new Date().toISOString(),
						dailyGoalXP: progress.dailyGoalXP || 50,
						weeklyXP: [0, 0, 0, 0, 0, 0, 0],
					}
				: {
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
					},
			workoutHistory: workoutHistoryRows.map((wh) => ({
				date: wh.date,
				workoutId: wh.workoutId ?? "",
				workoutName: wh.workout?.title ?? "Treino",
				duration: wh.duration,
				totalVolume: wh.totalVolume ?? 0,
				exercises: wh.exercises.map((ex) => ({
					exerciseId: ex.exerciseId,
					exerciseName: ex.exerciseName,
					sets: (() => {
						try { return JSON.parse(ex.sets); } catch { return []; }
					})(),
					notes: ex.notes ?? "",
				})),
			})) as unknown as WorkoutHistory[],
			personalRecords: personalRecordRows.map((pr) => ({
				exerciseId: pr.exerciseId,
				exerciseName: pr.exerciseName,
				type: pr.type as "max-weight" | "max-reps" | "max-volume",
				value: pr.value,
				date: pr.date,
				previousBest: pr.previousBest ?? undefined,
			})),
			weightHistory: weightHistoryRows.map((wh) => ({
				date: wh.date,
				weight: wh.weight,
			})),
			gymMembership: {
				id: membership.id,
				gymId: membership.gymId,
				gymName: "Academia",
				gymAddress: "",
				planId: membership.planId ?? "",
				planName: (membership as any).plan?.name ?? "Plano",
				planType: ((membership as any).plan?.type ?? "monthly") as "monthly" | "quarterly" | "semi-annual" | "annual",
				startDate: membership.createdAt,
				nextBillingDate: membership.nextBillingDate ?? membership.createdAt,
				amount: membership.amount,
				status: membership.status as "active" | "suspended" | "canceled" | "pending",
				autoRenew: membership.autoRenew,
				benefits: [],
			},
		};
	

		return studentData;
	} catch (error) {
		console.error("Erro ao buscar aluno:", error);
		return null;
	}
}

export async function getGymStudentPayments(studentId: string): Promise<Payment[]> {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) return [];

		const session = await getSession(sessionToken);
		if (!session) return [];

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		const gymId = user?.activeGymId;
		if (!gymId) return [];

		const payments = await db.payment.findMany({
			where: {
				gymId,
				studentId: studentId,
			},
			include: {
				plan: true,
			},
		});

		const paymentList: Payment[] = payments.map((payment) => ({
			id: payment.id,
			studentId: payment.studentId,
			studentName: payment.studentName,
			planId: payment.planId || "",
			planName: payment.plan?.name || "",
			amount: payment.amount,
			date: payment.date,
			dueDate: payment.dueDate,
			status: payment.status as "paid" | "pending" | "overdue",
			paymentMethod:
				(payment.paymentMethod as "pix" | "credit-card" | "bank-transfer") ||
				"pix",
		}));

		return paymentList;
	} catch (error) {
		console.error("Erro ao buscar pagamentos do aluno:", error);
		return [];
	}
}

export async function getGymPayments(): Promise<Payment[]> {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) return [];

		const session = await getSession(sessionToken);
		if (!session) return [];

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		const gymId = user?.activeGymId;
		if (!gymId) return [];

		const payments = await db.payment.findMany({
			where: { gymId },
			orderBy: { dueDate: "desc" },
			include: {
				plan: true,
			},
		});

		const paymentList: Payment[] = payments.map((payment) => ({
			id: payment.id,
			studentId: payment.studentId,
			studentName: payment.studentName,
			planId: payment.planId || "",
			planName: payment.plan?.name || "",
			amount: payment.amount,
			date: payment.date,
			dueDate: payment.dueDate,
			status: payment.status as "paid" | "pending" | "overdue",
			paymentMethod:
				(payment.paymentMethod as "pix" | "credit-card" | "bank-transfer") ||
				"pix",
		}));

		return paymentList;
	} catch (error) {
		console.error("Erro ao buscar pagamentos:", error);
		return [];
	}
}

export async function getGymCoupons() {
	// Coupons table not yet implemented in schema — return empty array
	return [];
}

export async function getGymReferrals() {
	// Referrals table not yet implemented in schema — return empty array
	return [];
}

export async function getGymExpenses(): Promise<Expense[]> {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) return [];

		const session = await getSession(sessionToken);
		if (!session) return [];

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		const gymId = user?.activeGymId;
		if (!gymId) return [];

		const expenses = await db.expense.findMany({
			where: { gymId },
			orderBy: { date: "desc" },
		});

		const expenseList: Expense[] = expenses.map((expense) => {
			const expenseTypeMap: Record<
				string,
				"maintenance" | "equipment" | "staff" | "utilities" | "rent" | "other"
			> = {
				maintenance: "maintenance",
				equipment: "equipment",
				staff: "staff",
				utilities: "utilities",
				rent: "rent",
				operational: "other",
				marketing: "other",
				other: "other",
			};

			return {
				id: expense.id,
				type: expenseTypeMap[expense.type] || "other",
				description: expense.description || "",
				amount: expense.amount,
				date: expense.date,
				category: expense.category || "",
			};
		});

		return expenseList;
	} catch (error) {
		console.error("Erro ao buscar despesas:", error);
		return [];
	}
}

export async function getGymMembershipPlans() {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) return [];

		const session = await getSession(sessionToken);
		if (!session) return [];

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		if (!user?.activeGymId) return [];

		const plans = await db.membershipPlan.findMany({
			where: { gymId: user.activeGymId, isActive: true },
			orderBy: { price: "asc" },
		});

		return plans.map((plan) => ({
			id: plan.id,
			name: plan.name,
			type: plan.type as "monthly" | "quarterly" | "semi-annual" | "annual" | "trial",
			price: plan.price,
			duration: plan.duration,
			benefits: (() => {
				const b = plan.benefits;
				if (!b) return [];
				try {
					return JSON.parse(b);
				} catch {
					return [];
				}
			})(),
			isActive: plan.isActive,
		}));
	} catch (error) {
		console.error("Erro ao buscar planos de assinatura:", error);
		return [];
	}
}

export async function getGymSubscription() {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) {
			return null;
		}

		const session = await getSession(sessionToken);
		if (!session) {
			return null;
		}

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		const gymId = user?.activeGymId;
		if (!gymId) {
			return null;
		}

		const subscription = await db.gymSubscription.findUnique({
			where: { gymId },
		});

		if (!subscription) {
			console.log(
				`[getGymSubscription] Nenhuma subscription encontrada para gymId: ${gymId}`,
			);
			return null;
		}

		console.log(`[getGymSubscription] Subscription encontrada:`, {
			id: subscription.id,
			status: subscription.status,
			plan: subscription.plan,
			billingPeriod: subscription.billingPeriod,
			trialEnd: subscription.trialEnd,
		});

		const now = new Date();
		const trialEndDate = subscription.trialEnd
			? new Date(subscription.trialEnd)
			: null;
		const isTrialActive = trialEndDate ? trialEndDate > now : false;

		// Se a subscription está cancelada mas o trial ainda está ativo, retornar os dados
		// Só retornar null se estiver cancelada E não houver trial ativo
		if (subscription.status === "canceled" && !isTrialActive) {
			console.log(
				`[getGymSubscription] Subscription cancelada e trial expirado, retornando null`,
			);
			return null;
		}

		const activeStudents = await db.gymMembership.count({
			where: {
				gymId,
				status: "active",
			},
		});

		return {
			id: subscription.id,
			plan: subscription.plan,
			status: subscription.status,
			basePrice: subscription.basePrice,
			pricePerStudent: subscription.pricePerStudent,
			currentPeriodStart: subscription.currentPeriodStart,
			currentPeriodEnd: subscription.currentPeriodEnd,
			cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
			canceledAt: subscription.canceledAt,
			trialStart: subscription.trialStart,
			trialEnd: subscription.trialEnd,
			isTrial: subscription.trialEnd
				? new Date() < subscription.trialEnd
				: false,
			daysRemaining: subscription.trialEnd
				? Math.max(
						0,
						Math.ceil(
							(subscription.trialEnd.getTime() - Date.now()) /
								(1000 * 60 * 60 * 24),
						),
					)
				: null,
			activeStudents,
			billingPeriod:
				(subscription.billingPeriod as "monthly" | "annual" | null) ||
				"monthly", // Default para monthly se não existir
			totalAmount:
				(subscription.billingPeriod || "monthly") === "annual"
					? subscription.basePrice // Plano anual: preço fixo, sem cobrança por aluno
					: subscription.basePrice +
						subscription.pricePerStudent * activeStudents, // Plano mensal: base + por aluno
		};
	} catch (error) {
		console.error("Erro ao buscar assinatura:", error);
		return null;
	}
}

export async function startGymTrial() {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) {
			return { error: "Não autenticado" };
		}

		const session = await getSession(sessionToken);
		if (!session) {
			return { error: "Sessão inválida" };
		}

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		const gymId = user?.activeGymId;
		if (!gymId) {
			return { error: "Academia não encontrada" };
		}

		const existingSubscription = await db.gymSubscription.findUnique({
			where: { gymId },
		});

		if (existingSubscription) {
			const now = new Date();
			const trialEndDate = existingSubscription.trialEnd
				? new Date(existingSubscription.trialEnd)
				: null;
			const isTrialActive = trialEndDate ? trialEndDate > now : false;

			// Se está cancelada e o trial expirou, permitir criar nova
			if (existingSubscription.status === "canceled" && !isTrialActive) {
				// Deletar a subscription cancelada para permitir criar nova
				await db.gymSubscription.delete({
					where: { id: existingSubscription.id },
				});
			} else if (existingSubscription.status === "canceled" && isTrialActive) {
				// Se está cancelada mas trial ainda ativo, reativar
				const trialEnd = new Date(now);
				trialEnd.setDate(trialEnd.getDate() + 14);

				const updatedSubscription = await db.gymSubscription.update({
					where: { id: existingSubscription.id },
					data: {
						status: "trialing",
						canceledAt: null,
						cancelAtPeriodEnd: false,
						trialStart: now,
						trialEnd: trialEnd,
						currentPeriodStart: now,
						currentPeriodEnd: trialEnd,
					},
				});

				return { success: true, subscription: updatedSubscription };
			} else {
				// Se já existe e está ativa, retornar erro
				return { error: "Assinatura já existe" };
			}
		}

		const _activeStudents = await db.gymMembership.count({
			where: {
				gymId,
				status: "active",
			},
		});

		const now = new Date();
		const trialEnd = new Date(now);
		trialEnd.setDate(trialEnd.getDate() + 14);

		const planPrices = {
			basic: { base: 150, perStudent: 1.5 },
			premium: { base: 250, perStudent: 1 },
			enterprise: { base: 400, perStudent: 0.5 },
		};

		const prices = planPrices.basic;

		const subscription = await db.gymSubscription.create({
			data: {
				gymId,
				plan: "basic",
				billingPeriod: "monthly", // Trial sempre é mensal
				status: "trialing",
				basePrice: prices.base,
				pricePerStudent: prices.perStudent,
				currentPeriodStart: now,
				currentPeriodEnd: trialEnd,
				trialStart: now,
				trialEnd: trialEnd,
			},
		});

		return { success: true, subscription };
	} catch (error) {
		console.error("Erro ao iniciar trial:", error);
		return { error: "Erro ao iniciar trial" };
	}
}



