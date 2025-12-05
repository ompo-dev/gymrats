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
  goals: string[];
  gymType:
    | "academia-completa"
    | "academia-basica"
    | "home-gym"
    | "peso-corporal"
    | "";
  preferredSets: number;
  preferredRepRange: "forca" | "hipertrofia" | "resistencia";
  restTime: "curto" | "medio" | "longo";
}

export interface StepProps {
  formData: OnboardingData;
  setFormData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}
