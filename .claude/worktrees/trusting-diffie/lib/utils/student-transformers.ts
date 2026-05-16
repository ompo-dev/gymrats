/**
 * Transformadores de dados para Student
 *
 * Estas funções transformam dados do formato do banco de dados
 * para o formato do store e vice-versa.
 */

import type {
	DailyNutrition,
	PersonalRecord,
	Unit,
	UserProgress,
	WorkoutHistory,
} from "@/lib/types";
import type { StudentData } from "@/lib/types/student-unified";

// ============================================
// TRANSFORMAR DADOS DA API PARA STORE
// ============================================

/**
 * Transforma dados da API para formato do store
 */
export function transformStudentData(apiData: any): Partial<StudentData> {
	const transformed: Partial<StudentData> = {};

	// Transformar user
	if (apiData.user) {
		transformed.user = {
			id: apiData.user.id || "",
			name: apiData.user.name || "",
			email: apiData.user.email || "",
			username: apiData.user.username || generateUsername(apiData.user.email),
			memberSince:
				apiData.user.memberSince || formatMemberSince(apiData.user.createdAt),
			avatar: apiData.user.avatar || apiData.user.image,
			role: apiData.user.role || "STUDENT",
			isAdmin: apiData.user.role === "ADMIN" || apiData.user.isAdmin || false,
		};
	}

	// Transformar student
	if (apiData.student) {
		transformed.student = {
			id: apiData.student.id || "",
			age: apiData.student.age,
			gender: apiData.student.gender,
			phone: apiData.student.phone,
			avatar: apiData.student.avatar,
			// Informações sobre identidade de gênero e terapia hormonal
			isTrans: apiData.student.isTrans ?? false,
			usesHormones: apiData.student.usesHormones ?? false,
			hormoneType: apiData.student.hormoneType || undefined,
		};
	}

	// Transformar progress
	if (apiData.progress) {
		transformed.progress = transformProgress(apiData.progress);
	}

	// Transformar profile
	if (apiData.profile) {
		transformed.profile = transformProfile(apiData.profile);
	}

	// Transformar weightHistory
	if (apiData.weightHistory) {
		transformed.weightHistory = apiData.weightHistory.map((wh: any) => ({
			date: wh.date ? new Date(wh.date) : new Date(),
			weight: wh.weight,
			notes: wh.notes,
		}));
	}

	// Transformar units
	if (apiData.units) {
		transformed.units = apiData.units.map((unit: any) => transformUnit(unit));
	}

	// Transformar workoutHistory
	if (apiData.workoutHistory) {
		transformed.workoutHistory = apiData.workoutHistory.map((wh: any) =>
			transformWorkoutHistory(wh),
		);
	}

	// Transformar personalRecords
	if (apiData.personalRecords) {
		transformed.personalRecords = apiData.personalRecords.map((pr: any) =>
			transformPersonalRecord(pr),
		);
	}

	// Transformar dailyNutrition
	if (apiData.dailyNutrition) {
		transformed.dailyNutrition = transformDailyNutrition(
			apiData.dailyNutrition,
		);
	}

	// Transformar subscription
	if (apiData.subscription !== undefined) {
		transformed.subscription = apiData.subscription
			? transformSubscription(apiData.subscription)
			: null;
	}

	// Arrays simples (já estão no formato correto)
	if (apiData.memberships) {
		transformed.memberships = apiData.memberships;
	}
	if (apiData.payments) {
		transformed.payments = apiData.payments;
	}
	if (apiData.paymentMethods) {
		transformed.paymentMethods = apiData.paymentMethods;
	}
	if (apiData.dayPasses) {
		transformed.dayPasses = apiData.dayPasses;
	}
	if (apiData.gymLocations) {
		transformed.gymLocations = apiData.gymLocations;
	}
	if (apiData.friends) {
		transformed.friends = apiData.friends;
	}
	if (apiData.foodDatabase) {
		transformed.foodDatabase = apiData.foodDatabase;
	}

	// Transformar activeWorkout
	if (apiData.activeWorkout) {
		transformed.activeWorkout = transformActiveWorkout(apiData.activeWorkout);
	}

	return transformed;
}

// ============================================
// TRANSFORMADORES ESPECÍFICOS
// ============================================

function transformProgress(progress: any): UserProgress {
	return {
		currentStreak: progress.currentStreak || 0,
		longestStreak: progress.longestStreak || 0,
		totalXP: progress.totalXP || 0,
		currentLevel: progress.currentLevel || 1,
		xpToNextLevel: progress.xpToNextLevel || 100,
		workoutsCompleted: progress.workoutsCompleted || 0,
		todayXP: progress.todayXP || 0,
		achievements: progress.achievements || [],
		lastActivityDate: progress.lastActivityDate || new Date().toISOString(),
		dailyGoalXP: progress.dailyGoalXP || 50,
		weeklyXP: progress.weeklyXP || [0, 0, 0, 0, 0, 0, 0],
	};
}

