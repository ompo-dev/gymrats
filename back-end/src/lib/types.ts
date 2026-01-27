export type WorkoutType = "strength" | "cardio" | "flexibility" | "rest";
export type DietType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "afternoon-snack"
  | "pre-workout"
  | "post-workout";

export type DifficultyLevel = "iniciante" | "intermediario" | "avancado";
export type MuscleGroup =
  | "peito"
  | "costas"
  | "pernas"
  | "ombros"
  | "bracos"
  | "core"
  | "gluteos"
  | "cardio"
  | "funcional";

export interface AlternativeExercise {
  id: string;
  name: string;
  reason: string;
  educationalId?: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: number;
  notes?: string;
  videoUrl?: string;
  completed?: boolean;
  educationalId?: string;
  alternatives?: AlternativeExercise[];
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
  order?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface WorkoutSession {
  id: string;
  title: string;
  description: string;
  type: WorkoutType;
  muscleGroup: MuscleGroup;
  difficulty: DifficultyLevel;
  exercises: WorkoutExercise[];
  xpReward: number;
  estimatedTime: number;
  order?: number;
  locked: boolean;
  completed: boolean;
  stars?: number;
  completedAt?: Date;
}

export interface MealFoodItem {
  id: string;
  foodId: string;
  foodName: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  completed?: boolean;
  type: DietType;
  time?: string;
  image?: string;
  ingredients?: string[];
  foods?: MealFoodItem[];
}

export interface DietPlan {
  id: string;
  title: string;
  description: string;
  meals: Meal[];
  totalCalories: number;
  xpReward: number;
  locked: boolean;
  completed: boolean;
  completedAt?: Date;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  workouts: WorkoutSession[];
  color: string;
  icon: string;
  studentId?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  target?: number;
  category: "streak" | "workouts" | "xp" | "perfect" | "special";
  level?: number;
  color: string;
}

export interface UserProgress {
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
}

export interface UserStats {
  muscleGroupWorkouts: Record<MuscleGroup, number>;
  totalWorkouts: number;
  totalCalories: number;
  averageWorkoutTime: number;
  perfectWorkouts: number;
}

export interface AIGeneratedContent {
  type: "workout" | "diet" | "feedback";
  prompt?: string;
  generatedAt: Date;
  content: WorkoutSession | DietPlan | string;
}

export interface PlacementQuestion {
  id: string;
  question: string;
  type: "multiple-choice" | "selection" | "scale";
  options?: string[];
  icon?: string;
}

export interface PlacementTestResult {
  level: DifficultyLevel;
  recommendedProgram: string;
  strengthAreas: MuscleGroup[];
  weeklyGoal: number;
  dietCalories: number;
  userResponses: Record<string, any>;
}

export interface OnboardingData {
  completedPlacement: boolean;
  placementResult?: PlacementTestResult;
  name?: string;
  goals?: string[];
  availability?: number;
}

export interface MuscleInfo {
  id: string;
  name: string;
  scientificName: string;
  group: MuscleGroup;
  description: string;
  functions: string[];
  commonExercises: string[];
  image?: string;
  anatomyFacts: string[];
}

export interface ExerciseInfo {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  difficulty: DifficultyLevel;
  equipment: string[];
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  videoUrl?: string;
  gifUrl?: string;
  benefits: string[];
  scientificEvidence?: string;
}

export interface EducationalLesson {
  id: string;
  title: string;
  category: "anatomy" | "nutrition" | "training-science" | "recovery" | "form";
  content: string;
  keyPoints: string[];
  duration: number;
  xpReward: number;
  completed: boolean;
  quiz?: {
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }[];
  };
}

export interface DailyNutrition {
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
}

export interface FoodItem {
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
  image?: string;
}

