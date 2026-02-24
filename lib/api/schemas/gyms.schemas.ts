import { z } from "zod";

/**
 * Schemas de validação para rotas de gyms
 */

export const createGymSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
	address: z.string().min(1, "Endereço é obrigatório"),
	phone: z.string().min(1, "Telefone é obrigatório"),
	email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
	cnpj: z.string().optional().nullable(),
});

export const setActiveGymSchema = z.object({
	gymId: z.string().min(1, "gymId é obrigatório"),
});

export const gymLocationsQuerySchema = z.object({
	lat: z
		.string()
		.regex(/^-?\d+\.?\d*$/)
		.optional(),
	lng: z
		.string()
		.regex(/^-?\d+\.?\d*$/)
		.optional(),
	isPartner: z
		.string()
		.transform((val) => val === "true")
		.optional(),
});

export const gymMembersQuerySchema = z.object({
  status: z.enum(["active", "suspended", "canceled", "pending", "all"]).optional().default("all"),
  search: z.string().optional(),
});

export const createGymMemberSchema = z.object({
  studentId: z.string().min(1, "studentId é obrigatório"),
  planId: z.string().optional().nullable(),
  amount: z.number().positive("Valor deve ser maior que zero"),
  autoRenew: z.boolean().optional().default(true),
});

export const gymExpensesQuerySchema = z.object({
  startDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  type: z.string().optional().default("all"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const createGymExpenseSchema = z.object({
  type: z.enum([
    "maintenance",
    "equipment",
    "staff",
    "utilities",
    "rent",
    "consumables",
    "marketing",
    "other",
  ]),
  description: z.string().optional().nullable(),
  amount: z.number().positive("Valor deve ser maior que zero"),
  date: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  category: z.string().optional().nullable(),
});

export const gymPaymentsQuerySchema = z.object({
  status: z.string().optional(),
  studentId: z.string().optional(),
  startDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const createGymPaymentSchema = z.object({
  studentId: z.string().min(1, "studentId é obrigatório"),
  studentName: z.string().optional().default("Aluno"),
  planId: z.string().optional().nullable(),
  amount: z.number().positive("Valor deve ser maior que zero"),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  paymentMethod: z.string().optional().default("pix"),
  reference: z.string().optional().nullable(),
});

export const gymPlansQuerySchema = z.object({
  includeInactive: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default("false"),
});

export const createGymPlanSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["monthly", "quarterly", "semi-annual", "annual", "trial"]),
  price: z.number().positive("Preço deve ser maior que zero"),
  duration: z.number().int().positive("Duração deve ser positiva"),
  benefits: z.array(z.string()).default([]),
});
