"use client";

import {
  Activity,
  ArrowRight,
  Flame,
  Target,
  TrendingDown,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { type ComponentProps, useState } from "react";
import { DuoButton, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import { FinancialOverviewTab } from "@/components/organisms/gym/financial/financial-overview-tab";
import { GymEquipmentPage } from "@/components/organisms/gym/gym-equipment";
import {
  DietTab,
  OverviewTab,
  PaymentsTab,
  ProgressTab,
  RecordsTab,
  StudentHeaderCard,
  StudentTabSelector,
  WorkoutsTab,
} from "@/components/organisms/gym/gym-student-detail/components";
import type { StudentDetailTab } from "@/components/organisms/gym/gym-student-detail/hooks/use-gym-student-detail";
import type {
  DailyNutrition,
  Equipment,
  StudentData,
  WeeklyPlanData,
} from "@/lib/types";

type FinancialOverviewTabProps = ComponentProps<typeof FinancialOverviewTab>;

// --- Mocks (dados para exibir os componentes reais na landing) ---

const MOCK_STUDENT_DATA: StudentData = {
  id: "std-1",
  name: "João da Silva",
  email: "joao@exemplo.com",
  avatar: "/placeholder.svg",
  age: 25,
  gender: "Masculino",
  phone: "11999999999",
  membershipStatus: "active",
  joinDate: new Date("2025-01-15"),
  lastVisit: new Date(),
  totalVisits: 45,
  currentStreak: 15,
  profile: {
    id: "profile-1",
    name: "João da Silva",
    age: 25,
    gender: "male" as const,
    height: 178,
    weight: 82.1,
    fitnessLevel: "intermediario" as const,
    weeklyWorkoutFrequency: 4,
    workoutDuration: 60,
    goals: ["ganhar-massa", "forca"],
    availableEquipment: [],
    gymType: "academia-completa",
    preferredWorkoutTime: "tarde",
    preferredSets: 4,
    preferredRepRange: "hipertrofia",
    restTime: "medio",
  },
  progress: {
    currentStreak: 15,
    longestStreak: 22,
    totalXP: 12500,
    currentLevel: 12,
    xpToNextLevel: 800,
    workoutsCompleted: 89,
    achievements: [],
    lastActivityDate: new Date().toISOString(),
    dailyGoalXP: 100,
    weeklyXP: [100, 120, 80, 100, 0, 0, 0],
    todayXP: 45,
  },
  workoutHistory: [
    {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      workoutId: "w1",
      workoutName: "Peito e Tríceps",
      duration: 42,
      totalVolume: 3200,
      exercises: [],
      overallFeedback: "bom",
      bodyPartsFatigued: ["peito", "bracos"],
    },
    {
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      workoutId: "w2",
      workoutName: "Pernas",
      duration: 55,
      totalVolume: 5100,
      exercises: [],
      overallFeedback: "excelente",
      bodyPartsFatigued: ["pernas", "gluteos"],
    },
  ],
  personalRecords: [
    {
      exerciseId: "e1",
      exerciseName: "Supino Reto",
      type: "max-weight",
      value: 100,
      date: new Date(),
    },
    {
      exerciseId: "e2",
      exerciseName: "Agachamento",
      type: "max-weight",
      value: 140,
      date: new Date(),
    },
  ],
  currentWeight: 82.1,
  weightHistory: [
    { date: new Date("2026-02-01"), weight: 85 },
    { date: new Date("2026-02-15"), weight: 83.5 },
    { date: new Date("2026-02-28"), weight: 82.1 },
  ],
  weightGain: -2.9,
  hasWeightLossGoal: true,
  attendanceRate: 85,
  favoriteEquipment: ["Leg Press", "Supino Reto", "Cadeira Extensora"],
  gymMembership: {
    id: "gm-1",
    gymId: "gym-1",
    gymName: "GymRats Demo",
    gymAddress: "Av. Exemplo, 1000",
    planId: "plan-basic",
    planName: "Plano Basic",
    planType: "monthly",
    startDate: new Date("2025-01-15"),
    nextBillingDate: new Date("2026-03-15"),
    amount: 149.9,
    status: "active",
    autoRenew: true,
    benefits: ["Acesso ilimitado", "Avaliação física"],
  },
};

const MOCK_FINANCIAL_SUMMARY: FinancialOverviewTabProps["financialSummary"] = {
  totalRevenue: 42850,
  revenueGrowth: 15,
  totalExpenses: 12400,
  netProfit: 30450,
  monthlyRecurring: 38200,
  averageTicket: 120,
  churnRate: 2,
  pendingPayments: 2500,
  overduePayments: 1200,
};

const MOCK_EQUIPMENT: Equipment[] = [
  {
    id: "eq1",
    name: "Leg Press 45º",
    type: "strength",
    brand: "Technogym",
    model: "Pure Strength",
    serialNumber: "SN-001",
    status: "available",
    usageStats: { totalUses: 450, avgUsageTime: 12, popularTimes: [] },
    maintenanceHistory: [],
  },
  {
    id: "eq2",
    name: "Cadeira Extensora",
    type: "strength",
    brand: "Technogym",
    model: "Selection 700",
    serialNumber: "SN-002",
    status: "in-use",
    currentUser: {
      studentId: "s1",
      studentName: "Marcos Lima",
      startTime: new Date(Date.now() - 1000 * 60 * 15),
    },
    usageStats: { totalUses: 620, avgUsageTime: 10, popularTimes: [] },
    maintenanceHistory: [],
  },
  {
    id: "eq3",
    name: "Peck Deck",
    type: "strength",
    brand: "Technogym",
    model: "Element",
    serialNumber: "SN-003",
    status: "maintenance",
    usageStats: { totalUses: 380, avgUsageTime: 15, popularTimes: [] },
    maintenanceHistory: [],
  },
];

const MOCK_PAYMENTS: NonNullable<FinancialOverviewTabProps["payments"]> = [
  {
    id: "p1",
    studentId: "s1",
    studentName: "João",
    planId: "plan-basic",
    planName: "Basic",
    amount: 150,
    date: new Date(),
    dueDate: new Date(),
    status: "paid" as const,
    paymentMethod: "pix" as const,
  },
  {
    id: "p2",
    studentId: "s1",
    studentName: "João",
    planId: "plan-basic",
    planName: "Basic",
    amount: 149.9,
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: "pending" as const,
    paymentMethod: "pix" as const,
  },
];

const MOCK_WEEKLY_PLAN: WeeklyPlanData = {
  id: "plan-1",
  title: "Plano Semanal Foco Hipertrofia",
  description: "4x na semana",
  slots: [
    {
      id: "slot-0",
      dayOfWeek: 0,
      type: "workout",
      locked: false,
      completed: true,
      workout: {
        id: "w1",
        title: "Peito e Tríceps",
        description: "Foco em supino e variações",
        type: "strength",
        muscleGroup: "peito",
        difficulty: "intermediario",
        exercises: [
          {
            id: "ex1",
            name: "Supino Reto",
            sets: 4,
            reps: "8-10",
            rest: 90,
            notes: "",
          },
          {
            id: "ex2",
            name: "Supino Inclinado",
            sets: 3,
            reps: "10",
            rest: 60,
            notes: "",
          },
          {
            id: "ex3",
            name: "Tríceps Pulley",
            sets: 3,
            reps: "12",
            rest: 45,
            notes: "",
          },
        ],
        xpReward: 150,
        estimatedTime: 45,
        locked: false,
        completed: true,
      },
    },
    {
      id: "slot-1",
      dayOfWeek: 1,
      type: "workout",
      locked: false,
      completed: false,
      workout: {
        id: "w2",
        title: "Costas e Bíceps",
        description: "Puxadas e roscas",
        type: "strength",
        muscleGroup: "costas",
        difficulty: "intermediario",
        exercises: [
          {
            id: "ex4",
            name: "Barra Fixa",
            sets: 4,
            reps: "8",
            rest: 90,
            notes: "",
          },
          {
            id: "ex5",
            name: "Remada Curvada",
            sets: 3,
            reps: "10",
            rest: 60,
            notes: "",
          },
        ],
        xpReward: 120,
        estimatedTime: 40,
        locked: false,
        completed: false,
      },
    },
    {
      id: "slot-2",
      dayOfWeek: 2,
      type: "rest",
      locked: false,
      completed: false,
    },
    {
      id: "slot-3",
      dayOfWeek: 3,
      type: "workout",
      locked: false,
      completed: false,
      workout: {
        id: "w3",
        title: "Pernas",
        description: "Quadríceps e posterior",
        type: "strength",
        muscleGroup: "pernas",
        difficulty: "intermediario",
        exercises: [
          {
            id: "ex6",
            name: "Agachamento Livre",
            sets: 4,
            reps: "8-10",
            rest: 120,
            notes: "",
          },
          {
            id: "ex7",
            name: "Leg Press",
            sets: 3,
            reps: "12",
            rest: 90,
            notes: "",
          },
        ],
        xpReward: 180,
        estimatedTime: 50,
        locked: false,
        completed: false,
      },
    },
  ],
};

const MOCK_DAILY_NUTRITION: DailyNutrition = {
  date: new Date().toISOString().slice(0, 10),
  targetCalories: 2500,
  totalCalories: 1850,
  targetProtein: 180,
  totalProtein: 142,
  targetCarbs: 250,
  totalCarbs: 188,
  targetFats: 70,
  totalFats: 54,
  waterIntake: 2000,
  targetWater: 3000,
  meals: [
    {
      id: "m1",
      name: "Café da Manhã",
      time: "08:00",
      type: "breakfast",
      calories: 480,
      protein: 28,
      carbs: 52,
      fats: 18,
      completed: true,
      foods: [
        {
          id: "f1",
          foodId: "fd1",
          foodName: "Ovos mexidos",
          servings: 1,
          calories: 180,
          protein: 14,
          carbs: 2,
          fats: 12,
          servingSize: "100g",
        },
        {
          id: "f2",
          foodId: "fd2",
          foodName: "Pão integral",
          servings: 1,
          calories: 140,
          protein: 5,
          carbs: 26,
          fats: 2,
          servingSize: "50g",
        },
        {
          id: "f3",
          foodId: "fd3",
          foodName: "Banana",
          servings: 1,
          calories: 130,
          protein: 1,
          carbs: 22,
          fats: 1,
          servingSize: "1 un",
        },
      ],
    },
    {
      id: "m2",
      name: "Almoço",
      time: "12:30",
      type: "lunch",
      calories: 720,
      protein: 58,
      carbs: 78,
      fats: 18,
      completed: true,
      foods: [
        {
          id: "f4",
          foodId: "fd4",
          foodName: "Frango grelhado",
          servings: 1,
          calories: 250,
          protein: 35,
          carbs: 0,
          fats: 10,
          servingSize: "150g",
        },
        {
          id: "f5",
          foodId: "fd5",
          foodName: "Arroz e feijão",
          servings: 1,
          calories: 350,
          protein: 12,
          carbs: 68,
          fats: 2,
          servingSize: "1 porção",
        },
        {
          id: "f6",
          foodId: "fd6",
          foodName: "Salada",
          servings: 1,
          calories: 80,
          protein: 3,
          carbs: 10,
          fats: 4,
          servingSize: "porção",
        },
      ],
    },
    {
      id: "m3",
      name: "Lanche da Tarde",
      time: "16:00",
      type: "snack",
      calories: 350,
      protein: 18,
      carbs: 42,
      fats: 12,
      completed: false,
      foods: [
        {
          id: "f7",
          foodId: "fd7",
          foodName: "Whey + aveia",
          servings: 1,
          calories: 350,
          protein: 18,
          carbs: 42,
          fats: 12,
          servingSize: "1 dose",
        },
      ],
    },
  ],
};

const TAB_OPTIONS = [
  { value: "overview", label: "Visão Geral", emoji: "📊" },
  { value: "workouts", label: "Treinos", emoji: "💪" },
  { value: "diet", label: "Dieta", emoji: "🍎" },
  { value: "progress", label: "Progresso", emoji: "📈" },
  { value: "records", label: "Recordes", emoji: "🏆" },
  { value: "payments", label: "Pagamentos", emoji: "💳" },
];

export function GymLandingPage() {
  const [activeTab, setActiveTab] = useState<StudentDetailTab>("overview");
  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20"
    >
      {/* Hero */}
      <section className="relative overflow-hidden py-10 sm:py-12 md:py-14 lg:py-16">
        <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-[var(--duo-primary)]/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-[var(--duo-secondary)]/5 blur-[100px]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-1"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--duo-secondary)]/20 bg-[var(--duo-secondary)]/10 px-4 py-1.5 text-xs font-black leading-none text-[var(--duo-secondary)] shadow-sm">
                <Zap className="h-3.5 w-3.5" />
                <span>GESTÃO COMPLETA PARA ACADEMIAS</span>
              </div>
              <h1 className="mt-4 sm:mt-6 text-4xl font-black leading-[1.1] text-[var(--duo-fg)] sm:text-5xl md:text-6xl lg:text-7xl">
                Sua academia
                <br />
                <span className="text-[var(--duo-secondary)]">
                  merece mais que uma planilha.
                </span>
              </h1>
              <p className="mt-4 sm:mt-6 text-base font-medium text-[var(--duo-fg-muted)] sm:text-lg md:text-xl md:leading-relaxed">
                Você cuida dos alunos. O GymRats cuida do resto. Financeiro,
                equipamentos e engajamento tudo em um lugar só, para sua equipe
                focar no que importa.
              </p>
              <div className="mt-8 sm:mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/welcome" className="w-full sm:w-fit">
                  <DuoButton
                    variant="secondary"
                    size="lg"
                    className="w-full gap-2 px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg shadow-xl uppercase font-black"
                  >
                    Quero ver na prática <ArrowRight className="h-5 w-5" />
                  </DuoButton>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative order-2 flex flex-col items-center lg:block"
            >
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <h3 className="font-black text-xs uppercase text-[var(--duo-fg-muted)]">
                    Resumo Financeiro
                  </h3>
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--duo-secondary)]" />
                </div>
                <FinancialOverviewTab
                  financialSummary={MOCK_FINANCIAL_SUMMARY}
                  balanceReais={2450.75}
                  balanceCents={245075}
                  payments={MOCK_PAYMENTS}
                  disableWithdraw
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Perfil do Aluno */}
      <section className=" py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-8">
          <div className="mb-10 sm:mb-12 text-center">
            <h2 className="text-3xl font-black text-[var(--duo-fg)] sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter">
              Conheça cada aluno de verdade
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg font-bold text-[var(--duo-fg-muted)] uppercase tracking-widest opacity-60">
              Histórico, evolução e frequência na palma da sua mão.
            </p>
          </div>
          <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
            <StudentHeaderCard
              student={MOCK_STUDENT_DATA}
              membershipStatus="active"
              isUpdatingStatus={false}
              onMembershipAction={() => {}}
            />
            <DuoStatsGrid.Root columns={4} className="gap-3 sm:gap-4">
              <DuoStatCard.Simple
                icon={Flame}
                value={String(MOCK_STUDENT_DATA.currentStreak)}
                label="Sequência"
                iconColor="var(--duo-accent)"
              />
              <DuoStatCard.Simple
                icon={Target}
                value={String(MOCK_STUDENT_DATA.progress?.currentLevel ?? 1)}
                label="Nível"
                iconColor="var(--duo-secondary)"
              />
              <DuoStatCard.Simple
                icon={Activity}
                value={String(MOCK_STUDENT_DATA.totalVisits)}
                label="Treinos"
                iconColor="var(--duo-primary)"
              />
              <DuoStatCard.Simple
                icon={Target}
                value={`${MOCK_STUDENT_DATA.attendanceRate}%`}
                label="Presença"
                iconColor="var(--duo-green)"
              />
            </DuoStatsGrid.Root>

            <StudentTabSelector
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabOptions={TAB_OPTIONS}
            />

            {activeTab === "overview" && (
              <OverviewTab student={MOCK_STUDENT_DATA} />
            )}
            {activeTab === "workouts" && (
              <WorkoutsTab
                student={MOCK_STUDENT_DATA}
                weeklyPlan={MOCK_WEEKLY_PLAN}
                isLoadingWeeklyPlan={false}
              />
            )}
            {activeTab === "diet" && (
              <DietTab
                student={MOCK_STUDENT_DATA}
                dailyNutrition={MOCK_DAILY_NUTRITION}
                nutritionDate={new Date().toISOString().slice(0, 10)}
                isCurrentDate
                isLoadingNutrition={false}
                onNutritionDateChange={() => {}}
                onFetchNutrition={() => {}}
                onMealComplete={() => {}}
                onAddMeal={async () => {}}
                onAddFood={async () => {}}
                onApplyNutrition={async () => {}}
                onUpdateTargetWater={async () => {}}
                onRemoveMeal={async () => {}}
                onRemoveFood={async () => {}}
                onToggleWaterGlass={async () => {}}
                onOpenLibrary={() => {}}
              />
            )}
            {activeTab === "progress" && (
              <ProgressTab student={MOCK_STUDENT_DATA} />
            )}
            {activeTab === "records" && (
              <RecordsTab student={MOCK_STUDENT_DATA} />
            )}
            {activeTab === "payments" && (
              <PaymentsTab
                payments={MOCK_PAYMENTS}
                onSettlePayment={async () => {}}
              />
            )}
          </div>
        </div>
      </section>

      {/* Gestão de Equipamentos */}
      <section
        id="equipment"
        className=" py-10 sm:py-12 md:py-16 lg:py-18 bg-[var(--duo-bg)]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-8">
          <div className="mb-10 sm:mb-12 text-center">
            <h2 className="text-3xl font-black text-[var(--duo-fg)] sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter">
              Equipamento parado é dinheiro perdido
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg font-bold text-[var(--duo-fg-muted)] uppercase tracking-widest opacity-60">
              Saiba o que está em uso, em manutenção e o que precisa de atenção
              agora.
            </p>
          </div>
          <GymEquipmentPage equipment={MOCK_EQUIPMENT} />
        </div>
      </section>
    </motion.main>
  );
}
