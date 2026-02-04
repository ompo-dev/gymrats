import type { CalorieCalculation, CardioType, UserProfile } from "./types";

// MET (Metabolic Equivalent of Task) values para diferentes atividades
const MET_VALUES = {
	// Cardio
	"corrida-leve": 7.0, // 8 km/h
	"corrida-moderada": 9.8, // 10 km/h
	"corrida-intensa": 12.3, // 12 km/h
	"corrida-muito-intensa": 14.5, // 14+ km/h
	"bicicleta-leve": 4.0,
	"bicicleta-moderada": 8.0,
	"bicicleta-intensa": 10.0,
	"natacao-leve": 6.0,
	"natacao-moderada": 8.0,
	"natacao-intensa": 11.0,
	"remo-leve": 4.8,
	"remo-moderado": 7.0,
	"remo-intenso": 12.0,
	"eliptico-leve": 5.0,
	"eliptico-moderado": 7.0,
	"eliptico-intenso": 9.0,
	"pular-corda-leve": 8.0,
	"pular-corda-moderado": 10.0,
	"pular-corda-intenso": 12.0,
	"caminhada-leve": 3.5,
	"caminhada-moderada": 4.3,
	"caminhada-rapida": 5.0,
	hiit: 12.0,

	// Musculação
	"musculacao-leve": 3.5,
	"musculacao-moderada": 5.0,
	"musculacao-intensa": 6.0,
	"musculacao-muito-intensa": 8.0,

	// Exercícios Funcionais
	yoga: 3.0,
	pilates: 3.5,
	alongamento: 2.5,
	mobilidade: 3.0,
	equilibrio: 2.8,
	"exercicios-idosos": 2.5,
	"exercicios-criancas": 4.0,
	"treino-funcional": 6.0,
};

/**
 * Calcula calorias queimadas usando a fórmula MET
 * Calorias = MET × peso (kg) × tempo (horas)
 *
 * Ajusta baseado em fatores hormonais para pessoas trans
 */
export function calculateCaloriesBurned(
	activity: string,
	intensity: "baixa" | "moderada" | "alta" | "muito-alta",
	duration: number, // minutos
	userProfile: UserProfile,
): CalorieCalculation {
	// Determina o valor MET baseado na atividade e intensidade
	const metKey = `${activity}-${intensity === "muito-alta" ? "muito-intensa" : intensity === "alta" ? "intensa" : intensity}`;
	const met =
		MET_VALUES[metKey as keyof typeof MET_VALUES] ||
		MET_VALUES[`${activity}-moderada` as keyof typeof MET_VALUES] ||
		5.0;

	// Ajuste metabólico baseado em perfil hormonal
	let metabolicMultiplier = 1.0;

	// Para pessoas em transição hormonal, ajustamos o cálculo
	if (userProfile.isTransgender && userProfile.hormoneTreatment) {
		const treatmentMonths = userProfile.hormoneTreatmentDuration || 0;

		if (userProfile.hormoneTreatment === "testosterone") {
			// Testosterona aumenta metabolismo e massa muscular
			// Após 6-12 meses, metabolismo se aproxima do típico masculino
			if (treatmentMonths >= 12) {
				metabolicMultiplier = 1.15; // Metabolismo masculino típico
			} else if (treatmentMonths >= 6) {
				metabolicMultiplier = 1.08; // Transição
			} else {
				metabolicMultiplier = 1.03; // Início da transição
			}
		} else if (userProfile.hormoneTreatment === "estrogen") {
			// Estrogênio tende a reduzir metabolismo basal
			// Após 6-12 meses, metabolismo se aproxima do típico feminino
			if (treatmentMonths >= 12) {
				metabolicMultiplier = 0.9; // Metabolismo feminino típico
			} else if (treatmentMonths >= 6) {
				metabolicMultiplier = 0.95; // Transição
			} else {
				metabolicMultiplier = 0.97; // Início da transição
			}
		}
	} else {
		// Ajuste padrão baseado em gênero biológico
		if (userProfile.gender === "male") {
			metabolicMultiplier = 1.1;
		} else if (userProfile.gender === "female") {
			metabolicMultiplier = 0.95;
		}
	}

	// Ajuste por idade (metabolismo diminui com idade)
	const ageMultiplier =
		userProfile.age > 40 ? 1 - (userProfile.age - 40) * 0.005 : 1.0;

	// Cálculo final: MET × peso × tempo × ajustes
	const baseCalories = met * userProfile.weight * (duration / 60);
	const adjustedCalories = baseCalories * metabolicMultiplier * ageMultiplier;

	// Determina perfil hormonal para o cálculo
	let hormonalProfile:
		| "testosterone-dominant"
		| "estrogen-dominant"
		| "balanced"
		| undefined;

	if (userProfile.isTransgender && userProfile.hormoneTreatment) {
		hormonalProfile =
			userProfile.hormoneTreatment === "testosterone"
				? "testosterone-dominant"
				: "estrogen-dominant";
	} else if (userProfile.gender === "male") {
		hormonalProfile = "testosterone-dominant";
	} else if (userProfile.gender === "female") {
		hormonalProfile = "estrogen-dominant";
	} else {
		hormonalProfile = "balanced";
	}

	return {
		exercise: activity,
		type:
			activity.includes("corrida") || activity.includes("bicicleta")
				? "cardio"
				: "strength",
		duration,
		intensity,
		caloriesBurned: Math.round(adjustedCalories),
		metabolicEquivalent: met,
		calculatedFor: {
			weight: userProfile.weight,
			age: userProfile.age,
			gender: userProfile.gender,
			hormonalProfile,
		},
	};
}

/**
 * Calcula calorias para sessão de cardio específica
 */
export function calculateCardioCalories(
	cardioType: CardioType,
	duration: number,
	intensity: "baixa" | "moderada" | "alta" | "muito-alta",
	userProfile: UserProfile,
): number {
	const calc = calculateCaloriesBurned(
		cardioType,
		intensity,
		duration,
		userProfile,
	);
	return calc.caloriesBurned;
}

/**
 * Calcula calorias para treino de musculação
 */
export function calculateStrengthTrainingCalories(
	duration: number,
	intensity: "baixa" | "moderada" | "alta" | "muito-alta",
	userProfile: UserProfile,
): number {
	const calc = calculateCaloriesBurned(
		"musculacao",
		intensity,
		duration,
		userProfile,
	);
	return calc.caloriesBurned;
}

/**
 * Estima intensidade baseado em frequência cardíaca
 */
export function estimateIntensityFromHeartRate(
	heartRate: number,
	age: number,
): "baixa" | "moderada" | "alta" | "muito-alta" {
	const maxHR = 220 - age;
	const percentage = (heartRate / maxHR) * 100;

	if (percentage < 60) return "baixa";
	if (percentage < 70) return "moderada";
	if (percentage < 85) return "alta";
	return "muito-alta";
}

/**
 * Calcula zona de frequência cardíaca alvo
 */
export function calculateTargetHeartRateZone(
	age: number,
	intensity: "fat-burn" | "cardio" | "peak",
): { min: number; max: number } {
	const maxHR = 220 - age;

	switch (intensity) {
		case "fat-burn":
			return { min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.7) };
		case "cardio":
			return { min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.85) };
		case "peak":
			return { min: Math.round(maxHR * 0.85), max: Math.round(maxHR * 0.95) };
	}
}