export interface PostureAnalysis {
  id: string;
  exerciseId: string;
  exerciseName: string;
  timestamp: Date;
  score: number;
  feedback: PostureFeedback[];
  keyPoints: DetectedKeyPoint[];
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface PostureFeedback {
  type: "error" | "warning" | "success";
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  bodyPart: string;
  suggestion: string;
}

export interface DetectedKeyPoint {
  name: string;
  x: number;
  y: number;
  confidence: number;
}

export interface FormCheckResult {
  overall: "excellent" | "good" | "needs-improvement" | "poor";
  score: number;
  feedback: PostureFeedback[];
  aiAnalysis?: string;
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  level: number;
  currentStreak: number;
  totalXP: number;
  weeklyXP: number;
  status: "following" | "follower" | "mutual";
  isOnline?: boolean;
  lastActive?: Date;
}

export interface LeaderboardEntry {
  rank: number;
  user: Friend;
  xp: number;
  change: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "workout" | "streak" | "xp" | "custom";
  startDate: Date;
  endDate: Date;
  participants: Friend[];
  goal: number;
  currentProgress: number;
  reward: {
    xp: number;
    badge?: string;
  };
  isActive: boolean;
}

export interface Activity {
  id: string;
  user: Friend;
  type: "workout" | "achievement" | "streak" | "level-up";
  description: string;
  timestamp: Date;
  xpEarned?: number;
  workoutName?: string;
  achievementIcon?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
  isTransgender?: boolean;
  hormoneTreatment?: "testosterone" | "estrogen" | "none";
  hormoneTreatmentDuration?: number;
  height: number;
  weight: number;
  fitnessLevel: DifficultyLevel;
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
  injuries?: string[];
  availableEquipment: string[];
  gymType:
    | "academia-completa"
    | "academia-basica"
    | "home-gym"
    | "peso-corporal";
  preferredWorkoutTime: "manha" | "tarde" | "noite";
  preferredSets: number;
  preferredRepRange: "forca" | "hipertrofia" | "resistencia";
  restTime: "curto" | "medio" | "longo";
  dietType?: "flexivel" | "vegetariano" | "vegano" | "low-carb" | "paleo";
  allergies?: string[];
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  mealsPerDay?: number;
}

export interface ExerciseLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  workoutId: string;
  date: Date;
  sets: SetLog[];
  notes?: string;
  formCheckScore?: number;
  difficulty: "muito-facil" | "facil" | "ideal" | "dificil" | "muito-dificil";
}

export interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  completed: boolean;
  notes?: string;
}

export interface WorkoutHistory {
  date: Date;
  workoutId: string;
  workoutName: string;
  duration: number;
  totalVolume: number;
  exercises: ExerciseLog[];
  overallFeedback?: "excelente" | "bom" | "regular" | "ruim";
  bodyPartsFatigued: MuscleGroup[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: "max-weight" | "max-reps" | "max-volume";
  value: number;
  date: Date;
  previousBest?: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  createdBy: "user" | "ai" | "coach";
  muscleGroups: MuscleGroup[];
  difficulty: DifficultyLevel;
  duration: number;
  exercises: WorkoutExercise[];
  frequency: number;
  notes?: string;
  tags?: string[];
}

export type CardioType =
  | "corrida"
  | "bicicleta"
  | "natacao"
  | "remo"
  | "eliptico"
  | "pular-corda"
  | "caminhada"
  | "hiit";
export type FunctionalCategory =
  | "mobilidade"
  | "equilibrio"
  | "coordenacao"
  | "agilidade"
  | "core-funcional"
  | "idosos"
  | "criancas";

export interface CardioSession {
  id: string;
  type: CardioType;
  duration: number;
  distance?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  caloriesBurned: number;
  intensity: "baixa" | "moderada" | "alta" | "muito-alta";
  date: Date;
  notes?: string;
  completed: boolean;
}

export interface FunctionalExercise {
  id: string;
  name: string;
  category: FunctionalCategory;
  description: string;
  sets: number;
  duration: string;
  rest: number;
  difficulty: DifficultyLevel;
  benefits: string[];
  targetAudience: ("criancas" | "adultos" | "idosos")[];
  equipment: string[];
  videoUrl?: string;
  caloriesBurnedPerMinute: number;
}

export interface CalorieCalculation {
  exercise: string;
  type: "strength" | "cardio" | "functional";
  duration: number;
  intensity: "baixa" | "moderada" | "alta" | "muito-alta";
  caloriesBurned: number;
  metabolicEquivalent: number;
  calculatedFor: {
    weight: number;
    age: number;
    gender: string;
    hormonalProfile?:
      | "testosterone-dominant"
      | "estrogen-dominant"
      | "balanced";
  };
}

export interface WorkoutWithCalories extends WorkoutSession {
  totalCaloriesBurned: number;
  caloriesPerExercise: {
    exerciseId: string;
    calories: number;
  }[];
}

export type UserType = "student" | "gym";

export interface GymProfile {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  cnpj: string;
  plan: "basic" | "premium" | "enterprise";
  totalStudents: number;
  activeStudents: number;
  equipmentCount: number;
  createdAt: Date;
  gamification: GymGamification;
  isActive?: boolean;
  hasActiveSubscription?: boolean;
}

export interface MultipleGymsInfo {
  gyms: GymProfile[];
  activeGymId: string | null;
  canCreateMultipleGyms: boolean;
  totalGyms: number;
}

export interface GymGamification {
  level: number;
  xp: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  monthlyStudentGoal: number;
  avgStudentFrequency: number;
  equipmentUtilization: number;
  ranking: number;
}

export interface StudentData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  age: number;
  gender: string;
  phone: string;
  membershipStatus: "active" | "inactive" | "suspended";
  joinDate: Date;
  lastVisit?: Date;
  totalVisits: number;
  currentStreak: number;
  profile: UserProfile;
  progress: UserProgress;
  workoutHistory: WorkoutHistory[];
  personalRecords: PersonalRecord[];
  currentWeight: number;
  weightHistory: { date: Date; weight: number }[];
  attendanceRate: number;
  favoriteEquipment: string[];
  assignedTrainer?: string;
  notes?: string;
  gymMembership?: StudentGymMembership;
  payments?: StudentPayment[];
}

