"use server";

import { db } from "@/lib/db";
import { getGymContext } from "@/lib/utils/gym/gym-context";
import { GymMemberService } from "@/lib/services/gym/gym-member.service";
import { GymFinancialService } from "@/lib/services/gym/gym-financial.service";
import { GymInventoryService } from "@/lib/services/gym/gym-inventory.service";
import type {
	CheckIn,
	Equipment,
	Expense,
	FinancialSummary,
	GymProfile,
	GymStats,
	Payment,
	StudentData,
} from "@/lib/types";

// ============================================
// INFORMAÇÕES DO USUÁRIO
// ============================================

export async function getCurrentUserInfo() {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return { isAdmin: false, role: null };

		return {
			isAdmin: ctx.user.role === "ADMIN",
			role: ctx.user.role ?? null,
		};
	} catch (error) {
		console.error("[getCurrentUserInfo] Erro:", error);
		return { isAdmin: false, role: null };
	}
}

// ============================================
// PERFIL E INVENTÁRIO (GymInventoryService)
// ============================================

export async function getGymProfile(): Promise<GymProfile | null> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return null;
		return GymInventoryService.getProfile(ctx.gymId);
	} catch (error) {
		console.error("[getGymProfile] Erro:", error);
		return null;
	}
}

export async function getGymEquipment(): Promise<Equipment[]> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return [];
		return GymInventoryService.getEquipment(ctx.gymId);
	} catch (error) {
		console.error("[getGymEquipment] Erro:", error);
		return [];
	}
}

export async function getGymEquipmentById(equipmentId: string): Promise<Equipment | null> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return null;
		return GymInventoryService.getEquipmentById(ctx.gymId, equipmentId);
	} catch (error) {
		console.error("[getGymEquipmentById] Erro:", error);
		return null;
	}
}

export async function getGymMembershipPlans() {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return [];
		return GymInventoryService.getMembershipPlans(ctx.gymId);
	} catch (error) {
		console.error("[getGymMembershipPlans] Erro:", error);
		return [];
	}
}

// ============================================
// MEMBROS E ALUNOS (GymMemberService)
// ============================================

export async function getGymStudents(): Promise<StudentData[]> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return [];
		return (await GymMemberService.getStudents(ctx.gymId)) as StudentData[];
	} catch (error) {
		console.error("[getGymStudents] Erro:", error);
		return [];
	}
}

export async function getGymRecentCheckIns(): Promise<CheckIn[]> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return [];
		const checkIns = await GymMemberService.getRecentCheckIns(ctx.gymId);
		return checkIns.map((c) => ({ ...c, checkOut: c.checkOut ?? undefined })) as CheckIn[];
	} catch (error) {
		console.error("[getGymRecentCheckIns] Erro:", error);
		return [];
	}
}

export async function getGymStudentById(studentId: string): Promise<StudentData | null> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return null;
		return (await GymMemberService.getStudentById(ctx.gymId, studentId)) as StudentData | null;
	} catch (error) {
		console.error("[getGymStudentById] Erro:", error);
		return null;
	}
}

// ============================================
// FINANCEIRO (GymFinancialService)
// ============================================

export async function getGymFinancialSummary(): Promise<FinancialSummary | null> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return null;
		return GymFinancialService.getFinancialSummary(ctx.gymId);
	} catch (error) {
		console.error("[getGymFinancialSummary] Erro:", error);
		return null;
	}
}

export async function getGymStudentPayments(studentId: string): Promise<Payment[]> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return [];
		return GymFinancialService.getPayments(ctx.gymId, studentId);
	} catch (error) {
		console.error("[getGymStudentPayments] Erro:", error);
		return [];
	}
}

export async function getGymPayments(): Promise<Payment[]> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return [];
		return GymFinancialService.getPayments(ctx.gymId);
	} catch (error) {
		console.error("[getGymPayments] Erro:", error);
		return [];
	}
}

export async function getGymExpenses(): Promise<Expense[]> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return [];
		return GymFinancialService.getExpenses(ctx.gymId);
	} catch (error) {
		console.error("[getGymExpenses] Erro:", error);
		return [];
	}
}

// ============================================
// ESTATÍSTICAS E OUTROS
// ============================================

export async function getGymStats(): Promise<GymStats | null> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return null;
		return GymInventoryService.getStats(ctx.gymId);
	} catch (error) {
		console.error("[getGymStats] Erro:", error);
		return null;
	}
}

export async function getGymCoupons() { return []; }
export async function getGymReferrals() { return []; }

// TODO: Mover lógica complexa abaixo para serviços correspondentes conforme necessário
export async function getGymSubscription() {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return null;

		const gymId = ctx.gymId;
		const subscription = await db.gymSubscription.findUnique({ where: { gymId } });
		if (!subscription || (subscription.status === "canceled" && (!subscription.trialEnd || new Date() > subscription.trialEnd))) return null;

		const activeStudents = await db.gymMembership.count({ where: { gymId, status: "active" } });

		return {
			...subscription,
			isTrial: subscription.trialEnd ? new Date() < subscription.trialEnd : false,
			daysRemaining: subscription.trialEnd ? Math.max(0, Math.ceil((subscription.trialEnd.getTime() - Date.now()) / (1000 * 3600 * 24))) : null,
			activeStudents,
			totalAmount: (subscription.billingPeriod === "annual") ? subscription.basePrice : subscription.basePrice + (subscription.pricePerStudent * activeStudents),
		};
	} catch (error) {
		console.error("[getGymSubscription] Erro:", error);
		return null;
	}
}

export async function startGymTrial() {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return { error: "Não autenticado" };

		const gymId = ctx.gymId;
		const existingSubscription = await db.gymSubscription.findUnique({ where: { gymId } });

		if (existingSubscription) {
			if (existingSubscription.status === "canceled") {
				await db.gymSubscription.delete({ where: { id: existingSubscription.id } });
			} else {
				return { error: "Assinatura já existe" };
			}
		}

		const now = new Date();
		const trialEnd = new Date(now);
		trialEnd.setDate(trialEnd.getDate() + 14);

		const subscription = await db.gymSubscription.create({
			data: {
				gymId,
				plan: "basic",
				billingPeriod: "monthly",
				status: "trialing",
				basePrice: 150,
				pricePerStudent: 1.5,
				currentPeriodStart: now,
				currentPeriodEnd: trialEnd,
				trialStart: now,
				trialEnd: trialEnd,
			},
		});

		return { success: true, subscription };
	} catch (error) {
		console.error("[startGymTrial] Erro:", error);
		return { error: "Erro ao iniciar trial" };
	}
}
