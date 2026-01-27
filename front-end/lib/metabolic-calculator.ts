/**
 * Calculadora Metabólica
 * 
 * Calcula TMB (Taxa Metabólica Basal), TDEE (Total Daily Energy Expenditure)
 * e macronutrientes baseado em dados pessoais e objetivos.
 * 
 * Segue padrões científicos estabelecidos (Mifflin-St Jeor, Harris-Benedict)
 */

export interface MetabolicData {
  age: number;
  gender: "male" | "female" | "trans-male" | "trans-female";
  isTrans: boolean;
  usesHormones: boolean;
  hormoneType?: "testosterone" | "estrogen" | "none";
  hormoneTreatmentDuration?: number; // meses
  height: number; // cm
  weight: number; // kg
  fitnessLevel: "iniciante" | "intermediario" | "avancado";
  weeklyWorkoutFrequency: number; // 1-7 dias
  workoutDuration: number; // minutos
  goals: string[]; // perder-peso, ganhar-massa, etc.
  activityLevel?: number; // 1-10 (nível de atividade física baseado em Harris-Benedict)
}

export interface MetabolicCalculation {
  // Taxa Metabólica Basal (BMR/TMB)
  bmr: number; // calorias em repouso
  
  // Total Daily Energy Expenditure (TDEE)
  tdee: number; // calorias totais diárias
  
  // Fator de atividade
  activityFactor: number;
  
  // Objetivo calórico (ajustado para objetivo)
  targetCalories: number;
  
  // Macronutrientes (gramas)
  macros: {
    protein: number; // gramas
    carbs: number; // gramas
    fats: number; // gramas
  };
  
  // Percentuais de macronutrientes
  macroPercentages: {
    protein: number; // %
    carbs: number; // %
    fats: number; // %
  };
  
  // Metadados do cálculo
  metadata: {
    formula: "mifflin-st-jeor" | "harris-benedict";
    activityLevel: "sedentary" | "light" | "moderate" | "active" | "very-active";
    goal: "cut" | "maintain" | "bulk";
    hormonalAdjustment?: number; // ajuste hormonal aplicado
  };
}

/**
 * Calcula TMB usando a fórmula de Mifflin-St Jeor (mais precisa)
 * 
 * Homens: TMB = 10 × peso(kg) + 6.25 × altura(cm) - 5 × idade(anos) + 5
 * Mulheres: TMB = 10 × peso(kg) + 6.25 × altura(cm) - 5 × idade(anos) - 161
 */
function calculateBMR_Mifflin(data: MetabolicData): number {
  const { age, height, weight, gender, isTrans, usesHormones, hormoneType, hormoneTreatmentDuration } = data;
  
  // Usa hormoneTreatmentDuration se disponível, caso contrário assume 0
  const treatmentMonths = hormoneTreatmentDuration || 0;
  
  // Cálculo base
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  
  // Ajuste por gênero
  if (isTrans && usesHormones && hormoneType) {
    // Para pessoas trans em terapia hormonal, ajustamos baseado no hormônio
    const treatmentMonths = hormoneTreatmentDuration || 0;
    
    if (hormoneType === "testosterone") {
      // Testosterona aumenta metabolismo
      // Após 12 meses, metabolismo se aproxima do masculino
      if (treatmentMonths >= 12) {
        bmr += 5; // Ajuste masculino completo
      } else if (treatmentMonths >= 6) {
        bmr += 2.5; // Transição
      } else if (treatmentMonths > 0) {
        bmr -= 156; // Base feminino (será ajustado depois)
        bmr += 1; // Início da transição
      } else {
        // Sem tratamento ainda, usa base do gênero original
        bmr -= 161; // Base feminino
      }
    } else if (hormoneType === "estrogen") {
      // Estrogênio reduz metabolismo
      // Após 12 meses, metabolismo se aproxima do feminino
      if (treatmentMonths >= 12) {
        bmr -= 161; // Ajuste feminino completo
      } else if (treatmentMonths >= 6) {
        bmr -= 80; // Transição
      } else if (treatmentMonths > 0) {
        bmr -= 40; // Início da transição
      } else {
        // Sem tratamento ainda, mantém base masculino
        bmr += 5; // Base masculino
      }
    }
  } else {
    // Ajuste padrão por gênero
    if (gender === "male" || gender === "trans-male") {
      bmr += 5; // Homens
    } else {
      bmr -= 161; // Mulheres
    }
  }
  
  return Math.round(bmr);
}

