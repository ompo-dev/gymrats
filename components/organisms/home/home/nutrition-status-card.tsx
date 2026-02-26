"use client";

import { ArrowRight, Droplets, Plus, UtensilsCrossed } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { DuoButton } from "@/components/duo";
import { DuoCard, DuoCardHeader } from "@/components/duo";
import { useStudent } from "@/hooks/use-student";
import { cn } from "@/lib/utils";
import type { DailyNutrition } from "@/lib/types";
import { hasActivePremiumStatus } from "@/lib/utils/subscription-helpers";

interface NutritionStatusCardProps {
  dailyNutrition: DailyNutrition | null | undefined;
}

export function NutritionStatusCard({
  dailyNutrition,
}: NutritionStatusCardProps) {
  const router = useRouter();

  // Verificar se é premium/trial
  const subscription = useStudent("subscription");
  const isPremium = useMemo(() => {
    if (!subscription || !subscription.plan || !subscription.status)
      return false;
    return hasActivePremiumStatus(
      subscription as {
        plan: string;
        status: string;
        trialEnd?: Date | string | null;
      },
    );
  }, [subscription]);

  // Handler para navegação: se premium, abre chat; senão, redireciona para dieta
  const handleNavigate = () => {
    if (isPremium) {
      // Premium: abrir chat diretamente
      router.push("/student?tab=diet&modal=food-search");
    } else {
      // Não premium: redirecionar para página de dieta (comportamento original)
      router.push("/student?tab=diet");
    }
  };

  // Se não houver dailyNutrition, mostrar empty state
  if (!dailyNutrition) {
    return (
      <DuoCard variant="default" padding="md">
        <DuoCardHeader>
          <div className="flex items-center gap-2">
            <UtensilsCrossed
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-[var(--duo-fg)]">Nutrição de Hoje</h2>
          </div>
        </DuoCardHeader>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring" }}
          className="flex flex-col items-center justify-center space-y-4 py-6 text-center"
        >
          <UtensilsCrossed className="h-10 w-10 text-duo-green" />
          <p className="text-base font-bold text-gray-900">
            Comece a registrar!
          </p>
          <p className="text-sm text-gray-600">
            Registre suas refeições e hidratação para acompanhar seu progresso.
          </p>
          <DuoButton
            onClick={handleNavigate}
            variant="primary"
            className="w-fit"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isPremium ? "Abrir Chat IA" : "Ir para Nutrição"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </DuoButton>
        </motion.div>
      </DuoCard>
    );
  }

  const hasMeals = dailyNutrition.meals.length > 0;
  const hasWater = dailyNutrition.waterIntake > 0;
  const completedMeals = dailyNutrition.meals.filter((m) => m.completed).length;
  const totalMeals = dailyNutrition.meals.length;
  const caloriesProgress = Math.round(
    (dailyNutrition.totalCalories / dailyNutrition.targetCalories) * 100,
  );
  const waterProgress = Math.round(
    (dailyNutrition.waterIntake / dailyNutrition.targetWater) * 100,
  );

  // Se não tem nada registrado
  if (!hasMeals && !hasWater) {
    return (
      <DuoCard variant="default" padding="md">
        <DuoCardHeader>
          <div className="flex items-center gap-2">
            <UtensilsCrossed
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-[var(--duo-fg)]">Nutrição de Hoje</h2>
          </div>
        </DuoCardHeader>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring" }}
          className="flex flex-col items-center justify-center space-y-4 py-6 text-center"
        >
          <UtensilsCrossed className="h-10 w-10 text-duo-green" />
          <p className="text-base font-bold text-gray-900">
            Comece a registrar!
          </p>
          <p className="text-sm text-gray-600">
            Registre suas refeições e hidratação para acompanhar seu progresso.
          </p>
          <DuoButton
            onClick={handleNavigate}
            variant="primary"
            className="w-fit"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isPremium ? "Abrir Chat IA" : "Ir para Nutrição"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </DuoButton>
        </motion.div>
      </DuoCard>
    );
  }

  // Se tem dados, mostrar status rápido
  return (
    <DuoCard variant="default" padding="md">
      <DuoCardHeader>
        <div className="flex items-center gap-2">
          <UtensilsCrossed
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--duo-secondary)" }}
            aria-hidden
          />
          <h2 className="font-bold text-[var(--duo-fg)]">Nutrição de Hoje</h2>
        </div>
      </DuoCardHeader>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring" }}
        className="space-y-3"
      >
        {/* Status de Refeições */}
        <DuoCard
          variant="default"
          size="sm"
          className={cn(
            "flex items-center justify-between gap-3",
            !hasMeals && "cursor-default hover:scale-100",
          )}
          onClick={hasMeals ? handleNavigate : undefined}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-duo-green/10">
              <UtensilsCrossed className="h-5 w-5 text-duo-green" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--duo-fg)]">
                {completedMeals}/{totalMeals} refeições
              </p>
              <p className="text-xs text-[var(--duo-fg-muted)]">
                {caloriesProgress}% da meta calórica
              </p>
            </div>
          </div>
          {hasMeals && (
            <DuoButton
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate();
              }}
              variant="white"
              size="sm"
              className="shrink-0"
            >
              {isPremium ? "Chat" : "Ver"}
            </DuoButton>
          )}
        </DuoCard>

        {/* Status de Hidratação */}
        <DuoCard
          variant="default"
          size="sm"
          className={cn(
            "flex items-center justify-between gap-3",
            !hasWater && "cursor-default hover:scale-100",
          )}
          onClick={hasWater ? handleNavigate : undefined}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-duo-blue/10">
              <Droplets className="h-5 w-5 text-duo-blue" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--duo-fg)]">
                {dailyNutrition.waterIntake}ml
              </p>
              <p className="text-xs text-[var(--duo-fg-muted)]">
                {waterProgress}% da meta diária
              </p>
            </div>
          </div>
          {hasWater && (
            <DuoButton
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate();
              }}
              variant="white"
              size="sm"
              className="shrink-0"
            >
              {isPremium ? "Chat" : "Ver"}
            </DuoButton>
          )}
        </DuoCard>

        {/* CTA para adicionar mais */}
        <DuoButton
          onClick={handleNavigate}
          variant="primary"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isPremium ? "IA de Nutrição" : "Adicionar Refeição ou Água"}
        </DuoButton>
      </motion.div>
    </DuoCard>
  );
}
