import type {
  Unit,
  WorkoutSession,
  WorkoutExercise,
  UserProgress,
  Achievement,
  UserStats,
  DietPlan,
  Meal,
  PlacementQuestion,
  PlacementTestResult,
  DifficultyLevel,
  DailyNutrition,
  FoodItem,
  WorkoutHistory,
  PersonalRecord,
  StudentGymMembership,
  StudentPayment,
  PaymentMethod,
} from "./types";

// Achievements mock
export const mockAchievements: Achievement[] = [
  {
    id: "first-workout",
    title: "Primeiro Treino",
    description: "Complete seu primeiro treino",
    icon: "💪",
    category: "workouts",
    unlockedAt: new Date(),
    level: 1,
    color: "#58CC02",
  },
  {
    id: "streak-3",
    title: "Sequência de Fogo",
    description: "Mantenha 3 dias seguidos",
    icon: "🔥",
    category: "streak",
    level: 1,
    color: "#FF9600",
  },
  {
    id: "xp-100",
    title: "Iniciante Motivado",
    description: "Ganhe 100 XP",
    icon: "⚡",
    category: "xp",
    level: 1,
    color: "#FFC800",
  },
  {
    id: "perfect-5",
    title: "Perfeccionista",
    description: "Complete 5 treinos perfeitamente",
    icon: "⭐",
    category: "perfect",
    level: 3,
    color: "#58CC02",
  },
  {
    id: "week-warrior",
    title: "Guerreiro Semanal",
    description: "7 dias de sequência",
    icon: "🏆",
    category: "streak",
    progress: 5,
    target: 7,
    level: 3,
    color: "#FF9600",
  },
  {
    id: "chest-master",
    title: "Mestre do Peito",
    description: "Complete 10 treinos de peito",
    icon: "💯",
    category: "special",
    progress: 3,
    target: 10,
    level: 5,
    color: "#CE82FF",
  },
];

// User progress mock
export const mockUserProgress: UserProgress = {
  currentStreak: 5,
  longestStreak: 12,
  totalXP: 1287,
  currentLevel: 8,
  xpToNextLevel: 213,
  workoutsCompleted: 23,
  achievements: mockAchievements.slice(0, 3),
  lastActivityDate: new Date().toISOString(),
  dailyGoalXP: 50,
  weeklyXP: [45, 60, 50, 75, 55, 70, 50],
  todayXP: 30,
};

// User stats mock
export const mockUserStats: UserStats = {
  muscleGroupWorkouts: {
    funcional: 0,
    peito: 8,
    costas: 6,
    pernas: 5,
    ombros: 4,
    bracos: 7,
    core: 3,
    gluteos: 2,
    cardio: 4,
  },
  totalWorkouts: 23,
  totalCalories: 48500,
  averageWorkoutTime: 45,
  perfectWorkouts: 5,
};

// Mock workout exercises
const createWorkoutExercise = (
  id: string,
  name: string,
  sets: number,
  reps: string,
  rest: number,
  notes?: string
): WorkoutExercise => ({
  id,
  name,
  sets,
  reps,
  rest,
  notes,
});

