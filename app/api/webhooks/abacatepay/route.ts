import type { NextRequest } from "next/server";
import {
	internalErrorResponse,
	successResponse,
	badRequestResponse,
} from "@/lib/api/utils/response.utils";
import { db } from "@/lib/db";

import { abacatePay } from "@/lib/api/abacatepay";

export async function POST(request: NextRequest) {
	try {
		// 1. Validar Assinatura HMAC (Mais Seguro)
		const signature = request.headers.get("x-webhook-signature");
		const rawBody = await request.text();
		
		const isSignatureValid = abacatePay.verifyWebhookSignature(rawBody, signature || "");
		
		// 2. Validar Secret via Query Param (Conforme exemplo inicial do user)
		const { searchParams } = new URL(request.url);
		const webhookSecret = searchParams.get("webhookSecret");
		const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET || "1234";
		const isSecretValid = webhookSecret === expectedSecret;

		// Se nenhum dos dois for válido, rejeitar
		if (!isSignatureValid && !isSecretValid) {
			console.warn("[Webhook] Falha na verificação de segurança. Signature:", !!signature, "Secret:", !!webhookSecret);
			return badRequestResponse("Invalid webhook security check");
		}

		const body = JSON.parse(rawBody);
		const { event, data } = body;

		console.log(`[Webhook] Evento recebido: ${event}`, JSON.stringify(data, null, 2));

		if (event === "billing.paid") {
			const billing = data.billing;
			const billingId = billing.id;
			const amount = billing.amount; // centavos
			const metadata = billing.metadata || {};
			
			// Tentar encontrar a subscription pelo billingId ou pelos metadados
			let subscription = await db.subscription.findUnique({
				where: { abacatePayBillingId: billingId },
				include: { student: true },
			});

			if (!subscription && metadata.studentId) {
				subscription = await db.subscription.findUnique({
					where: { studentId: metadata.studentId },
					include: { student: true },
				});
			}

			if (!subscription) {
				console.error(`[Webhook] Subscription não encontrada para billingId: ${billingId} ou studentId: ${metadata.studentId}`);
				return successResponse({ processed: false, error: "Subscription not found" });
			}

			// Calcular novos períodos
			const now = new Date();
			const periodEnd = new Date(now);
			
			// Usar metadados se disponíveis, senão adivinhar pelo valor
			const isAnnual = metadata.billingPeriod === "annual" || amount >= 15000;
			
			if (isAnnual) {
				periodEnd.setFullYear(periodEnd.getFullYear() + 1);
			} else {
				periodEnd.setMonth(periodEnd.getMonth() + 1);
			}

			// Atualizar Subscription
			await db.subscription.update({
				where: { id: subscription.id },
				data: {
					plan: `Premium ${isAnnual ? "Anual" : "Mensal"}`,
					status: "active",
					currentPeriodStart: now,
					currentPeriodEnd: periodEnd,
					abacatePayBillingId: billingId, // Garantir que está salvo
					abacatePayCustomerId: billing.customer?.id || subscription.abacatePayCustomerId,
				},
			});

			// Registrar o pagamento
			await db.subscriptionPayment.create({
				data: {
					subscriptionId: subscription.id,
					amount: amount / 100, // converter centavos para reais
					status: "succeeded",
					paymentMethod: billing.payment?.method || "pix",
					abacatePayBillingId: billingId,
					paidAt: now,
				},
			});

			console.log(`[Webhook] Assinatura do aluno ${subscription.studentId} atualizada para PREMIUM.`);
		}

		return successResponse({ received: true });
	} catch (error: unknown) {
		console.error("[Webhook] Erro ao processar webhook:", error);
		return internalErrorResponse("Error processing webhook", error);
	}
}
