"use server";

import { auth } from "@/lib/auth-config";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { abacatePay } from "@/lib/api/abacatepay";

export async function createAbacateBilling(planId: string, billingPeriod: string) {
	try {
		const sessionResponse = await auth.api.getSession({
			headers: await headers(),
		});

		const user = sessionResponse?.user;
		if (!user) {
			throw new Error("Usuário não autenticado. Por favor, faça login.");
		}

		// Buscar studentId
		const student = await db.student.findUnique({
			where: { userId: user.id },
		});

		if (!student) {
			throw new Error("Perfil de aluno não encontrado.");
		}

		const studentId = student.id;

		// Preços em centavos
		const prices: Record<string, Record<string, number>> = {
			premium: {
				monthly: 1500, // R$ 15,00
				annual: 15000, // R$ 150,00
			},
		};

		const price = prices[planId]?.[billingPeriod];
		if (!price) {
			throw new Error("Plano ou período de cobrança inválido.");
		}

		const planName = planId === "premium" ? "Assinatura Premium" : "Assinatura";
		const periodLabel = billingPeriod === "annual" ? "Anual" : "Mensal";

		const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

		// Buscar subscription existente para ver se já tem customerId do Abacate Pay
		const existingSubscription = await db.subscription.findUnique({
			where: { studentId },
		});

		const customerId = existingSubscription?.abacatePayCustomerId;

		// Criar billing no Abacate Pay
		const billingResponse = await abacatePay.createBilling({
			frequency: "ONE_TIME",
			methods: ["PIX"],
			products: [
				{
					externalId: `${planId}_${billingPeriod}`,
					name: `${planName} - ${periodLabel}`,
					description: `Garantia de acesso ao ${planName} pelo período ${periodLabel.toLowerCase()}.`,
					quantity: 1,
					price: price,
				},
			],
			returnUrl: `${appUrl}/student?tab=payments&subTab=subscription`,
			completionUrl: `${appUrl}/student?tab=payments&subTab=subscription&success=true`,
			customerId: customerId || undefined,
			customer: !customerId ? {
				name: user.name || "",
				email: user.email || "",
				cellphone: student.phone || "",
				taxId: "",
			} : undefined,
			allowCoupons: true,
			metadata: {
				studentId,
				planId,
				billingPeriod,
			},
		});

		if (billingResponse.error || !billingResponse.data) {
			console.error("[Action] Erro Abacate Pay:", billingResponse.error);
			console.error("[Action] Token Presente:", !!process.env.ABACATEPAY_API_TOKEN);
			throw new Error(
				billingResponse.error || "Erro ao processar pagamento com Abacate Pay. Verifique se o token de API está configurado."
			);
		}

		const abacatePayData = billingResponse.data;

		// Calcular datas de período corretas
		const periodStart = new Date();
		const periodEnd = new Date();
		if (billingPeriod === "annual") {
			periodEnd.setFullYear(periodEnd.getFullYear() + 1);
		} else {
			periodEnd.setMonth(periodEnd.getMonth() + 1);
		}

		// Upsert subscription salvando IDs do Abacate Pay
		await db.subscription.upsert({
			where: { studentId },
			create: {
				studentId,
				plan: `Premium ${billingPeriod === "annual" ? "Anual" : "Mensal"}`,
				status: "pending_payment",
				currentPeriodStart: periodStart,
				currentPeriodEnd: periodEnd,
				abacatePayBillingId: abacatePayData.id,
				abacatePayCustomerId: abacatePayData.customer?.id,
			},
			update: {
				plan: `Premium ${billingPeriod === "annual" ? "Anual" : "Mensal"}`,
				status: "pending_payment",
				currentPeriodStart: periodStart,
				currentPeriodEnd: periodEnd,
				cancelAtPeriodEnd: false,
				canceledAt: null,
				abacatePayBillingId: abacatePayData.id,
				abacatePayCustomerId: abacatePayData.customer?.id,
			},
		});

		return { url: abacatePayData.url };
	} catch (error: any) {
		console.error("[Action] Erro inesperado:", error);
		throw error instanceof Error ? error : new Error("Erro inesperado ao criar checkout.");
	}
}

