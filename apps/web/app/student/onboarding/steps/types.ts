export type DifficultyLevel = "iniciante" | "intermediario" | "avancado";

export interface OnboardingData {
  age: number | "";
  gender: "male" | "female" | "trans-male" | "trans-female" | "";
  isTrans: boolean;
  usesHormones: boolean;
  hormoneType: "testosterone" | "estrogen" | "none" | "";
  height: number | "";
  weight: number | "";
  fitnessLevel: DifficultyLevel | "";
  weeklyWorkoutFrequency: number;
  workoutDuration: number;
  goals: (
    | "perder-peso"
    | "ganhar-massa"
    | "definir"
    | "saude"
    | "forca"
    | "resistencia"
  )[];
  gymType:
    | "academia-completa"
    | "academia-basica"
    | "home-gym"
    | "peso-corporal"
    | "";
  preferredSets: number;
  preferredRepRange: "forca" | "hipertrofia" | "resistencia";
  restTime: "curto" | "medio" | "longo";
  // Valores metabólicos calculados
  bmr?: number;
  tdee?: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  // Nível de atividade física (1-10) baseado em Harris-Benedict
  activityLevel?: number; // 1-10
  // Tempo de tratamento hormonal (meses)
  hormoneTreatmentDuration?: number;
  // Limitações físicas, motoras ou condições médicas
  physicalLimitations?: string[];
  motorLimitations?: string[];
  medicalConditions?: string[];
  // Detalhes adicionais das limitações (ex: qual joelho, grau de severidade, etc)
  limitationDetails?: Record<string, string | string[]>; // { "problemas-joelho": "esquerdo", "ansiedade": "moderada" }
  // Horas disponíveis por dia para treino
  dailyAvailableHours?: number; // 0.5, 1, 1.5, 2, etc
}

export interface StepProps {
  formData: OnboardingData;
  setFormData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  forceValidation?: boolean; // Força validação de todos os campos
}
