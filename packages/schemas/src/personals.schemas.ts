import { z } from "zod";

export const createPersonalSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  email: z.string().email().max(320),
  phone: z.string().max(32).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(500).trim().optional(),
  address: z.string().max(500).trim().optional(),
  cref: z.string().max(64).trim().optional().or(z.literal("")),
  pixKey: z.string().max(255).trim().optional().or(z.literal("")),
  pixKeyType: z.string().max(32).trim().optional().or(z.literal("")),
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
  gymId: z.string().cuid("gymId deve ser um CUID valido"),
});

export const studentPersonalAssignmentSchema = z.object({
  studentId: z.string().cuid("studentId deve ser um CUID valido"),
  personalId: z.string().cuid("personalId deve ser um CUID valido"),
});

export const personalStudentsSearchQuerySchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Informe ao menos 3 caracteres para buscar")
    .max(320, "Busca muito longa"),
});
