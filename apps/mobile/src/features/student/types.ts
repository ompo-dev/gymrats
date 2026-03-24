export type StudentBottomTab = "home" | "learn" | "diet" | "profile" | "more";

export type StudentRole = "STUDENT" | "ADMIN" | "GYM";

export type StudentUserInfo = {
  id: string;
  name: string;
  email: string;
  username?: string;
  memberSince?: string;
  avatar?: string;
  role: StudentRole;
  isAdmin: boolean;
};

export type StudentProfileData = {
  height?: number;
  weight?: number;
  fitnessLevel?: string;
  goals?: string[];
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  targetWater?: number;
  hasWeightLossGoal?: boolean;
};

export type WeightHistoryItem = {
  date: string;
  weight: number;
  notes?: string;
};

export type WorkoutSession = {
  id: string;
  title: string;
  description?: string;
  type?: "strength" | "cardio" | "flexibility" | "rest";
  muscleGroup?:
    | "peito"
    | "costas"
    | "pernas"
    | "ombros"
    | "bracos"
    | "core"
    | "gluteos"
    | "cardio"
    | "funcional";
  difficulty?: "iniciante" | "intermediario" | "avancado";
  exercises?: WorkoutExercise[];
  xpReward?: number;
  estimatedTime?: number;
  order?: number;
  stars?: number;
  completedAt?: string | Date;
  completed: boolean;
  locked: boolean;
};

export type WorkoutExerciseAlternative = {
  id: string;
  name: string;
  reason: string;
  educationalId?: string;
};

export type WorkoutExercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: number;
  notes?: string;
  videoUrl?: string;
  completed?: boolean;
  educationalId?: string;
  alternatives?: WorkoutExerciseAlternative[];
  selectedAlternative?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  difficulty?: "iniciante" | "intermediario" | "avancado";
  equipment?: string[];
  instructions?: string[];
  tips?: string[];
  commonMistakes?: string[];
  benefits?: string[];
  scientificEvidence?: string;
  educationSlug?: string;
};

export type Unit = {
  id: string;
  title: string;
  description: string;
  workouts: WorkoutSession[];
  color?: string;
  icon?: string;
};

export type PlanSlotData = {
  id: string;
  dayOfWeek: number;
  type: "workout" | "rest";
  workout?: WorkoutSession;
  locked?: boolean;
  completed?: boolean;
  stars?: number;
  completedAt?: string | Date;
};

export type WeeklyPlanData = {
  id: string;
  title: string;
  description?: string | null;
  slots: PlanSlotData[];
  sourceLibraryPlanId?: string | null;
};

export type TrainingLibraryPlanSummary = {
  id: string;
  title: string;
  description?: string | null;
  preview?: string;
  slotCount?: number;
  estimatedDays?: number;
  creatorType?: string | null;
  sourceLibraryPlanId?: string | null;
  updatedAt?: string | Date | null;
  slots: PlanSlotData[];
};

export type Achievement = {
  id: string;
  title: string;
};

export type UserProgress = {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  workoutsCompleted: number;
  achievements: Achievement[];
  lastActivityDate: string;
  dailyGoalXP: number;
  weeklyXP: number[];
  todayXP: number;
};

export type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  completed?: boolean;
  type:
    | "breakfast"
    | "lunch"
    | "dinner"
    | "snack"
    | "pre-workout"
    | "post-workout";
  time?: string;
  foods?: MealFoodItem[];
};

export type MealFoodItem = {
  id: string;
  foodId: string;
  foodName: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
};

export type FoodItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
  category:
    | "protein"
    | "carbs"
    | "vegetables"
    | "fruits"
    | "fats"
    | "dairy"
    | "snacks";
};

export type DailyNutrition = {
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  waterIntake: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  targetWater: number;
};

export type WorkoutHistory = {
  id: string;
  workoutName: string;
  date: string;
  duration: number;
  totalVolume: number;
  overallFeedback?: "excelente" | "bom" | "regular" | "ruim";
  exercises?: Array<{
    id: string;
    exerciseName: string;
    sets?: Array<unknown>;
  }>;
};

export type PersonalRecord = {
  exerciseId: string;
  exerciseName: string;
  type: "max-weight" | "max-reps" | "max-volume";
  value: number;
  date: string;
  previousBest?: number;
};

export type GymLocation = {
  id: string;
  name: string;
  logo?: string | null;
  address?: string;
  phone?: string;
  coordinates?: { lat: number; lng: number };
  distance?: number;
  rating?: number;
  totalReviews?: number;
  plans?: { daily: number; weekly: number; monthly: number };
  membershipPlans?: Array<{
    id: string;
    name: string;
    type: string;
    price: number;
    duration: number;
    benefits?: string[];
  }>;
  amenities?: string[];
  openNow?: boolean;
  openingHours?: { open: string; close: string };
  photos?: string[];
  isPartner?: boolean;
};

export type StudentGymMembership = {
  id: string;
  gymId: string;
  gymName: string;
  gymLogo?: string;
  gymAddress?: string;
  planId?: string;
  planName: string;
  planType?: "monthly" | "quarterly" | "semi-annual" | "annual";
  startDate?: string;
  nextBillingDate?: string;
  amount?: number;
  status: string;
  autoRenew?: boolean;
  benefits?: string[];
};