function transformProfile(profile: any): StudentData["profile"] {
	return {
		height: profile.height,
		weight: profile.weight,
		fitnessLevel: profile.fitnessLevel,
		weeklyWorkoutFrequency: profile.weeklyWorkoutFrequency,
		workoutDuration: profile.workoutDuration,
		goals: Array.isArray(profile.goals)
			? profile.goals
			: profile.goals
				? JSON.parse(profile.goals)
				: [],
		injuries: Array.isArray(profile.injuries)
			? profile.injuries
			: profile.injuries
				? JSON.parse(profile.injuries)
				: [],
		availableEquipment: Array.isArray(profile.availableEquipment)
			? profile.availableEquipment
			: profile.availableEquipment
				? JSON.parse(profile.availableEquipment)
				: [],
		gymType: profile.gymType,
		preferredWorkoutTime: profile.preferredWorkoutTime,
		preferredSets: profile.preferredSets,
		preferredRepRange: profile.preferredRepRange,
		restTime: profile.restTime,
		dietType: profile.dietType,
		allergies: Array.isArray(profile.allergies)
			? profile.allergies
			: profile.allergies
				? JSON.parse(profile.allergies)
				: [],
		targetCalories: profile.targetCalories,
		targetProtein: profile.targetProtein,
		targetCarbs: profile.targetCarbs,
		targetFats: profile.targetFats,
		mealsPerDay: profile.mealsPerDay,
		hasWeightLossGoal: profile.hasWeightLossGoal || false,
		// Horas disponíveis por dia para treino
		dailyAvailableHours: profile.dailyAvailableHours
			? parseFloat(String(profile.dailyAvailableHours))
			: undefined,
		// Valores metabólicos calculados
		bmr: profile.bmr ? parseFloat(String(profile.bmr)) : undefined,
		tdee: profile.tdee ? parseFloat(String(profile.tdee)) : undefined,
		// Nível de atividade física (1-10)
		activityLevel: profile.activityLevel
			? parseInt(String(profile.activityLevel), 10)
			: undefined,
		// Tempo de tratamento hormonal (meses)
		hormoneTreatmentDuration: profile.hormoneTreatmentDuration
			? parseInt(String(profile.hormoneTreatmentDuration), 10)
			: undefined,
		// Limitações separadas
		physicalLimitations: Array.isArray(profile.physicalLimitations)
			? profile.physicalLimitations
			: profile.physicalLimitations
				? JSON.parse(profile.physicalLimitations)
				: [],
		motorLimitations: Array.isArray(profile.motorLimitations)
			? profile.motorLimitations
			: profile.motorLimitations
				? JSON.parse(profile.motorLimitations)
				: [],
		medicalConditions: Array.isArray(profile.medicalConditions)
			? profile.medicalConditions
			: profile.medicalConditions
				? JSON.parse(profile.medicalConditions)
				: [],
		limitationDetails: profile.limitationDetails
			? typeof profile.limitationDetails === "string"
				? JSON.parse(profile.limitationDetails)
				: profile.limitationDetails
			: undefined,
	};
}

function transformUnit(unit: any): Unit {
	return {
		id: unit.id,
		title: unit.title,
		description: unit.description || "",
		workouts: (unit.workouts || []).map((workout: any) => ({
			...workout,
			exercises: (workout.exercises || []).map((exercise: any) => ({
				...exercise,
				// Parse campos JSON do educational database
				primaryMuscles: exercise.primaryMuscles
					? typeof exercise.primaryMuscles === "string"
						? JSON.parse(exercise.primaryMuscles)
						: exercise.primaryMuscles
					: undefined,
				secondaryMuscles: exercise.secondaryMuscles
					? typeof exercise.secondaryMuscles === "string"
						? JSON.parse(exercise.secondaryMuscles)
						: exercise.secondaryMuscles
					: undefined,
				equipment: exercise.equipment
					? typeof exercise.equipment === "string"
						? JSON.parse(exercise.equipment)
						: exercise.equipment
					: undefined,
				instructions: exercise.instructions
					? typeof exercise.instructions === "string"
						? JSON.parse(exercise.instructions)
						: exercise.instructions
					: undefined,
				tips: exercise.tips
					? typeof exercise.tips === "string"
						? JSON.parse(exercise.tips)
						: exercise.tips
					: undefined,
				commonMistakes: exercise.commonMistakes
					? typeof exercise.commonMistakes === "string"
						? JSON.parse(exercise.commonMistakes)
						: exercise.commonMistakes
					: undefined,
				benefits: exercise.benefits
					? typeof exercise.benefits === "string"
						? JSON.parse(exercise.benefits)
						: exercise.benefits
					: undefined,
				// Campos de data
				createdAt: exercise.createdAt
					? new Date(exercise.createdAt)
					: undefined,
				updatedAt: exercise.updatedAt
					? new Date(exercise.updatedAt)
					: undefined,
			})),
		})),
		color: unit.color || "#58CC02",
		icon: unit.icon || "💪",
	};
}