/**
 * Calcula TMB usando a fórmula de Harris-Benedict
 * 
 * Homens: TMB = 88.362 + (13.397 × peso) + (4.799 × altura) - (5.677 × idade)
 * Mulheres: TMB = 447.593 + (9.247 × peso) + (3.098 × altura) - (4.330 × idade)
 */
function calculateBMR_Harris(data: MetabolicData): number {
  const { age, height, weight, gender, isTrans, usesHormones, hormoneType, hormoneTreatmentDuration } = data;
  
  // Usa hormoneTreatmentDuration se disponível, caso contrário assume 0
  const treatmentMonths = hormoneTreatmentDuration || 0;
  
  let bmr: number;
  
  // Ajuste por gênero e terapia hormonal
  if (isTrans && usesHormones && hormoneType) {
    // Para pessoas trans em terapia hormonal, ajustamos baseado no hormônio
    if (hormoneType === "testosterone") {
      // Testosterona aumenta metabolismo
      // Após 12 meses, metabolismo se aproxima do masculino
      if (treatmentMonths >= 12) {
        // Usa fórmula masculina completa
        bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
      } else if (treatmentMonths >= 6) {
        // Transição - média entre masculino e feminino
        const maleBMR = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
        const femaleBMR = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
        bmr = (maleBMR + femaleBMR) / 2;
      } else if (treatmentMonths > 0) {
        // Início da transição - mais próximo do feminino
        const maleBMR = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
        const femaleBMR = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
        bmr = femaleBMR + (maleBMR - femaleBMR) * 0.3;
      } else {
        // Sem tratamento ainda, usa base do gênero original (feminino)
        bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
      }
    } else if (hormoneType === "estrogen") {
      // Estrogênio reduz metabolismo
      // Após 12 meses, metabolismo se aproxima do feminino
      if (treatmentMonths >= 12) {
        // Usa fórmula feminina completa
        bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
      } else if (treatmentMonths >= 6) {
        // Transição - média entre masculino e feminino
        const maleBMR = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
        const femaleBMR = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
        bmr = (maleBMR + femaleBMR) / 2;
      } else if (treatmentMonths > 0) {
        // Início da transição - mais próximo do masculino
        const maleBMR = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
        const femaleBMR = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
        bmr = maleBMR - (maleBMR - femaleBMR) * 0.3;
      } else {
        // Sem tratamento ainda, mantém base masculino
        bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
      }
    } else {
      // Sem hormônio específico, usa base do gênero
      if (gender === "male" || gender === "trans-male") {
        bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
      } else {
        bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
      }
    }
  } else {
    // Ajuste padrão por gênero
    if (gender === "male" || gender === "trans-male") {
      // Homens: TMB = 88.362 + (13.397 × peso) + (4.799 × altura) - (5.677 × idade)
      bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    } else {
      // Mulheres: TMB = 447.593 + (9.247 × peso) + (3.098 × altura) - (4.330 × idade)
      bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
    }
  }
  
  return Math.round(bmr);
}

/**
 * Determina fator de atividade baseado em nível de atividade (1-10) ou frequência de treinos
 * 
 * Se activityLevel (1-10) estiver disponível, usa ele (mais preciso)
 * Caso contrário, calcula baseado em frequência e duração de treinos
 */
