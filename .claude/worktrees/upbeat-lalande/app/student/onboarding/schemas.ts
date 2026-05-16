import { z } from "zod";

/**
 * Schemas de validação para o onboarding do student
 * Usa Zod para validação type-safe
 */

// Schema para Step 1 - Informações Pessoais
export const step1Schema = z.object({
	age: z
		.number({
			required_error: "Idade é obrigatória",
			invalid_type_error: "Idade deve ser um número",
		})
		.int("Idade deve ser um número inteiro")
		.min(13, "Idade mínima é 13 anos")
		.max(120, "Idade máxima é 120 anos"),
	gender: z.enum(["male", "female", "trans-male", "trans-female"], {
		required_error: "Gênero é obrigatório",
		invalid_type_error: "Gênero inválido",
	}),
	isTrans: z.boolean().default(false),
	usesHormones: z.boolean().default(false),
	hormoneType: z
		.enum(["testosterone", "estrogen", "none"], {
			invalid_type_error: "Tipo de hormônio inválido",
		})
		.optional()
		.nullable(),
	height: z
		.number({
			required_error: "Altura é obrigatória",
			invalid_type_error: "Altura deve ser um número",
		})
		.positive("Altura deve ser maior que zero")
		.min(100, "Altura mínima é 100cm")
		.max(250, "Altura máxima é 250cm"),
	weight: z
		.number({
			required_error: "Peso é obrigatório",
			invalid_type_error: "Peso deve ser um número",
		})
		.positive("Peso deve ser maior que zero")
		.min(30, "Peso mínimo é 30kg")
		.max(300, "Peso máximo é 300kg"),
	fitnessLevel: z.enum(["iniciante", "intermediario", "avancado"], {
		required_error: "Nível de experiência é obrigatório",
		invalid_type_error: "Nível de experiência inválido",
	}),
});

// Schema para Step 2 - Objetivos
export const step2Schema = z.object({
	goals: z
		.array(
			z.enum([
				"perder-peso",
				"ganhar-massa",
				"definir",
				"saude",
				"forca",
				"resistencia",
			]),
		)
		.min(1, "Selecione pelo menos um objetivo")
		.max(6, "Máximo de 6 objetivos"),
	weeklyWorkoutFrequency: z
		.number({
			required_error: "Frequência de treino é obrigatória",
			invalid_type_error: "Frequência deve ser um número",
		})
		.int("Frequência deve ser um número inteiro")
		.min(1, "Mínimo 1 dia por semana")
		.max(7, "Máximo 7 dias por semana"),
	workoutDuration: z
		.number({
			required_error: "Duração do treino é obrigatória",
			invalid_type_error: "Duração deve ser um número",
		})
		.int("Duração deve ser um número inteiro")
		.min(20, "Duração mínima é 20 minutos")
		.max(180, "Duração máxima é 180 minutos"),
});

// Schema para Step 3 - Preferências
export const step3Schema = z.object({
	preferredSets: z
		.number({
			required_error: "Número de séries é obrigatório",
			invalid_type_error: "Número de séries deve ser um número",
		})
		.int("Número de séries deve ser um número inteiro")
		.min(2, "Mínimo 2 séries")
		.max(6, "Máximo 6 séries"),
	preferredRepRange: z.enum(["forca", "hipertrofia", "resistencia"], {
		required_error: "Faixa de repetições é obrigatória",
		invalid_type_error: "Faixa de repetições inválida",
	}),
	restTime: z.enum(["curto", "medio", "longo"], {
		required_error: "Tempo de descanso é obrigatório",
		invalid_type_error: "Tempo de descanso inválido",
	}),
});

// Schema para Step 4 - Equipamentos
export const step4Schema = z.object({
	gymType: z.enum(
		["academia-completa", "academia-basica", "home-gym", "peso-corporal"],
		{
			required_error: "Tipo de academia é obrigatório",
			invalid_type_error: "Tipo de academia inválido",
		},
	),
});