function transformWorkoutHistory(wh: any): WorkoutHistory {
	return {
		date: wh.date ? new Date(wh.date) : new Date(),
		workoutId: wh.workoutId,
		workoutName: wh.workoutName,
		duration: wh.duration,
		totalVolume: wh.totalVolume || 0,
		exercises: wh.exercises || [],
		overallFeedback: wh.overallFeedback,
		bodyPartsFatigued: wh.bodyPartsFatigued || [],
	};
}

function transformPersonalRecord(pr: any): PersonalRecord {
	return {
		exerciseId: pr.exerciseId,
		exerciseName: pr.exerciseName,
		type: pr.type,
		value: pr.value,
		date: pr.date ? new Date(pr.date) : new Date(),
		previousBest: pr.previousBest,
	};
}

function transformDailyNutrition(nutrition: any): DailyNutrition {
	return {
		date: nutrition.date || new Date().toISOString().split("T")[0],
		meals: nutrition.meals || [],
		totalCalories: nutrition.totalCalories || 0,
		totalProtein: nutrition.totalProtein || 0,
		totalCarbs: nutrition.totalCarbs || 0,
		totalFats: nutrition.totalFats || 0,
		waterIntake: nutrition.waterIntake || 0,
		targetCalories: nutrition.targetCalories || 2000,
		targetProtein: nutrition.targetProtein || 150,
		targetCarbs: nutrition.targetCarbs || 250,
		targetFats: nutrition.targetFats || 65,
		targetWater: nutrition.targetWater || 2000,
	};
}

function transformSubscription(subscription: any): StudentData["subscription"] {
	return {
		id: subscription.id,
		plan: subscription.plan || "free",
		status: subscription.status || "active",
		currentPeriodStart: subscription.currentPeriodStart
			? new Date(subscription.currentPeriodStart)
			: new Date(),
		currentPeriodEnd: subscription.currentPeriodEnd
			? new Date(subscription.currentPeriodEnd)
			: new Date(),
		cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
		canceledAt: subscription.canceledAt
			? new Date(subscription.canceledAt)
			: null,
		trialStart: subscription.trialStart
			? new Date(subscription.trialStart)
			: null,
		trialEnd: subscription.trialEnd ? new Date(subscription.trialEnd) : null,
		isTrial: subscription.isTrial || false,
		daysRemaining: subscription.daysRemaining ?? null,
		billingPeriod: subscription.billingPeriod || "monthly",
	};
}

function transformActiveWorkout(workout: any): StudentData["activeWorkout"] {
	return {
		workoutId: workout.workoutId,
		currentExerciseIndex: workout.currentExerciseIndex || 0,
		exerciseLogs: workout.exerciseLogs || [],
		skippedExercises: workout.skippedExercises || [],
		selectedAlternatives: workout.selectedAlternatives || {},
		xpEarned: workout.xpEarned || 0,
		totalVolume: workout.totalVolume || 0,
		completionPercentage: workout.completionPercentage || 0,
		startTime: workout.startTime ? new Date(workout.startTime) : new Date(),
		lastUpdated: workout.lastUpdated
			? new Date(workout.lastUpdated)
			: new Date(),
		cardioPreference: workout.cardioPreference,
		cardioDuration: workout.cardioDuration,
		selectedCardioType: workout.selectedCardioType,
	};
}

// ============================================
// HELPERS
// ============================================

function generateUsername(email: string): string {
	if (!email) return "@usuario";
	const username = email.split("@")[0].toLowerCase();
	return `@${username}`;
}

function formatMemberSince(date: Date | string | null | undefined): string {
	if (!date) return "Jan 2025";
	const d = typeof date === "string" ? new Date(date) : date;

	// Mapeamento de meses em português
	const months = [
		"Jan",
		"Fev",
		"Mar",
		"Abr",
		"Mai",
		"Jun",
		"Jul",
		"Ago",
		"Set",
		"Out",
		"Nov",
		"Dez",
	];

	const month = months[d.getMonth()];
	const year = d.getFullYear();

	return `${month} ${year}`;
}

// ============================================
// TRANSFORMAR DADOS DO STORE PARA API
// ============================================

/**
 * Transforma dados do store para formato da API (quando necessário)
 */
export function transformToAPI(data: Partial<StudentData>): any {
	// Por enquanto, retorna como está
	// Pode ser expandido se necessário transformar antes de enviar
	return data;
}
