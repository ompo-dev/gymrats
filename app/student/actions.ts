"use server";

import { db } from "@/lib/db";
import { getStudentContext } from "@/lib/utils/student/student-context";
import { getStudentSubscriptionSource } from "@/lib/utils/subscription";
import { StudentProgressService } from "@/lib/services/student/student-progress.service";
import { StudentWorkoutService } from "@/lib/services/student/student-workout.service";
import { StudentProfileService } from "@/lib/services/student/student-profile.service";

// ============================================
// INFORMAÇÕES DO USUÁRIO
// ============================================

export async function getCurrentUserInfo() {
	try {
		const { ctx, error } = await getStudentContext();
		if (error || !ctx) return { isAdmin: false, role: null };

		return {
			isAdmin: ctx.user.role === "ADMIN",
			role: ctx.user.role,
		};
	} catch (error) {
		console.error("[getCurrentUserInfo] Erro:", error);
		return { isAdmin: false, role: null };
	}
}

// ============================================
// PROCESSO E PROGRESSO
// ============================================

export async function getStudentProfile() {
	try {
		const { ctx, error } = await getStudentContext();
		if (error || !ctx) return { hasProfile: false, profile: null };

		const profile = await StudentProfileService.getProfile(ctx.studentId);
		return {
			hasProfile: !!profile,
			profile,
		};
	} catch (error) {
		console.error("[getStudentProfile] Erro:", error);
		return { hasProfile: false, profile: null };
	}
}

export async function getStudentProgress() {
	try {
		const { ctx, error } = await getStudentContext();
		if (error || !ctx) return getNeutralProgress();

		return StudentProgressService.getProgress(ctx.studentId);
	} catch (error) {
		console.error("[getStudentProgress] Erro:", error);
		return getNeutralProgress();
	}
}

function getNeutralProgress() {
	return {
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
	};
}

// ============================================
// TREINOS (StudentWorkoutService)
// ============================================

export async function getStudentUnits() {
	try {
		const { ctx, error } = await getStudentContext();
		if (error || !ctx) return [];

		return StudentWorkoutService.getUnitsWithWorkouts(ctx.studentId);
	} catch (error) {
		console.error("[getStudentUnits] Erro:", error);
		return [];
	}
}

// ============================================
// ACADEMIAS E ASSINATURAS
// ============================================

export async function getGymLocations() {
	try {
		const gyms = await db.gym.findMany({
			where: { isActive: true, isPartner: true },
			include: { plans: { where: { isActive: true } } },
			orderBy: { rating: "desc" },
		});

		return gyms.map((gym) => {
			const amenities = gym.amenities ? JSON.parse(gym.amenities) : [];
			const openingHours = gym.openingHours ? JSON.parse(gym.openingHours) : null;
			const photos = gym.photos ? JSON.parse(gym.photos) : [];

			return {
				id: gym.id,
				name: gym.name,
				logo: gym.logo || undefined,
				address: gym.address,
				coordinates: { lat: gym.latitude || 0, lng: gym.longitude || 0 },
				rating: gym.rating || 0,
				totalReviews: gym.totalReviews || 0,
				plans: {
					daily: gym.plans.find(p => p.type === "daily")?.price ?? 0,
					weekly: gym.plans.find(p => p.type === "weekly")?.price ?? 0,
					monthly: gym.plans.find(p => p.type === "monthly")?.price ?? 0,
				},
				amenities,
				openNow: true, // Simplificado
				openingHours,
				photos: photos.length > 0 ? photos : undefined,
				isPartner: gym.isPartner,
			};
		});
	} catch (error) {
		console.error("[getGymLocations] Erro:", error);
		return [];
	}
}

export async function getStudentSubscription() {
	try {
		const { ctx, error } = await getStudentContext();
		if (error || !ctx) return null;

		const subInfo = await getStudentSubscriptionSource(ctx.studentId);
		if (subInfo.source === null) {
			return null;
		}

		const sub = await db.subscription.findUnique({ where: { studentId: ctx.studentId } });
		const now = new Date();
		const trialEnd = sub?.trialEnd ? new Date(sub.trialEnd) : null;
		const isTrialActive = trialEnd ? trialEnd > now : false;

		let enterpriseGymName: string | undefined;
		if (subInfo.source === "GYM_ENTERPRISE" && subInfo.gymId) {
			const gym = await db.gym.findUnique({ where: { id: subInfo.gymId } });
			enterpriseGymName = gym?.name;
		}

		const isVirtualEnterprise = !sub && subInfo.source === "GYM_ENTERPRISE";
		const virtualPeriodEnd = new Date(now);
		virtualPeriodEnd.setFullYear(virtualPeriodEnd.getFullYear() + 1);

		return {
			id: sub?.id ?? (isVirtualEnterprise ? "virtual-gym-enterprise" : undefined),
			...subInfo,
			abacatePayBillingId: sub?.abacatePayBillingId,
			currentPeriodEnd:
				sub?.currentPeriodEnd ?? (isVirtualEnterprise ? virtualPeriodEnd : undefined),
			currentPeriodStart: sub?.currentPeriodStart ?? (isVirtualEnterprise ? now : undefined),
			cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
			isTrial: isTrialActive,
			daysRemaining: trialEnd
				? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 3600 * 24)))
				: null,
			enterpriseGymName,
		};
	} catch (error) {
		console.error("[getStudentSubscription] Erro:", error);
		return null;
	}
}

export async function startStudentTrial() {
	try {
		const { ctx, error } = await getStudentContext();
		if (error || !ctx) return { error: "Não autenticado" };

		const existing = await db.subscription.findUnique({ where: { studentId: ctx.studentId } });
		if (existing) {
			if (existing.status === "canceled") {
				await db.subscription.delete({ where: { id: existing.id } });
			} else {
				return { error: "Assinatura já existe" };
			}
		}

		const now = new Date();
		const trialEnd = new Date(now);
		trialEnd.setDate(trialEnd.getDate() + 14);

		const subscription = await db.subscription.create({
			data: {
				studentId: ctx.studentId,
				plan: "premium",
				status: "trialing",
				currentPeriodStart: now,
				currentPeriodEnd: trialEnd,
				trialStart: now,
				trialEnd: trialEnd,
			},
		});

		return { success: true, subscription };
	} catch (error) {
		console.error("[startStudentTrial] Erro:", error);
		return { error: "Erro ao iniciar trial" };
	}
}
