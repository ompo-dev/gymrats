export type StudentOnboardingGoal =
  | "perder-peso"
  | "ganhar-massa"
  | "definir"
  | "saude"
  | "forca"
  | "resistencia";

export type StudentOnboardingGender =
  | "male"
  | "female"
  | "trans-male"
  | "trans-female";

export type StudentFitnessLevel =
  | "iniciante"
  | "intermediario"
  | "avancado";

export type StudentOnboardingMetabolicData = {
  age: number;
  gender: StudentOnboardingGender;
  isTrans: boolean;
  usesHormones: boolean;
  hormoneType?: "testosterone" | "estrogen" | "none";
  hormoneTreatmentDuration?: number;
  height: number;
  weight: number;
  fitnessLevel: StudentFitnessLevel;
  weeklyWorkoutFrequency: number;
  workoutDuration: number;
  goals: StudentOnboardingGoal[];
  activityLevel?: number;
};

export type StudentMetabolicCalculation = {
  bmr: number;
  tdee: number;
  activityFactor: number;
  targetCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  macroPercentages: {
    protein: number;
    carbs: number;
    fats: number;
  };
  metadata: {
    formula: "mifflin-st-jeor" | "harris-benedict";
    activityLevel:
      | "sedentary"
      | "light"
      | "moderate"
      | "active"
      | "very-active";
    goal: "cut" | "maintain" | "bulk";
  };
};

function calculateBmrHarris(data: StudentOnboardingMetabolicData) {
  const {
    age,
    height,
    weight,
    gender,
    isTrans,
    usesHormones,
    hormoneType,
    hormoneTreatmentDuration,
  } = data;

  const treatmentMonths = hormoneTreatmentDuration || 0;
  let bmr: number;

  if (isTrans && usesHormones && hormoneType) {
    const maleBmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    const femaleBmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;

    if (hormoneType === "testosterone") {
      if (treatmentMonths >= 12) {
        bmr = maleBmr;
      } else if (treatmentMonths >= 6) {
        bmr = (maleBmr + femaleBmr) / 2;
      } else if (treatmentMonths > 0) {
        bmr = femaleBmr + (maleBmr - femaleBmr) * 0.3;
      } else {
        bmr = femaleBmr;
      }
    } else if (hormoneType === "estrogen") {
      if (treatmentMonths >= 12) {
        bmr = femaleBmr;
      } else if (treatmentMonths >= 6) {
        bmr = (maleBmr + femaleBmr) / 2;
      } else if (treatmentMonths > 0) {
        bmr = maleBmr - (maleBmr - femaleBmr) * 0.3;
      } else {
        bmr = maleBmr;
      }
    } else if (gender === "male" || gender === "trans-male") {
      bmr = maleBmr;
    } else {
      bmr = femaleBmr;
    }
  } else if (gender === "male" || gender === "trans-male") {
    bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else {
    bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }

  return Math.round(bmr);
}

function calculateActivityFactor(data: StudentOnboardingMetabolicData) {
  if (
    typeof data.activityLevel === "number" &&
    data.activityLevel >= 1 &&
    data.activityLevel <= 10
  ) {
    if (data.activityLevel <= 2) {
      return { factor: 1.2, level: "sedentary" as const };
    }

    if (data.activityLevel <= 4) {
      return { factor: 1.375, level: "light" as const };
    }

    if (data.activityLevel <= 6) {
      return { factor: 1.55, level: "moderate" as const };
    }

    if (data.activityLevel <= 8) {
      return { factor: 1.725, level: "active" as const };
    }

    return { factor: 1.9, level: "very-active" as const };
  }

  const weeklyExerciseHours =
    (data.weeklyWorkoutFrequency * data.workoutDuration) / 60;

  if (weeklyExerciseHours < 1) {
    return { factor: 1.2, level: "sedentary" as const };
  }

  if (weeklyExerciseHours < 3) {
    return { factor: 1.375, level: "light" as const };
  }

  if (weeklyExerciseHours < 5) {
    return { factor: 1.55, level: "moderate" as const };
  }

  if (weeklyExerciseHours < 7) {
    return {
      factor: data.fitnessLevel === "avancado" ? 1.725 : 1.55,
      level: "active" as const,
    };
  }

  return {
    factor: data.fitnessLevel === "avancado" ? 1.9 : 1.725,
    level: "very-active" as const,
  };
}

function determineCalorieGoal(
  tdee: number,
  goals: StudentOnboardingGoal[],
): {
  targetCalories: number;
  goal: "cut" | "maintain" | "bulk";
} {
  if (goals.includes("perder-peso")) {
    return {
      targetCalories: Math.round(tdee * 0.8),
      goal: "cut",
    };
  }

  if (goals.includes("ganhar-massa")) {
    return {
      targetCalories: Math.round(tdee * 1.15),
      goal: "bulk",
    };
  }

  if (goals.includes("definir")) {
    return {
      targetCalories: Math.round(tdee * 0.9),
      goal: "cut",
    };
  }

  return {
    targetCalories: Math.round(tdee),
    goal: "maintain",
  };
}

function calculateMacros(
  targetCalories: number,
  weight: number,
  goal: "cut" | "maintain" | "bulk",
) {
  const proteinPerKg =
    goal === "cut" ? 2.2 : goal === "bulk" ? 1.8 : 2.0;
  const protein = Math.round(weight * proteinPerKg);
  const proteinCalories = protein * 4;
  const fatPercentage = goal === "cut" ? 0.25 : 0.3;
  const fatCalories = Math.round(targetCalories * fatPercentage);
  const fats = Math.round(fatCalories / 9);
  const carbs = Math.round(
    Math.max(targetCalories - proteinCalories - fatCalories, 0) / 4,
  );

  return {
    protein,
    carbs,
    fats,
  };
}

export function calculateStudentMetabolicData(
  data: StudentOnboardingMetabolicData,
): StudentMetabolicCalculation {
  const bmr = calculateBmrHarris(data);
  const { factor: activityFactor, level: activityLevel } =
    calculateActivityFactor(data);
  const tdee = Math.round(bmr * activityFactor);
  const { targetCalories, goal } = determineCalorieGoal(tdee, data.goals);
  const macros = calculateMacros(targetCalories, data.weight, goal);
  const totalCalories =
    macros.protein * 4 + macros.carbs * 4 + macros.fats * 9;

  return {
    bmr,
    tdee,
    activityFactor,
    targetCalories,
    macros,
    macroPercentages: {
      protein: Math.round(((macros.protein * 4) / totalCalories) * 100),
      carbs: Math.round(((macros.carbs * 4) / totalCalories) * 100),
      fats: Math.round(((macros.fats * 9) / totalCalories) * 100),
    },
    metadata: {
      formula: "harris-benedict",
      activityLevel,
      goal,
    },
  };
}
