import { z } from "zod";

export const createPersonalSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
  address: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  atendimentoPresencial: z.boolean().optional(),
  atendimentoRemoto: z.boolean().optional(),
});

export const updatePersonalSchema = createPersonalSchema.partial();

export const personalSubscriptionSchema = z.object({
  plan: z.enum(["standard", "pro_ai"]),
  billingPeriod: z.enum(["monthly", "annual"]).default("monthly"),
});

export const personalAffiliationSchema = z.object({
  gymId: z.string().min(1),
});

export const studentPersonalAssignmentSchema = z.object({
  studentId: z.string().min(1),
  personalId: z.string().min(1),
});

export const personalStudentsSearchQuerySchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Informe ao menos 3 caracteres para buscar"),
});
