"use client";

import { Sparkles } from "lucide-react";
import { DuoButton, DuoCard } from "@/components/duo";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "../subscription-section";
import { BillingPeriodSelector } from "./billing-period-selector";
import { PlanCard } from "./plan-card";
import { PlanFeatures } from "./plan-features";

interface PlansSelectorProps {
  userType: "student" | "gym" | "personal";
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
  const getAnnualDiscountFromPlan = (plan: SubscriptionPlan): number => {
    if (!plan.monthlyPrice || !plan.annualPrice) return 17;
    const fullPrice = plan.monthlyPrice * 12;
    const discount = (1 - plan.annualPrice / fullPrice) * 100;
    return Math.round(discount);
  };

  const planDiscount = selectedPlanData
    ? getAnnualDiscountFromPlan(selectedPlanData)
    : annualDiscount;

  const visiblePlans = plans.filter((plan) => {
    // Para student com subscription ativa
    if (userType === "student" && isPremiumActive) {
      const currentPlan = String(currentSubscriptionPlan || "")
        .trim()
        .toLowerCase();
      const isCurrentPro = currentPlan.includes("pro");
      const isPlanPro = plan.id === "pro";

      // Se for mudança de período no mesmo plano
      if ((isCurrentPro && isPlanPro) || (!isCurrentPro && !isPlanPro)) {
        // Só mostra se for para upgrade de mensal pra anual
        if (
          currentSubscriptionBillingPeriod === "monthly" &&
          selectedBillingPeriod === "annual"
        ) {
          return true;
        }
        return false;
      }

      // Upgrade de Premium para Pro
      if (!isCurrentPro && isPlanPro) {
        return true;
      }

      // Downgrade de Pro para Premium: não mostrar
      if (isCurrentPro && !isPlanPro) {
        return false;
      }

      return true;
    }

    // Para gym com subscription ativa: filtrar baseado na hierarquia e período
    if (userType === "gym" && isPremiumActive && currentSubscriptionPlan) {
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

      // Se for no mesmo plano, permitir apenas upgrade de período
      if (isSamePlan) {
        if (
          currentSubscriptionBillingPeriod === "monthly" &&
          selectedBillingPeriod === "annual"
        ) {
          return true;
        }
        return false; // Bloqueia annual -> monthly
      }

      // Upgrades de plano permitidos
      return true;
    }

    return true;
  });

  // Se o usuário já está no plano máximo anual, não há upgrades
  const hasNoUpgrades =
    isPremiumActive &&
    visiblePlans.length === 0 &&
    selectedBillingPeriod === "annual";

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
        {/* Banner para dar dica de upgrade, mas mais genérico */}
        {userType === "student" &&
          isPremiumActive &&
          currentSubscriptionBillingPeriod === "monthly" && (
            <div className="mb-4 p-4 bg-duo-blue/10 rounded-xl border-2 border-duo-blue/20">
              <p className="text-sm text-duo-text mb-2">
                Você está em um plano mensal. Faça upgrade ou mude para o plano
                anual e economize!
              </p>
            </div>
          )}

        {/* Mostrar sempre, exceto se for plano máximo e não tiver opções */}
        {!hasNoUpgrades && (
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
        {visiblePlans.length > 0 ? (
          <div
            className={cn(
              "grid gap-3",
              userType === "student" && isPremiumActive
                ? "grid-cols-1"
                : userType === "gym" && visiblePlans.length === 3
                  ? "grid-cols-2"
                  : visiblePlans.length === 1
                    ? "grid-cols-1"
                    : "grid-cols-3",
            )}
          >
            {visiblePlans.map((plan) => (
              <PlanCard.Simple
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan === plan.id}
                onSelect={() => onSelectPlan(plan.id)}
                billingPeriod={selectedBillingPeriod}
                userType={userType}
                plansCount={visiblePlans.length}
                texts={{ perMonth: texts.perMonth }}
              />
            ))}
          </div>
        ) : (
          isPremiumActive && (
            <div className="text-center py-6 text-duo-gray-dark border-2 border-dashed border-duo-border rounded-xl">
              Você já possui o melhor plano disponível!
            </div>
          )
        )}

        {/* Features List */}
        {selectedPlanData && visiblePlans.length > 0 && (
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
                  ? selectedPlan === "pro" &&
                    String(currentSubscriptionPlan || "")
                      .trim()
                      .toLowerCase()
                      .includes("premium")
                    ? "Fazer upgrade para Pro"
                    : "Mudar Período do Plano"
                  : texts.subscribeButton}
            </DuoButton>
          </>
        )}
      </div>
    </DuoCard.Root>
  );
}

export const PlansSelector = { Simple: PlansSelectorSimple };