// Mock workout sessions
export const mockWorkouts: WorkoutSession[] = [
  {
    id: "chest-push-1",
    title: "Peito e Tríceps - Dia A",
    description: "Treino focado em desenvolvimento do peitoral",
    muscleGroup: "peito",
    difficulty: "iniciante",
    xpReward: 50,
    estimatedTime: 45,
    locked: false,
    completed: true,
    stars: 3,
    completedAt: new Date(Date.now() - 86400000),
    exercises: [
      createWorkoutExercise(
        "ex1",
        "Supino Reto",
        4,
        "12-10-8-8",
        90,
        "Aumente o peso a cada série"
      ),
      createWorkoutExercise("ex2", "Supino Inclinado", 3, "12", 90),
      createWorkoutExercise(
        "ex3",
        "Crucifixo",
        3,
        "15",
        60,
        "Foco na contração"
      ),
      createWorkoutExercise("ex4", "Tríceps Testa", 3, "12", 60),
      createWorkoutExercise("ex5", "Tríceps Corda", 3, "15", 45),
    ],
  },
  {
    id: "back-pull-1",
    title: "Costas e Bíceps - Dia B",
    description: "Desenvolvimento completo das costas",
    muscleGroup: "costas",
    difficulty: "iniciante",
    xpReward: 50,
    estimatedTime: 50,
    locked: false,
    completed: false,
    exercises: [
      createWorkoutExercise(
        "ex1",
        "Barra Fixa",
        4,
        "8-10",
        120,
        "Assistida se necessário"
      ),
      createWorkoutExercise("ex2", "Remada Curvada", 4, "12", 90),
      createWorkoutExercise("ex3", "Pulldown", 3, "12", 60),
      createWorkoutExercise("ex4", "Rosca Direta", 3, "12", 60),
      createWorkoutExercise("ex5", "Rosca Martelo", 3, "12", 60),
    ],
  },
  {
    id: "legs-1",
    title: "Pernas Completo - Dia C",
    description: "Treino intenso de pernas e glúteos",
    muscleGroup: "pernas",
    difficulty: "intermediario",
    xpReward: 75,
    estimatedTime: 60,
    locked: false,
    completed: false,
    exercises: [
      createWorkoutExercise("ex1", "Agachamento Livre", 4, "12-10-8-8", 120),
      createWorkoutExercise("ex2", "Leg Press", 4, "15", 90),
      createWorkoutExercise("ex3", "Cadeira Extensora", 3, "15", 60),
      createWorkoutExercise("ex4", "Mesa Flexora", 3, "12", 60),
      createWorkoutExercise("ex5", "Panturrilha", 4, "20", 45),
    ],
  },
  {
    id: "shoulders-1",
    title: "Ombros e Trapézio",
    description: "Desenvolvimento completo dos deltóides",
    muscleGroup: "ombros",
    difficulty: "iniciante",
    xpReward: 50,
    estimatedTime: 40,
    locked: true,
    completed: false,
    exercises: [],
  },
];

export const mockLessons = mockWorkouts;

// Mock diet plans
export const mockMeals: Meal[] = [
  {
    id: "m1",
    name: "Ovos mexidos + aveia",
    calories: 450,
    protein: 30,
    carbs: 45,
    fats: 15,
    completed: true,
    type: "breakfast",
  },
  {
    id: "m2",
    name: "Frango grelhado + arroz integral",
    calories: 550,
    protein: 45,
    carbs: 60,
    fats: 10,
    type: "lunch",
  },
  {
    id: "m3",
    name: "Salmão + batata doce",
    calories: 500,
    protein: 40,
    carbs: 50,
    fats: 12,
    type: "dinner",
  },
  {
    id: "m4",
    name: "Whey protein + banana",
    calories: 200,
    protein: 25,
    carbs: 25,
    fats: 2,
    type: "snack",
  },
];

export const mockDietPlans: DietPlan[] = [
  {
    id: "diet-1",
    title: "Dieta Bulking - Dia 1",
    description: "Plano alimentar para ganho de massa",
    meals: mockMeals,
    totalCalories: 2800,
    xpReward: 30,
    locked: false,
    completed: false,
    targetProtein: 180,
    targetCarbs: 280,
    targetFats: 70,
  },
];

// Mock units (trilha de treino)
export const mockUnits: Unit[] = [
  {
    id: "unit-1",
    title: "Semana 1",
    description: "Começando sua jornada fitness",
    workouts: mockWorkouts.slice(0, 2),
    color: "#58CC02",
    icon: "💪",
  },
  {
    id: "unit-2",
    title: "Semana 2",
    description: "Aumentando a intensidade",
    workouts: [mockWorkouts[2]],
    color: "#1CB0F6",
    icon: "🔥",
  },
  {
    id: "unit-3",
    title: "Semana 3",
    description: "Treino avançado",
    workouts: [mockWorkouts[3]],
    color: "#FF9600",
    icon: "⚡",
  },
];

