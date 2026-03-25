"use client";

import { Activity, ArrowRight, Layout, Zap } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { type ComponentProps, useCallback, useState } from "react";
import { StaggerContainer } from "@/components/animations/stagger-container";
import { StaggerItem } from "@/components/animations/stagger-item";
import { DuoButton } from "@/components/duo";
import { WeightProgressCard } from "@/components/organisms/home/home/weight-progress-card";
import { WeeklyPlanSlotRow } from "@/components/organisms/modals/edit-unit-modal/weekly-plan-slot-row";
import { NutritionTracker } from "@/components/organisms/trackers/nutrition-tracker";
import { WorkoutNode } from "@/components/organisms/workout/workout-node";
import type { DailyNutrition } from "@/lib/types";

type WeeklyPlanSlotRowSlot = ComponentProps<typeof WeeklyPlanSlotRow>["slot"];
type WorkoutNodeSimpleWorkout = NonNullable<
  ComponentProps<typeof WorkoutNode.Simple>["workout"]
>;
type WorkoutNodeSimpleExercise = WorkoutNodeSimpleWorkout["exercises"][number];
type NutritionTrackerSimpleNutrition = ComponentProps<
  typeof NutritionTracker.Simple
>["nutrition"];

const createMockExercise = (
  id: string,
  name: string,
): WorkoutNodeSimpleExercise => ({
  id,
  name,
  sets: 3,
  reps: "10-12",
  rest: 60,
});

const MOCK_STUDENT_DATA = {
  id: "std-1",
  name: "João da Silva",
  email: "joao@exemplo.com",
  currentWeight: 82.1,
  weightGain: -2.9,
  weightHistory: [
    { date: "2026-02-01", weight: 85.0 },
    { date: "2026-02-08", weight: 84.2 },
    { date: "2026-02-15", weight: 83.5 },
    { date: "2026-02-22", weight: 82.8 },
    { date: "2026-02-28", weight: 82.1 },
  ],
  currentStreak: 15,
  progress: { currentLevel: 12 },
  joinDate: new Date(),
  membershipStatus: "active" as const,
  totalVisits: 45,
  attendanceRate: 85,
  age: 25,
  gender: "Masculino",
  phone: "11999999999",
};

const MOCK_PLAN_SLOTS: WeeklyPlanSlotRowSlot[] = [
  {
    id: "s1",
    dayOfWeek: 0,
    type: "workout" as const,
    locked: false,
    completed: true,
    workout: {
      id: "w1",
      title: "Peito e Tríceps",
      exercises: [{}, {}, {}, {}, {}, {}],
    } as WorkoutNodeSimpleWorkout,
  },
  {
    id: "s2",
    dayOfWeek: 1,
    type: "workout" as const,
    locked: false,
    completed: false,
    workout: {
      id: "w2",
      title: "Costas e Bíceps",
      exercises: [{}, {}, {}, {}, {}, {}, {}],
    } as WorkoutNodeSimpleWorkout,
  },
  {
    id: "s3",
    dayOfWeek: 2,
    type: "rest" as const,
    locked: false,
    completed: false,
  },
  {
    id: "s4",
    dayOfWeek: 3,
    type: "workout" as const,
    locked: false,
    completed: false,
    workout: {
      id: "w3",
      title: "Pernas e Core",
      exercises: [{}, {}, {}, {}, {}, {}, {}, {}],
    } as WorkoutNodeSimpleWorkout,
  },
];

