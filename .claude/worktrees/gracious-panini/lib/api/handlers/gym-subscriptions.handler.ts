/**
 * Handler de Gym Subscriptions
 *
 * Centraliza toda a lógica das rotas relacionadas a subscriptions de gyms
 */

import type { NextRequest, NextResponse } from "next/server";
import { getGymSubscription, startGymTrial } from "@/app/gym/actions";
import { db } from "@/lib/db";
import { createGymSubscriptionBilling } from "@/lib/utils/subscription";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { createGymSubscriptionSchema } from "../schemas";
import {
	badRequestResponse,
	internalErrorResponse,
	notFoundResponse,
	successResponse,
} from "../utils/response.utils";

/**
 * GET /api/gym-subscriptions/current
 * Busca assinatura atual da gym
 */
export async function getCurrentGymSubscriptionHandler(
	_request: NextRequest,
): Promise<NextResponse> {
	try {
		const subscription = await getGymSubscription();

		if (subscription) {
			console.log("[API] Gym Subscription retornada:", {
				id: subscription.id,
				plan: subscription.plan,
				billingPeriod: subscription.billingPeriod,
				status: subscription.status,
			});
		}

		return successResponse({ subscription });
	} catch (error: any) {
		console.error("[getCurrentGymSubscriptionHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar assinatura", error);
	}
}

/**
 * POST /api/gym-subscriptions/create
 * Cria uma nova assinatura para gym
 */
export async function createGymSubscriptionHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireAuth(request);
		if ("error" in auth) {
			return auth.response;
		}

		const userId = auth.userId;

		// Se for ADMIN, garantir que tenha perfil de gym
		let gymId: string | null = null;
		if (auth.user.role === "ADMIN") {
			const existingGym = await db.gym.findUnique({
				where: { userId: userId },
			});

			if (!existingGym) {
				const newGym = await db.gym.create({
					data: {
						userId: userId,
						name: auth.user.name || "",
						address: "",
						phone: "",
						email: auth.user.email || "",
						plan: "basic",
					},
				});
				gymId = newGym.id;
			} else {
				gymId = existingGym.id;
			}
		} else if (auth.user.gyms && auth.user.gyms.length > 0) {
			gymId = auth.user.gyms[0].id;
		}

		if (!gymId) {
			return notFoundResponse("Academia não encontrada");
		}

		// Validar body com Zod
		const validation = await validateBody(request, createGymSubscriptionSchema);
		if (!validation.success) {
			return validation.response;
		}

		const { plan, billingPeriod = "monthly" } = validation.data;

		const activeStudents = await db.gymMembership.count({
			where: {
				gymId,
				status: "active",
			},
		});

		// Verificar se existe subscription
		const existingSubscription = await db.gymSubscription.findUnique({
			where: { gymId },
		});

		const now = new Date();
		const planPrices = {
			basic: { base: 150, perStudent: 1.5 },
			premium: { base: 250, perStudent: 1 },
			enterprise: { base: 400, perStudent: 0.5 },
		};
		const prices = planPrices[plan as keyof typeof planPrices];

		// Calcular período
		const periodEnd = new Date(now);
		if (billingPeriod === "annual") {
			periodEnd.setFullYear(periodEnd.getFullYear() + 1);
		} else {
			periodEnd.setMonth(periodEnd.getMonth() + 1);
		}

		// Se existe subscription, atualizar
		if (existingSubscription) {
			await db.gymSubscription.update({
				where: { id: existingSubscription.id },
				data: {
					plan,
					billingPeriod,
					status: "active",
					basePrice: prices.base,
					pricePerStudent: billingPeriod === "annual" ? 0 : prices.perStudent,
					currentPeriodStart: now,
					currentPeriodEnd: periodEnd,
					trialStart: null,
					trialEnd: null,
					canceledAt: null,
					cancelAtPeriodEnd: false,
				},
			});
		}

		const billing = await createGymSubscriptionBilling(
			gymId,
			plan,
			activeStudents,
			billingPeriod,
		);

		if (!billing || !billing.id) {
			throw new Error(
				"Erro ao criar cobrança: resposta inválida da AbacatePay",
			);
		}

		// Atualizar subscription com billingId
		if (existingSubscription) {
			await db.gymSubscription.update({
				where: { id: existingSubscription.id },
				data: {
					abacatePayBillingId: billing.id,
				},
			});
		}

		return successResponse({
			billingUrl: String(billing.url || ""),
			billingId: String(billing.id || ""),
		});
	} catch (error: any) {
		console.error("[createGymSubscriptionHandler] Erro:", error);
		return internalErrorResponse("Erro ao criar assinatura", error);
	}
}

/**
 * POST /api/gym-subscriptions/start-trial
 * Inicia trial para gym
 */
export async function startGymTrialHandler(
	_request: NextRequest,
): Promise<NextResponse> {
	try {
		const result = await startGymTrial();

		if (result.error) {
			return badRequestResponse(result.error);
		}

		return successResponse({
			subscription: result.subscription,
		});
	} catch (error: any) {
		console.error("[startGymTrialHandler] Erro:", error);
		return internalErrorResponse("Erro ao iniciar trial", error);
	}
}

/**
 * POST /api/gym-subscriptions/cancel
 * Cancela assinatura da gym
 */
export async function cancelGymSubscriptionHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireAuth(request);
		if ("error" in auth) {
			return auth.response;
		}

		const userId = auth.userId;

		// Se for ADMIN, garantir que tenha perfil de gym
		let gymId: string | null = null;
		if (auth.user.role === "ADMIN") {
			const existingGym = await db.gym.findUnique({
				where: { userId: userId },
			});

			if (!existingGym) {
				return notFoundResponse("Academia não encontrada");
			}
			gymId = existingGym.id;
		} else if (auth.user.gyms && auth.user.gyms.length > 0) {
			gymId = auth.user.gyms[0].id;
		}

		if (!gymId) {
			return notFoundResponse("Academia não encontrada");
		}

		const subscription = await db.gymSubscription.findUnique({
			where: { gymId },
		});

		if (!subscription) {
			return notFoundResponse("Assinatura não encontrada");
		}

		await db.gymSubscription.update({
			where: { id: subscription.id },
			data: {
				status: "canceled",
				canceledAt: new Date(),
				cancelAtPeriodEnd: false,
			},
		});

		return successResponse({
			message: "Assinatura cancelada com sucesso",
		});
	} catch (error: any) {
		console.error("[cancelGymSubscriptionHandler] Erro:", error);
		return internalErrorResponse("Erro ao cancelar assinatura", error);
	}
}