export const mockFoodDatabase: FoodItem[] = [
  {
    id: "food-1",
    name: "Peito de frango grelhado",
    calories: 165,
    protein: 31,
    carbs: 0,
    fats: 3.6,
    servingSize: "100g",
    category: "protein",
  },
  {
    id: "food-2",
    name: "Arroz integral cozido",
    calories: 112,
    protein: 2.6,
    carbs: 24,
    fats: 0.9,
    servingSize: "100g",
    category: "carbs",
  },
  {
    id: "food-3",
    name: "Batata doce cozida",
    calories: 86,
    protein: 1.6,
    carbs: 20,
    fats: 0.1,
    servingSize: "100g",
    category: "carbs",
  },
  {
    id: "food-4",
    name: "Ovo inteiro cozido",
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fats: 11,
    servingSize: "1 unidade (50g)",
    category: "protein",
  },
  {
    id: "food-5",
    name: "Aveia em flocos",
    calories: 389,
    protein: 16.9,
    carbs: 66,
    fats: 6.9,
    servingSize: "100g",
    category: "carbs",
  },
  {
    id: "food-6",
    name: "Banana",
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fats: 0.3,
    servingSize: "1 unidade (100g)",
    category: "fruits",
  },
  {
    id: "food-7",
    name: "Salmão grelhado",
    calories: 208,
    protein: 20,
    carbs: 0,
    fats: 13,
    servingSize: "100g",
    category: "protein",
  },
  {
    id: "food-8",
    name: "Brócolis cozido",
    calories: 35,
    protein: 2.4,
    carbs: 7,
    fats: 0.4,
    servingSize: "100g",
    category: "vegetables",
  },
  {
    id: "food-9",
    name: "Whey Protein",
    calories: 120,
    protein: 24,
    carbs: 3,
    fats: 1,
    servingSize: "1 scoop (30g)",
    category: "protein",
  },
  {
    id: "food-10",
    name: "Azeite de oliva",
    calories: 884,
    protein: 0,
    carbs: 0,
    fats: 100,
    servingSize: "100ml",
    category: "fats",
  },
];

export const mockDailyNutrition: DailyNutrition = {
  date: new Date().toISOString(),
  meals: [
    {
      id: "meal-1",
      name: "Café da manhã completo",
      type: "breakfast",
      calories: 450,
      protein: 30,
      carbs: 45,
      fats: 15,
      completed: true,
      time: "08:00",
      ingredients: ["3 ovos", "50g aveia", "1 banana"],
    },
  ],
  totalCalories: 450,
  totalProtein: 30,
  totalCarbs: 45,
  totalFats: 15,
  waterIntake: 2000,
  targetCalories: 2500,
  targetProtein: 180,
  targetCarbs: 280,
  targetFats: 70,
  targetWater: 3000,
};

// Helper functions
export function calculateLevel(xp: number): {
  level: number;
  xpToNext: number;
} {
  const level = Math.floor(xp / 100) + 1;
  const xpToNext = level * 100 - xp;
  return { level, xpToNext };
}

