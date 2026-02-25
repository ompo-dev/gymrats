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
			// Payload pode vir de billing (checkout) ou pixQrCode (PIX inline)
			const pixQrCode = data.pixQrCode;
			const billing = data.billing;
			const paymentId = pixQrCode?.id ?? billing?.id;
			const amount = data.payment?.amount ?? billing?.amount ?? pixQrCode?.amount ?? 0;
			const metadata = billing?.metadata ?? pixQrCode?.metadata ?? {};

			if (!paymentId) {
				console.error("[Webhook] billing.paid sem id em billing ou pixQrCode");
				return successResponse({ processed: false, error: "Missing payment id" });
			}

			// 1. Tentar GymSubscription (abacatePayBillingId armazena billing id ou pix id)
			const gymSub = await db.gymSubscription.findFirst({
				where: { abacatePayBillingId: paymentId },
			});

			if (gymSub) {
				const now = new Date();
				const periodEnd = new Date(now);
				const isAnnual = gymSub.billingPeriod === "annual";
				if (isAnnual) {
					periodEnd.setFullYear(periodEnd.getFullYear() + 1);
				} else {
					periodEnd.setMonth(periodEnd.getMonth() + 1);
				}

				await db.gymSubscription.update({
					where: { id: gymSub.id },
					data: {
						status: "active",
						currentPeriodStart: now,
						currentPeriodEnd: periodEnd,
						cancelAtPeriodEnd: false,
						canceledAt: null,
					},
				});

				console.log(`[Webhook] GymSubscription ${gymSub.id} (gym ${gymSub.gymId}) ativada: ${gymSub.plan} ${gymSub.billingPeriod}`);
				return successResponse({ received: true, type: "gym" });
			}

			// 2. Tentar Subscription (aluno) - apenas billing, não pixQrCode
			let subscription = pixQrCode
				? null
				: await db.subscription.findUnique({
						where: { abacatePayBillingId: paymentId },
						include: { student: true },
					});

			if (!subscription && metadata.studentId) {
				subscription = await db.subscription.findUnique({
					where: { studentId: metadata.studentId },
					include: { student: true },
				});
			}

			if (!subscription) {
				console.error(`[Webhook] Subscription não encontrada para paymentId: ${paymentId} ou studentId: ${metadata.studentId}`);
				return successResponse({ processed: false, error: "Subscription not found" });
			}

			// Calcular novos períodos
			const now = new Date();
			const periodEnd = new Date(now);
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
					cancelAtPeriodEnd: false,
					canceledAt: null,
					abacatePayBillingId: paymentId,
					abacatePayCustomerId: billing?.customer?.id || subscription.abacatePayCustomerId,
				},
			});

			// Registrar o pagamento
			await db.subscriptionPayment.create({
				data: {
					subscriptionId: subscription.id,
					amount: amount / 100,
					status: "succeeded",
					paymentMethod: billing?.payment?.method || "pix",
					abacatePayBillingId: paymentId,
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