// Schema para Step 5 - Nível de Atividade e Tratamento Hormonal (ANTES do cálculo metabólico)
export const step5Schema_Activity = z.object({
	activityLevel: z
		.number({
			required_error: "Nível de atividade é obrigatório",
			invalid_type_error: "Nível de atividade deve ser um número",
		})
		.int("Nível de atividade deve ser um número inteiro")
		.min(1, "Nível mínimo é 1")
		.max(10, "Nível máximo é 10"),
	hormoneTreatmentDuration: z
		.number()
		.int("Duração deve ser um número inteiro")
		.min(0, "Duração não pode ser negativa")
		.max(120, "Duração máxima é 120 meses")
		.optional()
		.nullable(),
});

// Schema para Step 6 - Valores Metabólicos (calculado automaticamente após Step 5)
export const step6Schema_Metabolic = z.object({
	bmr: z.number().positive().optional().nullable(),
	tdee: z.number().positive().optional().nullable(),
	targetCalories: z
		.number({
			required_error: "Calorias alvo são obrigatórias",
			invalid_type_error: "Calorias devem ser um número",
		})
		.int("Calorias devem ser um número inteiro")
		.positive("Calorias devem ser maiores que zero")
		.min(800, "Calorias mínimas são 800")
		.max(10000, "Calorias máximas são 10000"),
	targetProtein: z
		.number({
			required_error: "Proteína alvo é obrigatória",
			invalid_type_error: "Proteína deve ser um número",
		})
		.positive("Proteína deve ser maior que zero")
		.min(20, "Proteína mínima é 20g")
		.max(500, "Proteína máxima é 500g"),
	targetCarbs: z
		.number({
			required_error: "Carboidratos alvo são obrigatórios",
			invalid_type_error: "Carboidratos devem ser um número",
		})
		.nonnegative("Carboidratos não podem ser negativos")
		.max(1000, "Carboidratos máximos são 1000g"),
	targetFats: z
		.number({
			required_error: "Gorduras alvo são obrigatórias",
			invalid_type_error: "Gorduras devem ser um número",
		})
		.positive("Gorduras devem ser maiores que zero")
		.min(20, "Gorduras mínimas são 20g")
		.max(300, "Gorduras máximas são 300g"),
});

// Schema para Step 7 - Limitações e Condições Médicas
export const step7Schema = z.object({
	physicalLimitations: z.array(z.string()).optional().default([]),
	motorLimitations: z.array(z.string()).optional().default([]),
	medicalConditions: z.array(z.string()).optional().default([]),
});

// Schema completo do onboarding
export const onboardingSchema = step1Schema
	.merge(step2Schema)
	.merge(step3Schema)
	.merge(step4Schema)
	.merge(step5Schema_Activity)
	.merge(step6Schema_Metabolic)
	.merge(step7Schema);

// Tipo TypeScript inferido do schema
export type OnboardingFormData = z.infer<typeof onboardingSchema>;

// Funções auxiliares para validação por step
export function validateStep1(data: Partial<OnboardingFormData>) {
	return step1Schema.safeParse(data);
}

export function validateStep2(data: Partial<OnboardingFormData>) {
	return step2Schema.safeParse(data);
}

export function validateStep3(data: Partial<OnboardingFormData>) {
	return step3Schema.safeParse(data);
}

export function validateStep4(data: Partial<OnboardingFormData>) {
	return step4Schema.safeParse(data);
}

export function validateStep5(data: Partial<OnboardingFormData>) {
	return step5Schema_Activity.safeParse(data);
}

export function validateStep6(data: Partial<OnboardingFormData>) {
	return step6Schema_Metabolic.safeParse(data);
}

export function validateStep7(data: Partial<OnboardingFormData>) {
	return step7Schema.safeParse(data);
}

export function validateOnboarding(data: Partial<OnboardingFormData>) {
	return onboardingSchema.safeParse(data);
}
