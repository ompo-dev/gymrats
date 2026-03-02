"use client";

import { Sparkles } from "lucide-react";
import { DuoButton, DuoCard } from "@/components/duo";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "../subscription-section";
import { BillingPeriodSelector } from "./billing-period-selector";
import { PlanCard } from "./plan-card";
import { PlanFeatures } from "./plan-features";

interface PlansSelectorProps {
  userType: "student" | "gym";
  plans: SubscriptionPlan[];
  selectedPlan: string;
  onSelectPlan: (planId: string) => void;
  selectedBillingPeriod: "monthly" | "annual";
  onSelectBillingPeriod: (period: "monthly" | "annual") => void;
  isPremiumActive: boolean;
  isTrialActive: boolean;
  annualDiscount: number;
  currentSubscriptionPlan?: string;
  currentSubscriptionBillingPeriod?: "monthly" | "annual";
  texts: {
    upgradeTitle: string;
    choosePlanTitle: string;
    subscribeButton: string;
    monthlyLabel: string;
    annualLabel: string;
    perMonth: string;
    perYear: string;
  };
  isLoading: boolean;
  onSubscribe: () => void;
}

function PlansSelectorSimple({
  userType,
  plans,
  selectedPlan,
  onSelectPlan,
  selectedBillingPeriod,
  onSelectBillingPeriod,
  isPremiumActive,
  isTrialActive,
  annualDiscount,
  currentSubscriptionPlan,
  currentSubscriptionBillingPeriod,
  texts,
  isLoading,
  onSubscribe,
}: PlansSelectorProps) {
  const selectedPlanData = plans.find((p) => p.id === selectedPlan) || plans[0];

  // Debug: Log dos valores recebidos
  if (
    process.env.NODE_ENV === "development" &&
    userType === "gym" &&
    isPremiumActive
  ) {
    console.log("[PlansSelector] Props recebidos:", {
      currentSubscriptionPlan,
      currentSubscriptionBillingPeriod,
      selectedBillingPeriod,
      isPremiumActive,
      plans: plans.map((p) => ({ id: p.id, name: p.name })),
    });
  }

  // Calcular desconto anual baseado no plano
  const getAnnualDiscount = (planId: string): number => {
    const discounts: Record<string, number> = {
      basic: 5,
      premium: 10,
      enterprise: 15,
    };
    return discounts[planId] || 10;
  };

  const planDiscount = selectedPlanData
    ? getAnnualDiscount(selectedPlanData.id)
    : annualDiscount;

  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <Sparkles
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--duo-secondary)" }}
            aria-hidden
          />
          <h2 className="font-bold text-[var(--duo-fg)]">
            {userType === "student" &&
            isPremiumActive &&
            currentSubscriptionBillingPeriod === "monthly"
              ? "Mudar para Plano Anual"
              : isTrialActive
                ? texts.upgradeTitle
                : texts.choosePlanTitle}
          </h2>
        </div>
      </DuoCard.Header>
      <div className="space-y-4">
        {/* Para student com subscription ativa mensal: mostrar apenas opção anual */}
        {userType === "student" && isPremiumActive && (
          <div className="mb-4 p-4 bg-duo-blue/10 rounded-xl border-2 border-duo-blue/20">
            <p className="text-sm text-duo-text mb-2">
              Você está no plano mensal. Mude para o plano anual e economize!
            </p>
          </div>
        )}

        {/* Billing Period Selector - Ocultar para student com subscription ativa mensal */}
        {!(userType === "student" && isPremiumActive) && (
          <BillingPeriodSelector.Simple
            selectedPeriod={selectedBillingPeriod}
            onSelect={onSelectBillingPeriod}
            monthlyLabel={texts.monthlyLabel}
            annualLabel={texts.annualLabel}
            perMonth={texts.perMonth}
            perYear={texts.perYear}
            annualDiscount={planDiscount}
          />
        )}

        {/* Plan Cards */}
        {plans.length > 0 && (
          <div
            className={cn(
              "grid gap-3",
              userType === "student" && isPremiumActive
                ? "grid-cols-1"
                : userType === "gym" && plans.length === 3
                  ? "grid-cols-2"
                  : plans.length === 1
                    ? "grid-cols-1"
                    : "grid-cols-3",
            )}
          >
            {plans
              .filter((plan) => {
                // Para student com subscription ativa
                if (userType === "student" && isPremiumActive) {
                  // Só o plano premium é relevante
                  if (plan.id !== "premium") return false;

                  // Se está no anual, não mostra nada (sem downgrade)
                  if (currentSubscriptionBillingPeriod === "annual") {
                    return false;
                  }

                  // Se está no mensal, só mostra se o período selecionado for anual (upgrade)
                  if (currentSubscriptionBillingPeriod === "monthly") {
                    return selectedBillingPeriod === "annual";
                  }

                  // Não permitir re-assinar o mesmo plano+período
                  return (
                    selectedBillingPeriod !== currentSubscriptionBillingPeriod
                  );
                }

                // Para gym com subscription ativa: filtrar baseado na hierarquia e período
                if (
                  userType === "gym" &&
                  isPremiumActive &&
                  currentSubscriptionPlan
                ) {
                  const planId = String(plan.id || "")
                    .trim()
                    .toLowerCase();
                  const currentPlan = String(currentSubscriptionPlan || "")
                    .trim()
                    .toLowerCase();
                  const isSamePlan = planId === currentPlan;
                  const isSamePeriod =
                    selectedBillingPeriod === currentSubscriptionBillingPeriod;

                  // Mesmo plano + mesmo período = não mostrar
                  if (isSamePlan && isSamePeriod) {
                    return false;
                  }

                  // Sem downgrade na hierarquia
                  const planHierarchy = ["basic", "premium", "enterprise"];
                  const currentPlanIndex = planHierarchy.indexOf(currentPlan);
                  const selectedPlanIndex = planHierarchy.indexOf(planId);

                  if (selectedPlanIndex < currentPlanIndex) {
                    return false;
                  }

                  // Mesmo plano mudando período: permitir upgrade de período
                  if (isSamePlan && !isSamePeriod) {
                    return true;
                  }

                  return true;
                }

                return true;
              })
              .map((plan) => (
                <PlanCard.Simple
                  key={plan.id}
                  plan={plan}
                  isSelected={selectedPlan === plan.id}
                  onSelect={() => onSelectPlan(plan.id)}
                  billingPeriod={selectedBillingPeriod}
                  userType={userType}
                  plansCount={plans.length}
                  texts={{ perMonth: texts.perMonth }}
                />
              ))}
          </div>
        )}

        {/* Features List */}
        {selectedPlanData && (
          <>
            <PlanFeatures features={selectedPlanData.features} />

            {/* Subscribe Button */}
            <DuoButton
              onClick={onSubscribe}
              disabled={isLoading}
              variant="primary"
              className="w-full mt-4"
              size="lg"
            >
              {isLoading
                ? "Processando..."
                : userType === "student" && isPremiumActive
                  ? "Mudar para Plano Anual"
                  : texts.subscribeButton}
            </DuoButton>
          </>
        )}
      </div>
    </DuoCard.Root>
  );
}

export const PlansSelector = { Simple: PlansSelectorSimple };