function calculateActivityFactor(data: MetabolicData): {
  factor: number;
  level: "sedentary" | "light" | "moderate" | "active" | "very-active";
} {
  // Se tem activityLevel (1-10), usa ele (mais preciso)
  if (data.activityLevel !== undefined && data.activityLevel >= 1 && data.activityLevel <= 10) {
    // Mapeia nível 1-10 para fatores de atividade
    // 1-2: 1.2 (sedentary)
    // 3-4: 1.375 (light)
    // 5-6: 1.55 (moderate)
    // 7-8: 1.725 (active)
    // 9-10: 1.9 (very-active)
    
    const level = data.activityLevel;
    if (level <= 2) {
      return { factor: 1.2, level: "sedentary" };
    } else if (level <= 4) {
      return { factor: 1.375, level: "light" };
    } else if (level <= 6) {
      return { factor: 1.55, level: "moderate" };
    } else if (level <= 8) {
      return { factor: 1.725, level: "active" };
    } else {
      return { factor: 1.9, level: "very-active" };
    }
  }
  
  // Fallback: calcula baseado em frequência e duração de treinos
  const { weeklyWorkoutFrequency, workoutDuration, fitnessLevel } = data;
  
  // Calcula horas de exercício por semana
  const weeklyExerciseHours = (weeklyWorkoutFrequency * workoutDuration) / 60;
  
  // Fatores de atividade (baseado em TDEE multipliers)
  // Sedentário: 1.2 (pouco ou nenhum exercício)
  // Leve: 1.375 (exercício leve 1-3 dias/semana)
  // Moderado: 1.55 (exercício moderado 3-5 dias/semana)
  // Ativo: 1.725 (exercício pesado 6-7 dias/semana)
  // Muito ativo: 1.9 (exercício muito pesado, trabalho físico)
  
  if (weeklyExerciseHours < 1) {
    return { factor: 1.2, level: "sedentary" };
  } else if (weeklyExerciseHours < 3) {
    return { factor: 1.375, level: "light" };
  } else if (weeklyExerciseHours < 5) {
    return { factor: 1.55, level: "moderate" };
  } else if (weeklyExerciseHours < 7) {
    // Ajusta baseado no nível de fitness
    const baseFactor = fitnessLevel === "avancado" ? 1.725 : 1.55;
    return { factor: baseFactor, level: "active" };
  } else {
    // Muito ativo (7+ horas/semana)
    const baseFactor = fitnessLevel === "avancado" ? 1.9 : 1.725;
    return { factor: baseFactor, level: "very-active" };
  }
}

/**
 * Determina objetivo calórico baseado nas metas do usuário
 */
function determineCalorieGoal(
  tdee: number,
  goals: string[]
): {
  targetCalories: number;
  goal: "cut" | "maintain" | "bulk";
} {
  // Prioriza objetivos na ordem de importância
  if (goals.includes("perder-peso")) {
    // Déficit de 15-20% para perda de peso saudável
    return {
      targetCalories: Math.round(tdee * 0.8), // 20% de déficit
      goal: "cut",
    };
  } else if (goals.includes("ganhar-massa")) {
    // Superávit de 10-15% para ganho de massa
    return {
      targetCalories: Math.round(tdee * 1.15), // 15% de superávit
      goal: "bulk",
    };
  } else if (goals.includes("definir")) {
    // Déficit leve de 10% para definição
    return {
      targetCalories: Math.round(tdee * 0.9), // 10% de déficit
      goal: "cut",
    };
  } else {
    // Manutenção (saúde, força, resistência)
    return {
      targetCalories: Math.round(tdee),
      goal: "maintain",
    };
  }
}

/**
 * Calcula macronutrientes baseado em objetivo e peso
 */
