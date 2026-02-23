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
			returnUrl: `${appUrl}/student/payments`,
			completionUrl: `${appUrl}/student/payments`,
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

		// Upsert subscription salvando IDs do Abacate Pay
		await db.subscription.upsert({
			where: { studentId },
			create: {
				studentId,
				plan: "free",
				status: "pending_payment",
				currentPeriodStart: new Date(),
				currentPeriodEnd: new Date(),
				abacatePayBillingId: abacatePayData.id,
				abacatePayCustomerId: abacatePayData.customer?.id,
			},
			update: {
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
