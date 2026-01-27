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
  billingPeriod: z.enum(["monthly", "annual"], {
    errorMap: () => ({ message: "billingPeriod deve ser monthly ou annual" }),
  }),
});

export const startTrialSchema = z.any();
