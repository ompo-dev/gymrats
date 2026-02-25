import { z } from "zod";

/**
 * Schemas de validação para rotas de subscriptions
 */

export const createSubscriptionSchema = z.object({
	plan: z.enum(["monthly", "annual"], {
		errorMap: () => ({ message: "Plano deve ser monthly ou annual" }),
	}),
});

export const createGymSubscriptionSchema = z.object({
	plan: z.enum(["basic", "premium", "enterprise"]).optional().default("basic"),
	billingPeriod: z.enum(["monthly", "annual"]).optional().default("monthly"),
});

export const startTrialSchema = z.any();