export interface StudentGymMembership {
  id: string;
  gymId: string;
  gymName: string;
  gymLogo?: string;
  gymAddress: string;
  planId: string;
  planName: string;
  planType: "monthly" | "quarterly" | "semi-annual" | "annual";
  startDate: Date;
  nextBillingDate: Date;
  amount: number;
  status: "active" | "suspended" | "canceled" | "pending";
  autoRenew: boolean;
  paymentMethod?: {
    type: "credit-card" | "debit-card" | "pix";
    last4?: string;
    brand?: string;
  };
  benefits: string[];
}

export interface StudentPayment {
  id: string;
  gymId: string;
  gymName: string;
  planName: string;
  amount: number;
  date: Date;
  dueDate: Date;
  status: "paid" | "pending" | "overdue" | "canceled";
  paymentMethod: "credit-card" | "debit-card" | "pix" | "cash";
  reference?: string;
  receiptUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: "credit-card" | "debit-card" | "pix";
  isDefault: boolean;
  cardBrand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  pixKey?: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  status: "available" | "in-use" | "maintenance" | "broken";
  currentUser?: {
    studentId: string;
    studentName: string;
    startTime: Date;
  };
  usageStats: {
    totalUses: number;
    avgUsageTime: number;
    popularTimes: string[];
  };
  maintenanceHistory: MaintenanceRecord[];
  qrCode?: string;
}

export interface MaintenanceRecord {
  id: string;
  date: Date;
  type: "preventive" | "corrective" | "inspection";
  description: string;
  performedBy: string;
  cost?: number;
  nextScheduled?: Date;
}

export interface EquipmentUsage {
  id: string;
  equipmentId: string;
  studentId: string;
  studentName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  exercisesPerformed?: string[];
}

export interface GymStats {
  today: {
    checkins: number;
    activeStudents: number;
    equipmentInUse: number;
    peakHour: string;
  };
  week: {
    totalCheckins: number;
    avgDailyCheckins: number;
    newMembers: number;
    canceledMembers: number;
    revenue?: number;
  };
  month: {
    totalCheckins: number;
    retentionRate: number;
    growthRate: number;
    topStudents: StudentData[];
    mostUsedEquipment: Equipment[];
  };
}

export interface CheckIn {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: Date;
  checkOut?: Date;
  duration?: number;
}

export interface MembershipPlan {
  id: string;
  name: string;
  type: "monthly" | "quarterly" | "semi-annual" | "annual" | "trial";
  price: number;
  duration: number;
  benefits: string[];
  isActive: boolean;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  planId: string;
  planName: string;
  amount: number;
  date: Date;
  dueDate: Date;
  status: "paid" | "pending" | "overdue" | "canceled";
  paymentMethod:
    | "credit-card"
    | "debit-card"
    | "cash"
    | "pix"
    | "bank-transfer";
  reference?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses: number;
  currentUses: number;
  expiryDate: Date;
  isActive: boolean;
  appliedTo?: string[];
}

export interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referredId: string;
  referredName: string;
  date: Date;
  status: "pending" | "completed";
  reward: number;
}

export interface Expense {
  id: string;
  type: "maintenance" | "equipment" | "staff" | "utilities" | "rent" | "other";
  description: string;
  amount: number;
  date: Date;
  category: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  monthlyRecurring: number;
  pendingPayments: number;
  overduePayments: number;
  averageTicket: number;
  churnRate: number;
  revenueGrowth: number;
}

export interface GymLocation {
  id: string;
  name: string;
  logo?: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distance?: number;
  rating: number;
  totalReviews: number;
  plans: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  amenities: string[];
  openNow: boolean;
  openingHours: {
    open: string;
    close: string;
  };
  photos?: string[];
  isPartner: boolean;
}

export interface DayPass {
  id: string;
  gymId: string;
  gymName: string;
  purchaseDate: Date;
  validDate: Date;
  price: number;
  status: "active" | "used" | "expired";
  qrCode?: string;
}