function calculateMacros(
  targetCalories: number,
  weight: number,
  goal: "cut" | "maintain" | "bulk"
): {
  protein: number;
  carbs: number;
  fats: number;
} {
  // Proteína: 1.6-2.2g/kg (mais alta para cutting, moderada para bulk)
  let proteinPerKg: number;
  if (goal === "cut") {
    proteinPerKg = 2.2; // Mais proteína para preservar massa durante déficit
  } else if (goal === "bulk") {
    proteinPerKg = 1.8; // Moderada para bulk
  } else {
    proteinPerKg = 2.0; // Manutenção
  }
  
  const protein = Math.round(weight * proteinPerKg);
  const proteinCalories = protein * 4; // 4 cal/g
  
  // Gordura: 20-30% das calorias totais
  const fatPercentage = goal === "cut" ? 0.25 : 0.3; // 25% para cut, 30% para bulk/maintain
  const fatCalories = Math.round(targetCalories * fatPercentage);
  const fats = Math.round(fatCalories / 9); // 9 cal/g
  
  // Carboidratos: resto das calorias
  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const carbs = Math.round(remainingCalories / 4); // 4 cal/g
  
  return {
    protein,
    carbs: Math.max(0, carbs), // Garante não negativo
    fats,
  };
}

/**
 * Função principal: calcula todos os valores metabólicos
 * Usa Harris-Benedict como padrão conforme solicitado
 */
export function calculateMetabolicData(
  data: MetabolicData,
  formula: "mifflin-st-jeor" | "harris-benedict" = "harris-benedict"
): MetabolicCalculation {
  // 1. Calcula TMB usando Harris-Benedict como padrão
  const bmr =
    formula === "mifflin-st-jeor"
      ? calculateBMR_Mifflin(data)
      : calculateBMR_Harris(data);
  
  // 2. Calcula fator de atividade
  const { factor: activityFactor, level: activityLevel } =
    calculateActivityFactor(data);
  
  // 3. Calcula TDEE
  const tdee = Math.round(bmr * activityFactor);
  
  // 4. Determina objetivo calórico
  const { targetCalories, goal } = determineCalorieGoal(tdee, data.goals);
  
  // 5. Calcula macronutrientes
  const macros = calculateMacros(targetCalories, data.weight, goal);
  
  // 6. Calcula percentuais
  const totalCalories = macros.protein * 4 + macros.carbs * 4 + macros.fats * 9;
  const macroPercentages = {
    protein: Math.round((macros.protein * 4 / totalCalories) * 100),
    carbs: Math.round((macros.carbs * 4 / totalCalories) * 100),
    fats: Math.round((macros.fats * 9 / totalCalories) * 100),
  };
  
  return {
    bmr,
    tdee,
    activityFactor,
    targetCalories,
    macros,
    macroPercentages,
    metadata: {
      formula,
      activityLevel,
      goal,
    },
  };
}

/**
 * Ajusta macronutrientes manualmente (para personalização)
 */
export function adjustMacros(
  baseCalculation: MetabolicCalculation,
  adjustments: {
    protein?: number;
    carbs?: number;
    fats?: number;
  }
): MetabolicCalculation {
  const adjustedMacros = {
    protein: adjustments.protein ?? baseCalculation.macros.protein,
    carbs: adjustments.carbs ?? baseCalculation.macros.carbs,
    fats: adjustments.fats ?? baseCalculation.macros.fats,
  };
  
  // Recalcula calorias totais
  const adjustedCalories =
    adjustedMacros.protein * 4 +
    adjustedMacros.carbs * 4 +
    adjustedMacros.fats * 9;
  
  // Recalcula percentuais
  const macroPercentages = {
    protein: Math.round((adjustedMacros.protein * 4 / adjustedCalories) * 100),
    carbs: Math.round((adjustedMacros.carbs * 4 / adjustedCalories) * 100),
    fats: Math.round((adjustedMacros.fats * 9 / adjustedCalories) * 100),
  };
  
  return {
    ...baseCalculation,
    targetCalories: adjustedCalories,
    macros: adjustedMacros,
    macroPercentages,
  };
}