export type GymProfileData = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  logo?: string;
  photos?: string[];
  rating: number;
  totalReviews: number;
  openingHours?: {
    open?: string;
    close?: string;
    days?: string[];
  };
  amenities: string[];
  equipmentCount: number;
  totalStudents: number;
  activeStudents: number;
  equipment: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
  }>;
  plans: Array<{
    id: string;
    name: string;
    type: string;
    price: number;
    duration: number;
    benefits: string[];
  }>;
  personals: Array<{
    id: string;
    name: string;
    avatar?: string | null;
  }>;
  myMembership: {
    id: string;
    status: string;
    planId: string | null;
  } | null;
};

export type DayPass = {
  id: string;
  gymId: string;
  gymName: string;
  purchaseDate: string;
  validDate: string;
  price: number;
  status: "active" | "used" | "expired";
  qrCode?: string;
};

export type SubscriptionData = {
  id?: string;
  plan: string;
  status:
    | "active"
    | "canceled"
    | "expired"
    | "past_due"
    | "trialing"
    | "pending_payment";
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string | null;
  trialStart?: string | null;
  trialEnd?: string | null;
  isTrial?: boolean;
  daysRemaining?: number | null;
  billingPeriod?: "monthly" | "annual";
  source?: "OWN" | "GYM_ENTERPRISE";
  gymId?: string;
  enterpriseGymName?: string;
};

export type StudentPayment = {
  id: string;
  gymId: string;
  gymName: string;
  planName: string;
  amount: number;
  date: string;
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "canceled" | "withdrawn";
  paymentMethod: "credit-card" | "debit-card" | "pix" | "cash";
  reference?: string;
  receiptUrl?: string;
};

export type StudentReferralWithdraw = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

export type StudentReferralData = {
  referralCode: string;
  pixKey: string | null;
  pixKeyType: string | null;
  balanceReais: number;
  balanceCents: number;
  totalEarnedCents: number;
  withdraws: StudentReferralWithdraw[];
};

export type StudentPersonalFilter =
  | "all"
  | "subscribed"
  | "near"
  | "remote";

export type StudentPersonalAssignment = {
  id: string;
  personal: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  gym: {
    id: string;
    name: string;
    image?: string | null;
    logo?: string | null;
  } | null;
};

export type StudentPersonalDirectoryItem = {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  atendimentoPresencial: boolean;
  atendimentoRemoto: boolean;
  distance: number | null;
  gyms: Array<{
    id: string;
    name: string;
  }>;
  isSubscribed: boolean;
  activeCampaigns?: Array<{
    id: string;
    title: string;
    description?: string | null;
    primaryColor?: string | null;
    linkedCouponId?: string | null;
    linkedPlanId?: string | null;
  }>;
};

export type StudentPersonalProfile = {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  atendimentoPresencial: boolean;
  atendimentoRemoto: boolean;
  gyms: Array<{
    id: string;
    name: string;
    address?: string;
    logo?: string | null;
    image?: string | null;
  }>;
  plans: Array<{
    id: string;
    name: string;
    type: string;
    price: number;
    duration: number;
    benefits?: string[];
  }>;
  isSubscribed: boolean;
  myAssignment?: {
    id: string;
    status: string;
    activePlan?: {
      id: string;
      name: string;
      type: string;
      price: number;
      duration: number;
    } | null;
  } | null;
  studentsCount?: number;
};

export type StudentPixPayload = {
  paymentId?: string;
  pixId?: string;
  brCode: string;
  brCodeBase64: string;
  amount: number;
  expiresAt?: string;
  planName?: string;
  originalPrice?: number;
  appliedCoupon?: {
    code: string;
    discountString: string;
  };
  canApplyReferral?: boolean;
};

export type WorkoutSetLog = {
  weight?: number | null;
  reps?: number | null;
  completed?: boolean;
  notes?: string | null;
};

export type StudentWorkoutProgressLog = {
  id?: string;
  exerciseId: string;
  exerciseName: string;
  sets?: WorkoutSetLog[];
  notes?: string | null;
  formCheckScore?: number | null;
  difficulty?:
    | "muito_facil"
    | "facil"
    | "medio"
    | "dificil"
    | "muito_dificil"
    | null;
};

export type StudentWorkoutProgress = {
  id: string;
  workoutId: string;
  currentExerciseIndex: number;
  exerciseLogs: StudentWorkoutProgressLog[];
  skippedExercises: string[];
  selectedAlternatives: Record<string, string>;
  xpEarned: number;
  totalVolume: number;
  completionPercentage: number;
  startTime: string | null;
  cardioPreference: string | null;
  cardioDuration: number | null;
  selectedCardioType: string | null;
  lastUpdated: string;
};

export type BoostCampaign = {
  id: string;
  gymId: string | null;
  personalId?: string | null;
  personal?: { id: string; name: string; avatar: string | null } | null;
  title: string;
  description: string;
  primaryColor: string;
  durationHours: number;
  amountCents: number;
  status: string;
  clicks: number;
  impressions: number;
  radiusKm?: number;
  linkedCouponId: string | null;
  linkedPlanId: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

export type StudentHomeData = {
  user: StudentUserInfo | null;
  progress: UserProgress | null;
  profile: StudentProfileData | null;
  weightHistory: WeightHistoryItem[];
  workoutHistory: WorkoutHistory[];
  personalRecords: PersonalRecord[];
  dailyNutrition: DailyNutrition | null;
  weeklyPlan: WeeklyPlanData | null;
  libraryPlans: TrainingLibraryPlanSummary[];
  units: Unit[];
  subscription: SubscriptionData | null;
  payments: StudentPayment[];
  referral: StudentReferralData | null;
  gymLocations: GymLocation[];
  memberships: StudentGymMembership[];
  dayPasses: DayPass[];
  campaigns: BoostCampaign[];
};

export type StudentBootstrapResponse = {
  data: Partial<StudentHomeData>;
};