export function checkStreak(lastActivityDate: string): boolean {
  const last = new Date(lastActivityDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 1;
}

// AI integration placeholders
export async function generateWorkoutWithAI(
  prompt: string
): Promise<WorkoutSession> {
  console.log("AI Prompt:", prompt);
  return mockWorkouts[0];
}

export async function generateDietWithAI(prompt: string): Promise<DietPlan> {
  console.log("AI Prompt:", prompt);
  return mockDietPlans[0];
}

export const placementQuestions: PlacementQuestion[] = [
  {
    id: "experience",
    question: "Qual é seu nível de experiência com musculação?",
    type: "multiple-choice",
    options: [
      "Nunca treinei antes",
      "Treino há menos de 6 meses",
      "Treino há 6 meses a 2 anos",
      "Treino há mais de 2 anos",
    ],
    icon: "💪",
  },
  {
    id: "frequency",
    question: "Quantos dias por semana você pode treinar?",
    type: "multiple-choice",
    options: ["2-3 dias", "4-5 dias", "6-7 dias"],
    icon: "📅",
  },
  {
    id: "goals",
    question: "Quais são seus principais objetivos?",
    type: "selection",
    options: [
      "Ganhar massa muscular",
      "Perder gordura",
      "Melhorar condicionamento",
      "Ficar mais forte",
      "Definição muscular",
    ],
    icon: "🎯",
  },
  {
    id: "equipment",
    question: "Onde você vai treinar?",
    type: "multiple-choice",
    options: [
      "Academia completa",
      "Academia em casa",
      "Apenas peso corporal",
      "Equipamentos limitados",
    ],
    icon: "🏋️",
  },
  {
    id: "injuries",
    question: "Você tem alguma lesão ou limitação física?",
    type: "multiple-choice",
    options: [
      "Não, estou 100%",
      "Problemas no joelho",
      "Problemas nas costas",
      "Problemas no ombro",
      "Outras limitações",
    ],
    icon: "🩺",
  },
];

export function calculatePlacementResult(
  responses: Record<string, any>
): PlacementTestResult {
  let level: DifficultyLevel = "iniciante";

  if (responses.experience === "Treino há 6 meses a 2 anos") {
    level = "intermediario";
  } else if (responses.experience === "Treino há mais de 2 anos") {
    level = "avancado";
  }

  return {
    level,
    recommendedProgram:
      level === "iniciante"
        ? "Push Pull Legs 3x"
        : level === "intermediario"
        ? "Upper Lower 4x"
        : "Arnold Split 6x",
    strengthAreas: ["peito", "pernas", "costas"],
    weeklyGoal:
      responses.frequency === "6-7 dias"
        ? 6
        : responses.frequency === "4-5 dias"
        ? 4
        : 3,
    dietCalories: 2500,
    userResponses: responses,
  };
}

export const mockWorkoutHistory: WorkoutHistory[] = [
  {
    date: new Date(Date.now() - 86400000),
    workoutId: "chest-push-1",
    workoutName: "Peito e Tríceps - Dia A",
    duration: 48,
    totalVolume: 3250,
    exercises: [
      {
        id: "log-1",
        exerciseId: "ex1",
        exerciseName: "Supino Reto",
        workoutId: "chest-push-1",
        date: new Date(Date.now() - 86400000),
        sets: [
          { setNumber: 1, weight: 60, reps: 12, completed: true },
          { setNumber: 2, weight: 65, reps: 10, completed: true },
          { setNumber: 3, weight: 70, reps: 8, completed: true },
          { setNumber: 4, weight: 70, reps: 8, completed: true },
        ],
        difficulty: "ideal",
        formCheckScore: 92,
      },
      {
        id: "log-2",
        exerciseId: "ex2",
        exerciseName: "Supino Inclinado",
        workoutId: "chest-push-1",
        date: new Date(Date.now() - 86400000),
        sets: [
          { setNumber: 1, weight: 50, reps: 12, completed: true },
          { setNumber: 2, weight: 50, reps: 12, completed: true },
          { setNumber: 3, weight: 50, reps: 11, completed: true },
        ],
        difficulty: "ideal",
      },
    ],
    overallFeedback: "excelente",
    bodyPartsFatigued: ["peito", "bracos"],
  },
  {
    date: new Date(Date.now() - 172800000),
    workoutId: "back-pull-1",
    workoutName: "Costas e Bíceps - Dia B",
    duration: 52,
    totalVolume: 2890,
    exercises: [],
    overallFeedback: "bom",
    bodyPartsFatigued: ["costas", "bracos"],
  },
  {
    date: new Date(Date.now() - 259200000),
    workoutId: "legs-1",
    workoutName: "Pernas Completo",
    duration: 65,
    totalVolume: 4200,
    exercises: [],
    overallFeedback: "excelente",
    bodyPartsFatigued: ["pernas", "gluteos"],
  },
];

export const mockPersonalRecords: PersonalRecord[] = [
  {
    exerciseId: "ex1",
    exerciseName: "Supino Reto",
    type: "max-weight",
    value: 100,
    date: new Date(Date.now() - 604800000),
    previousBest: 95,
  },
  {
    exerciseId: "squat-1",
    exerciseName: "Agachamento Livre",
    type: "max-weight",
    value: 140,
    date: new Date(Date.now() - 1209600000),
    previousBest: 130,
  },
  {
    exerciseId: "deadlift-1",
    exerciseName: "Levantamento Terra",
    type: "max-weight",
    value: 160,
    date: new Date(Date.now() - 2592000000),
    previousBest: 150,
  },
  {
    exerciseId: "ex4",
    exerciseName: "Rosca Direta",
    type: "max-reps",
    value: 15,
    date: new Date(Date.now() - 432000000),
  },
];

export const mockWeightHistory = [
  { date: new Date(Date.now() - 2592000000 * 3), weight: 78 },
  { date: new Date(Date.now() - 2592000000 * 2), weight: 79.5 },
  { date: new Date(Date.now() - 2592000000), weight: 81 },
  { date: new Date(Date.now()), weight: 82.5 },
];

export const mockProgressPhotos = [
  {
    id: "photo-1",
    date: new Date(Date.now() - 2592000000 * 3),
    url: "/fitness-transformation-before.jpg",
    notes: "Início da jornada",
    weight: 78,
  },
  {
    id: "photo-2",
    date: new Date(Date.now() - 2592000000),
    url: "/fitness-transformation-1-month.jpg",
    notes: "1 mês de treino",
    weight: 81,
  },
  {
    id: "photo-3",
    date: new Date(),
    url: "/fitness-transformation-current.jpg",
    notes: "Progresso atual",
    weight: 82.5,
  },
];

// Mock student memberships
export const mockStudentMemberships: StudentGymMembership[] = [
  {
    id: "membership-1",
    gymId: "gym-1",
    gymName: "PowerFit Academia",
    gymLogo: "/abstract-gym-logo.png",
    gymAddress: "Rua das Flores, 123 - Centro",
    planId: "plan-monthly",
    planName: "Plano Mensal Premium",
    planType: "monthly",
    startDate: new Date(Date.now() - 86400000 * 30),
    nextBillingDate: new Date(Date.now() + 86400000 * 5),
    amount: 149.9,
    status: "active",
    autoRenew: true,
    paymentMethod: {
      type: "credit-card",
      last4: "4532",
      brand: "Visa",
    },
    benefits: [
      "Acesso ilimitado",
      "Todas as aulas",
      "App premium",
      "Avaliação física",
    ],
  },
  {
    id: "membership-2",
    gymId: "gym-2",
    gymName: "FitZone",
    gymAddress: "Av. Principal, 456 - Bairro Novo",
    planId: "plan-quarterly",
    planName: "Plano Trimestral",
    planType: "quarterly",
    startDate: new Date(Date.now() - 86400000 * 60),
    nextBillingDate: new Date(Date.now() + 86400000 * 30),
    amount: 119.9,
    status: "active",
    autoRenew: false,
    benefits: ["Acesso ilimitado", "Musculação"],
  },
];

// Mock student payments
export const mockStudentPayments: StudentPayment[] = [
  {
    id: "pay-1",
    gymId: "gym-1",
    gymName: "PowerFit Academia",
    planName: "Plano Mensal Premium",
    amount: 149.9,
    date: new Date(Date.now() - 86400000 * 5),
    dueDate: new Date(Date.now() - 86400000 * 5),
    status: "paid",
    paymentMethod: "credit-card",
    reference: "PAY-2024-001",
    receiptUrl: "#",
  },
  {
    id: "pay-2",
    gymId: "gym-1",
    gymName: "PowerFit Academia",
    planName: "Plano Mensal Premium",
    amount: 149.9,
    date: new Date(),
    dueDate: new Date(Date.now() + 86400000 * 5),
    status: "pending",
    paymentMethod: "credit-card",
  },
  {
    id: "pay-3",
    gymId: "gym-2",
    gymName: "FitZone",
    planName: "Plano Trimestral",
    amount: 119.9,
    date: new Date(Date.now() - 86400000 * 30),
    dueDate: new Date(Date.now() - 86400000 * 30),
    status: "paid",
    paymentMethod: "pix",
  },
];

// Mock payment methods
export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "pm-1",
    type: "credit-card",
    isDefault: true,
    cardBrand: "Visa",
    last4: "4532",
    expiryMonth: 12,
    expiryYear: 2027,
    holderName: "João Silva",
  },
  {
    id: "pm-2",
    type: "debit-card",
    isDefault: false,
    cardBrand: "Mastercard",
    last4: "8976",
    expiryMonth: 8,
    expiryYear: 2026,
    holderName: "João Silva",
  },
];