const MOCK_NUTRITION = {
  id: "mock-1",
  userId: "user-1",
  date: new Date().toISOString(),
  targetCalories: 2500,
  totalCalories: 1850,
  targetProtein: 180,
  totalProtein: 140,
  targetCarbs: 250,
  totalCarbs: 190,
  targetFats: 70,
  totalFats: 55,
  waterIntake: 1750,
  targetWater: 3000,
  meals: [
    {
      id: "meal-1",
      name: "Café da Manhã",
      time: "08:00",
      type: "breakfast" as const,
      calories: 450,
      protein: 30,
      carbs: 50,
      fats: 15,
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
      id: "meal-2",
      name: "Almoço",
      time: "12:30",
      type: "lunch" as const,
      calories: 750,
      protein: 55,
      carbs: 80,
      fats: 20,
      completed: false,
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
          foodName: "Arroz branco",
          servings: 1,
          calories: 280,
          protein: 5,
          carbs: 62,
          fats: 0.5,
          servingSize: "1 xíc",
        },
        {
          id: "f6",
          foodId: "fd6",
          foodName: "Salada",
          servings: 1,
          calories: 80,
          protein: 3,
          carbs: 12,
          fats: 4,
          servingSize: "porção",
        },
      ],
    },
  ],
};

const MOCK_WORKOUTS_PATH: Array<
  | { type: "rest" }
  | {
      type: "workout";
      mockProgressPercent?: number;
      workout: WorkoutNodeSimpleWorkout;
    }
> = [
  {
    type: "workout" as const,
    workout: {
      id: "pw1",
      description: "Tecnica base para ganhar confianca e consistencia.",
      muscleGroup: "peito",
      difficulty: "iniciante",
      title: "Iniciação ao Supino",
      exercises: [
        createMockExercise("pw1-e1", "Supino reto"),
        createMockExercise("pw1-e2", "Supino inclinado com halteres"),
        createMockExercise("pw1-e3", "Crucifixo na maquina"),
      ],
      estimatedTime: 30,
      xpReward: 120,
      completed: true,
      locked: false,
      type: "strength",
    },
  },
  {
    type: "workout" as const,
    mockProgressPercent: 75,
    workout: {
      id: "pw2",
      description: "Mobilidade, postura e forca para evoluir com seguranca.",
      muscleGroup: "pernas",
      difficulty: "intermediario",
      title: "Técnica de Agachamento",
      exercises: [
        createMockExercise("pw2-e1", "Agachamento livre"),
        createMockExercise("pw2-e2", "Leg press"),
        createMockExercise("pw2-e3", "Cadeira extensora"),
        createMockExercise("pw2-e4", "Mesa flexora"),
      ],
      estimatedTime: 40,
      xpReward: 160,
      completed: false,
      locked: false,
      type: "strength",
    },
  },
  { type: "rest" as const },
];

