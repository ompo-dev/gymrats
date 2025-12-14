"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
import { BillingPeriodSelector } from "./billing-period-selector";
import { PlanCard } from "./plan-card";
import { PlanFeatures } from "./plan-features";
import type { SubscriptionPlan } from "../subscription-section";

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

export function PlansSelector({
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
    <SectionCard
      title={
        userType === "student" && isPremiumActive
          ? "Mudar para Plano Anual"
          : isTrialActive
          ? texts.upgradeTitle
          : texts.choosePlanTitle
      }
      icon={Sparkles}
    >
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
          <BillingPeriodSelector
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
                : "grid-cols-3"
            )}
          >
            {plans
              .filter((plan) => {
                // Para student com subscription ativa: mostrar apenas premium
                if (userType === "student" && isPremiumActive) {
                  return plan.id === "premium";
                }

                // Para gym com subscription ativa: filtrar baseado no billingPeriod selecionado
                if (
                  userType === "gym" &&
                  isPremiumActive &&
                  currentSubscriptionPlan
                ) {
                  // Normalizar valores para comparação - garantir que ambos sejam strings e normalizados
                  const planIdRaw = String(plan.id || "").trim();
                  const currentPlanRaw = String(
                    currentSubscriptionPlan || ""
                  ).trim();
                  const planId = planIdRaw.toLowerCase();
                  const currentPlan = currentPlanRaw.toLowerCase();

                  // Debug detalhado - sempre logar para Enterprise
                  if (
                    process.env.NODE_ENV === "development" &&
                    (planId === "enterprise" || currentPlan === "enterprise")
                  ) {
                    console.log("[PlansSelector] 🔍 Filtrando Enterprise:", {
                      planId,
                      currentPlan,
                      planIdRaw: plan.id,
                      currentPlanRaw: currentSubscriptionPlan,
                      planIdEqualsCurrentPlan: planId === currentPlan,
                      selectedBillingPeriod,
                      currentSubscriptionBillingPeriod,
                      isSamePeriod:
                        selectedBillingPeriod ===
                        currentSubscriptionBillingPeriod,
                      willFilterOut: planId === currentPlan,
                    });
                  }

                  // VERIFICAÇÃO CRÍTICA #1: Se é o plano atual, NUNCA mostrar (independente do período)
                  // Esta é a verificação mais importante - deve ser a primeira e mais restritiva
                  // Comparação explícita e direta - verificar tanto lowercase quanto case-sensitive
                  const isCurrentPlan =
                    (planId === currentPlan &&
                      planId !== "" &&
                      currentPlan !== "") ||
                    (planIdRaw === currentPlanRaw &&
                      planIdRaw !== "" &&
                      currentPlanRaw !== "");

                  // Verificação adicional: se é o mesmo plano E está no mesmo período, definitivamente não mostrar
                  const isSamePeriod = currentSubscriptionBillingPeriod
                    ? selectedBillingPeriod === currentSubscriptionBillingPeriod
                    : false;

                  const isCurrentPlanInSamePeriod =
                    isCurrentPlan && isSamePeriod;

                  if (isCurrentPlan) {
                    if (process.env.NODE_ENV === "development") {
                      console.log(
                        "[PlansSelector] ❌ FILTERED OUT - É O PLANO ATUAL:",
                        {
                          planId,
                          currentPlan,
                          planIdRaw: plan.id,
                          currentPlanRaw: currentSubscriptionPlan,
                          selectedBillingPeriod,
                          currentSubscriptionBillingPeriod,
                          isSamePeriod,
                          isCurrentPlanInSamePeriod,
                          reason:
                            "Plano atual não deve aparecer (independente do período)",
                        }
                      );
                    }
                    // SEMPRE retornar false se for o plano atual, independente de qualquer outra condição
                    return false;
                  }

                  // Se não tem billingPeriod definido, aplicar lógica padrão
                  if (!currentSubscriptionBillingPeriod) {
                    // Filtrar pela hierarquia mesmo sem billingPeriod
                    const planHierarchy = ["basic", "premium", "enterprise"];
                    const currentPlanIndex = planHierarchy.indexOf(currentPlan);

                    if (currentPlanIndex === 2) {
                      return planId === "basic";
                    } else if (currentPlanIndex === 1) {
                      return planId === "basic";
                    } else if (currentPlanIndex === 0) {
                      return planId === "premium";
                    }
                    return true;
                  }

                  // Reutilizar isSamePeriod já calculado acima (ou calcular se não foi calculado)
                  const isSamePeriodCheck = currentSubscriptionBillingPeriod
                    ? selectedBillingPeriod === currentSubscriptionBillingPeriod
                    : false;

                  // REGRA 2: Se está mudando de período (mensal -> anual ou anual -> mensal): mostrar todos
                  // (já filtramos o plano atual acima)
                  if (!isSamePeriodCheck) {
                    if (process.env.NODE_ENV === "development") {
                      console.log(
                        "[PlansSelector] ✅ MOSTRAR - Período diferente:",
                        {
                          planId,
                          selectedBillingPeriod,
                          currentSubscriptionBillingPeriod,
                        }
                      );
                    }
                    return true;
                  }

                  // REGRA 3: Se está no mesmo período (mas não é o plano atual): filtrar pela hierarquia
                  const planHierarchy = ["basic", "premium", "enterprise"];
                  const currentPlanIndex = planHierarchy.indexOf(currentPlan);

                  // Se não encontrou o plano atual na hierarquia, mostrar todos
                  if (currentPlanIndex === -1) {
                    return true;
                  }

                  // Filtrar baseado na hierarquia
                  if (currentPlanIndex === 2) {
                    // Enterprise: mostrar Basic e Premium (downgrade para ambos)
                    const shouldShow =
                      planId === "basic" || planId === "premium";
                    if (process.env.NODE_ENV === "development") {
                      console.log(
                        "[PlansSelector] Enterprise no mesmo período:",
                        {
                          planId,
                          shouldShow,
                        }
                      );
                    }
                    return shouldShow;
                  } else if (currentPlanIndex === 1) {
                    // Premium: mostrar Basic (downgrade)
                    return planId === "basic";
                  } else if (currentPlanIndex === 0) {
                    // Basic: mostrar Premium (upgrade)
                    return planId === "premium";
                  }
                }

                return true;
              })
              .map((plan) => (
                <PlanCard
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
            <Button
              onClick={onSubscribe}
              disabled={isLoading}
              className="w-full mt-4"
              size="lg"
            >
              {isLoading
                ? "Processando..."
                : userType === "student" && isPremiumActive
                ? "Mudar para Plano Anual"
                : texts.subscribeButton}
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}
