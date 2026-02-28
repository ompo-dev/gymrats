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

export async function getGymCoupons(): Promise<import("@/lib/types").Coupon[]> {
	try {
		const { abacatePay } = await import("@/lib/api/abacatepay");
		const res = await abacatePay.listCoupons();
		if (res.error || !res.data) return [];
		return res.data.map((c) => ({
			id: c.id,
			code: c.id,
			type: c.discountKind === "PERCENTAGE" ? "percentage" : "fixed",
			value: c.discount,
			maxUses: c.maxRedeems === -1 ? 999999 : c.maxRedeems,
			currentUses: c.redeemsCount ?? 0,
			expiryDate: new Date(c.updatedAt),
			isActive: c.status === "ACTIVE",
		}));
	} catch (error) {
		console.error("[getGymCoupons] Erro:", error);
		return [];
	}
}

export async function createGymCoupon(data: {
	code: string;
	notes: string;
	discountKind: "PERCENTAGE" | "FIXED";
	discount: number;
	maxRedeems?: number;
}): Promise<{ success: true } | { success: false; error: string }> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return { success: false, error: "Não autenticado" };
		const { abacatePay } = await import("@/lib/api/abacatepay");
		const res = await abacatePay.createCoupon({
			code: data.code.trim().toUpperCase(),
			notes: data.notes || data.code,
			discountKind: data.discountKind,
			discount: data.discount,
			maxRedeems: data.maxRedeems ?? -1,
		});
		if (res.error || !res.data) return { success: false, error: res.error ?? "Falha ao criar cupom" };
		return { success: true };
	} catch (error) {
		console.error("[createGymCoupon] Erro:", error);
		return { success: false, error: error instanceof Error ? error.message : "Erro ao criar cupom" };
	}
}

export async function getGymReferrals() {
	return [];
}

export async function getGymBalanceWithdraws(): Promise<{
	balanceReais: number;
	balanceCents: number;
	withdraws: { id: string; amount: number; pixKey: string; pixKeyType: string; externalId: string; status: string; createdAt: Date; completedAt: Date | null }[];
}> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return { balanceReais: 0, balanceCents: 0, withdraws: [] };
		return GymFinancialService.getBalanceAndWithdraws(ctx.gymId);
	} catch (error) {
		console.error("[getGymBalanceWithdraws] Erro:", error);
		return { balanceReais: 0, balanceCents: 0, withdraws: [] };
	}
}

/** Cria saque. Use fake: true em dev (AbacatePay dev mode) para não chamar a API real. */
export async function createGymWithdraw(data: {
	amountCents: number;
	fake?: boolean;
}): Promise<{ success: true; withdraw: { id: string; amount: number; status: string } } | { success: false; error: string }> {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return { success: false, error: "Não autenticado" };
		const result = await GymFinancialService.createWithdraw(ctx.gymId, {
			amountCents: data.amountCents,
			fake: data.fake ?? true,
		});
		if (!result.ok) return { success: false, error: result.error };
		return { success: true, withdraw: result.withdraw };
	} catch (error) {
		console.error("[createGymWithdraw] Erro:", error);
		return { success: false, error: error instanceof Error ? error.message : "Erro ao criar saque" };
	}
}

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