export function StudentLandingPage() {
  const [nutrition, setNutrition] = useState<DailyNutrition>(
    MOCK_NUTRITION as DailyNutrition,
  );

  const handleToggleWater = (index: number) => {
    setNutrition((prev) => ({
      ...prev,
      waterIntake:
        prev.waterIntake + (prev.waterIntake >= (index + 1) * 250 ? -250 : 250),
    }));
  };

  const recalcTotalsFromMeals = useCallback(
    (meals: DailyNutrition["meals"]) => {
      const completed = meals.filter((m) => m.completed);
      return {
        totalCalories: completed.reduce((s, m) => s + m.calories, 0),
        totalProtein: completed.reduce((s, m) => s + m.protein, 0),
        totalCarbs: completed.reduce((s, m) => s + m.carbs, 0),
        totalFats: completed.reduce((s, m) => s + m.fats, 0),
      };
    },
    [],
  );

  const handleToggleMeal = useCallback(
    (mealId: string) => {
      setNutrition((prev) => {
        const nextMeals = prev.meals.map((m) =>
          m.id === mealId ? { ...m, completed: !m.completed } : m,
        );
        const totals = recalcTotalsFromMeals(nextMeals);
        return { ...prev, meals: nextMeals, ...totals };
      });
    },
    [recalcTotalsFromMeals],
  );

  const handleAddMeal = useCallback(() => {
    const newId = `meal-${Date.now()}`;
    setNutrition((prev) => {
      const newMeal = {
        id: newId,
        name: "Nova refeição",
        time: "12:00",
        type: "snack" as const,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        completed: false,
        foods: [],
      };
      const nextMeals = [...prev.meals, newMeal];
      const totals = recalcTotalsFromMeals(nextMeals);
      return { ...prev, meals: nextMeals, ...totals };
    });
  }, [recalcTotalsFromMeals]);

  const handleDeleteMeal = useCallback(
    (mealId: string) => {
      setNutrition((prev) => {
        const nextMeals = prev.meals.filter((m) => m.id !== mealId);
        const totals = recalcTotalsFromMeals(nextMeals);
        return { ...prev, meals: nextMeals, ...totals };
      });
    },
    [recalcTotalsFromMeals],
  );

  const handleAddFoodToMeal = useCallback(
    (mealId: string) => {
      const placeholder = {
        id: `f-${Date.now()}`,
        foodId: "demo",
        foodName: "Alimento exemplo",
        servings: 1,
        calories: 100,
        protein: 8,
        carbs: 12,
        fats: 3,
        servingSize: "1 porção",
      };
      setNutrition((prev) => {
        const nextMeals = prev.meals.map((m) => {
          if (m.id !== mealId) return m;
          const newFoods = [...(m.foods || []), placeholder];
          return {
            ...m,
            foods: newFoods,
            calories: m.calories + placeholder.calories,
            protein: m.protein + placeholder.protein,
            carbs: m.carbs + placeholder.carbs,
            fats: m.fats + placeholder.fats,
          };
        });
        const totals = recalcTotalsFromMeals(nextMeals);
        return { ...prev, meals: nextMeals, ...totals };
      });
    },
    [recalcTotalsFromMeals],
  );

  const handleDeleteFood = useCallback(
    (mealId: string, foodId: string) => {
      setNutrition((prev) => {
        const nextMeals = prev.meals.map((m) => {
          if (m.id !== mealId || !m.foods?.length) return m;
          const food = m.foods.find((f) => f.id === foodId);
          if (!food) return m;
          const newFoods = m.foods.filter((f) => f.id !== foodId);
          return {
            ...m,
            foods: newFoods,
            calories: m.calories - food.calories,
            protein: m.protein - food.protein,
            carbs: m.carbs - food.carbs,
            fats: m.fats - food.fats,
          };
        });
        const totals = recalcTotalsFromMeals(nextMeals);
        return { ...prev, meals: nextMeals, ...totals };
      });
    },
    [recalcTotalsFromMeals],
  );

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="pt-20 sm:pt-24 md:pt-28"
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
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--duo-primary)]/20 bg-[var(--duo-primary)]/10 px-4 py-1.5 text-xs font-black leading-none text-[var(--duo-primary)]">
                <Zap className="h-3.5 w-3.5" />
                <span>SEU PERSONAL TRAINER INTELIGENTE</span>
              </div>
              <h1 className="mt-4 sm:mt-6 text-4xl font-black leading-[1.1] text-[var(--duo-fg)] sm:text-5xl md:text-6xl lg:text-7xl">
                Para de começar
                <br />
                <span className="bg-gradient-to-r from-[var(--duo-primary)] to-[var(--duo-secondary)] bg-clip-text text-transparent">
                  na segunda-feira.
                </span>
              </h1>
              <p className="mt-4 sm:mt-6 text-base font-medium text-[var(--duo-fg-muted)] sm:text-lg md:text-xl md:leading-relaxed">
                Você já tentou. Desistiu. Tentou de novo. O GymRats quebra esse
                ciclo com treinos guiados, metas inteligentes e a motivação que
                faltava pra você ir até o fim.
              </p>
              <div className="mt-8 sm:mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/welcome" className="w-full sm:w-fit">
                  <DuoButton
                    variant="primary"
                    size="lg"
                    className="w-full gap-2 px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg shadow-xl uppercase font-black"
                  >
                    Quero mudar agora <ArrowRight className="h-5 w-5" />
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
              <div className="relative mx-auto w-full overflow-hidden rounded-2xl bg-[var(--duo-bg)] lg:rounded-none">
                <div className="space-y-4 sm:space-y-6">
                  <WeightProgressCard.Simple
                    currentWeight={MOCK_STUDENT_DATA.currentWeight}
                    weightGain={MOCK_STUDENT_DATA.weightGain}
                    weightHistory={MOCK_STUDENT_DATA.weightHistory}
                  />
                  <div className="space-y-2">
                    {MOCK_PLAN_SLOTS.map((slot) => (
                      <WeeklyPlanSlotRow
                        key={slot.id}
                        slot={slot}
                        loadingSlotId={null}
                        onAddWorkout={() => {}}
                        onEditWorkout={() => {}}
                        onOpenChat={() => {}}
                        onRemoveWorkout={() => {}}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trilha de Evolução */}
      <section
        id="features"
        className="mt-12 sm:mt-16 md:mt-20 border-y border-[var(--duo-border)] bg-[var(--duo-bg-card)] py-16 sm:py-20 md:py-24 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-8">
          <div className="mb-12 sm:mb-16 md:mb-20 text-center">
            <h2 className="text-3xl font-black text-[var(--duo-fg)] sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter">
              Cada treino conta uma história
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg font-bold text-[var(--duo-fg-muted)] uppercase tracking-widest opacity-60">
              A sua. E ela está só começando.
            </p>
          </div>
          {/* Uma estrutura flex: mobile = 3 linhas (col), desktop = 2 colunas (row). Só "Do zero ao resultado" duplicado (mobile vs desktop). */}
          <div className="flex flex-col gap-12 sm:gap-16 md:flex-row md:gap-20 md:items-start">
            {/* "Do zero ao resultado" — cópia só para mobile (acima do workout) */}
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 md:hidden">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl bg-[var(--duo-primary)]/10 text-[var(--duo-primary)] flex items-center justify-center shrink-0 shadow-sm border border-[var(--duo-primary)]/20">
                <Layout className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">
                  Do zero ao resultado sem achismos
                </h3>
                <p className="text-base sm:text-lg md:text-xl font-medium text-[var(--duo-fg-muted)] leading-relaxed">
                  Nada de planilha genérica da internet. Seu plano é construído
                  pro seu corpo, seu tempo e sua meta. Você só precisa aparecer.
                </p>
              </div>
            </div>

            {/* Coluna esquerda no desktop: "Do zero ao resultado" + "Você vê o quanto evoluiu" (2 linhas) */}
            <div className="hidden md:flex flex-1 flex-col gap-6 lg:gap-8">
              {/* "Do zero ao resultado" — cópia só para desktop */}
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl bg-[var(--duo-primary)]/10 text-[var(--duo-primary)] flex items-center justify-center shrink-0 shadow-sm border border-[var(--duo-primary)]/20">
                  <Layout className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">
                    Do zero ao resultado sem achismos
                  </h3>
                  <p className="text-base sm:text-lg md:text-xl font-medium text-[var(--duo-fg-muted)] leading-relaxed">
                    Nada de planilha genérica da internet. Seu plano é
                    construído pro seu corpo, seu tempo e sua meta. Você só
                    precisa aparecer.
                  </p>
                </div>
              </div>
              {/* "Você vê o quanto evoluiu" — único, no desktop fica aqui */}
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl bg-[var(--duo-secondary)]/10 text-[var(--duo-secondary)] flex items-center justify-center shrink-0 shadow-sm border border-[var(--duo-secondary)]/20">
                  <Activity className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">
                    Você vê o quanto evoluiu
                  </h3>
                  <p className="text-base sm:text-lg md:text-xl font-medium text-[var(--duo-fg-muted)] leading-relaxed">
                    Cada kg a mais no supino. Cada semana na sequência. O
                    GymRats registra tudo para que você nunca duvide do seu
                    próprio progresso.
                  </p>
                </div>
              </div>
            </div>

            {/* Workout nodes — único, no mobile fica no meio; no desktop na coluna direita */}
            <div className="relative min-h-[480px] sm:min-h-[540px] md:min-h-[600px] w-full flex-shrink-0 overflow-hidden group md:max-w-[50%]">
              <div className="h-full overflow-y-auto no-scrollbar scroll-smooth p-4 sm:p-5">
                <StaggerContainer className="flex flex-col items-center space-y-16">
                  {MOCK_WORKOUTS_PATH.map((item, idx) => (
                    <StaggerItem
                      key={
                        item.type === "rest"
                          ? `rest-${idx}`
                          : `workout-${item.workout.id}`
                      }
                      className="w-full"
                    >
                      {item.type === "rest" ? (
                        <WorkoutNode.Simple
                          variant="rest"
                          position={idx % 2 === 0 ? "left" : "right"}
                        />
                      ) : (
                        (() => {
                          const workout = item.workout;
                          return (
                            <WorkoutNode.Simple
                              position={
                                idx % 2 === 0
                                  ? idx === 0
                                    ? "center"
                                    : "left"
                                  : "right"
                              }
                              workout={workout}
                              onClick={() => {}}
                              isFirst={idx === 0}
                              mockProgressPercent={item.mockProgressPercent}
                            />
                          );
                        })()
                      )}
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </div>

            {/* "Você vê o quanto evoluiu" — só no mobile (abaixo do workout) */}
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 md:hidden">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl bg-[var(--duo-secondary)]/10 text-[var(--duo-secondary)] flex items-center justify-center shrink-0 shadow-sm border border-[var(--duo-secondary)]/20">
                <Activity className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">
                  Você vê o quanto evoluiu
                </h3>
                <p className="text-base sm:text-lg md:text-xl font-medium text-[var(--duo-fg-muted)] leading-relaxed">
                  Cada kg a mais no supino. Cada semana na sequência. O GymRats
                  registra tudo para que você nunca duvide do seu próprio
                  progresso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nutrição */}
      <section className="pt-10 sm:pt-14 md:pt-16 lg:pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-8 pt-10">
          <div className="grid grid-cols-1 gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-20 lg:items-center">
            <div className="space-y-6 sm:space-y-8">
              <h2 className="mt-10 text-3xl font-black text-[var(--duo-fg)] sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter">
                Treino bom com{" "}
                <span className="text-[var(--duo-primary)]">dieta ruim</span>{" "}
                <br /> não chega a lugar nenhum.
              </h2>
              <p className="text-base sm:text-lg md:text-xl font-medium leading-relaxed text-[var(--duo-fg-muted)]">
                Você não precisa virar nutricionista. O GymRats traduz proteína,
                carboidrato e caloria em linguagem simples e te mostra
                exatamente o que comer para atingir sua meta, seja ganhar massa
                ou secar de vez.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-2">
                  <div className="h-1 w-12 rounded-full bg-[var(--duo-primary)]" />
                  <h4 className="font-black text-[var(--duo-fg)] uppercase tracking-tight">
                    Macros que fazem sentido
                  </h4>
                  <p className="text-sm font-bold text-[var(--duo-fg-muted)] opacity-80">
                    Calculados pro seu gasto real, não pra média de ninguém.
                  </p>
                </div>
              </div>
              <Link href="/welcome">
                <DuoButton
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-fit font-black uppercase tracking-wider shadow-2xl scale-105"
                >
                  Começar gratuitamente
                </DuoButton>
              </Link>
            </div>
            <div className="relative w-full min-w-0">
              <div className="p-4 sm:p-5 lg:p-6">
                <NutritionTracker.Simple
                  nutrition={nutrition as NutritionTrackerSimpleNutrition}
                  onMealComplete={handleToggleMeal}
                  onAddMeal={handleAddMeal}
                  onAddFoodToMeal={handleAddFoodToMeal}
                  onDeleteMeal={handleDeleteMeal}
                  onDeleteFood={handleDeleteFood}
                  onToggleWaterGlass={handleToggleWater}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.main>
  );
}