/**
 * Confirma o pagamento no AbacatePay e ativa a assinatura no banco de dados.
 * Deve ser chamada quando o usuário retorna do AbacatePay com ?success=true.
 */
export async function confirmAbacatePayment(): Promise<{
	success: boolean;
	subscription?: {
		plan: string;
		status: string;
		billingPeriod: string;
	};
	error?: string;
}> {
	try {
		const sessionResponse = await auth.api.getSession({
			headers: await headers(),
		});

		const user = sessionResponse?.user;
		if (!user) {
			return { success: false, error: "Usuário não autenticado." };
		}

		const student = await db.student.findUnique({
			where: { userId: user.id },
		});

		if (!student) {
			return { success: false, error: "Perfil de aluno não encontrado." };
		}

		const subscription = await db.subscription.findUnique({
			where: { studentId: student.id },
		});

		if (!subscription) {
			return { success: false, error: "Assinatura não encontrada." };
		}

		// Se já está ativa, não precisa confirmar
		if (subscription.status === "active") {
			const billingPeriod = subscription.plan.toLowerCase().includes("anual")
				? "annual"
				: "monthly";
			return {
				success: true,
				subscription: {
					plan: subscription.plan,
					status: subscription.status,
					billingPeriod,
				},
			};
		}

		// Verificar status do billing no AbacatePay usando listBillings
		// (AbacatePay não possui endpoint /billing/get individual)
		if (!subscription.abacatePayBillingId) {
			return { success: false, error: "ID de billing não encontrado." };
		}

		const listResponse = await abacatePay.listBillings();

		if (listResponse.error || !listResponse.data) {
			console.error(
				"[confirmAbacatePayment] Erro ao listar billings:",
				listResponse.error,
			);
			return {
				success: false,
				error: "Não foi possível verificar o status do pagamento.",
			};
		}

		const billing = listResponse.data.find(
			(b) => b.id === subscription.abacatePayBillingId,
		);

		if (!billing) {
			console.error(
				`[confirmAbacatePayment] Billing ${subscription.abacatePayBillingId} não encontrado na lista`,
			);
			return {
				success: false,
				error: "Cobrança não encontrada no AbacatePay.",
			};
		}

		const billingStatus = billing.status;
		console.log(
			`[confirmAbacatePayment] Billing ${subscription.abacatePayBillingId} status: ${billingStatus}`,
		);

		if (billingStatus === "PAID") {
			// Calcular período correto
			const periodStart = new Date();
			const periodEnd = new Date();
			if (subscription.plan.toLowerCase().includes("anual")) {
				periodEnd.setFullYear(periodEnd.getFullYear() + 1);
			} else {
				periodEnd.setMonth(periodEnd.getMonth() + 1);
			}

			// Ativar a assinatura
			const updated = await db.subscription.update({
				where: { studentId: student.id },
				data: {
					status: "active",
					currentPeriodStart: periodStart,
					currentPeriodEnd: periodEnd,
					cancelAtPeriodEnd: false,
					canceledAt: null,
				},
			});

			const billingPeriod = updated.plan.toLowerCase().includes("anual")
				? "annual"
				: "monthly";

			console.log(
				`[confirmAbacatePayment] Assinatura ativada: ${updated.plan} (${billingPeriod})`,
			);

			return {
				success: true,
				subscription: {
					plan: updated.plan,
					status: updated.status,
					billingPeriod,
				},
			};
		}

		// Billing ainda não foi pago
		return {
			success: false,
			error: `Pagamento ainda não confirmado. Status: ${billingStatus}`,
		};
	} catch (error: unknown) {
		console.error("[confirmAbacatePayment] Erro inesperado:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Erro ao confirmar pagamento.",
		};
	}
}
