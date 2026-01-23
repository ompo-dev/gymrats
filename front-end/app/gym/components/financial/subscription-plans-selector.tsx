"use client";

import { useState } from "react";
import { Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/atoms/buttons/button";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { cn } from "@/lib/utils";

interface SubscriptionPlansSelectorProps {
  onSubscribe: (
    plan: "basic" | "premium" | "enterprise",
    billingPeriod: "monthly" | "annual"
  ) => Promise<void>;
  isLoading: boolean;
}

export function SubscriptionPlansSelector({
  onSubscribe,
  isLoading,
}: SubscriptionPlansSelectorProps) {
  const [selectedPlanType, setSelectedPlanType] = useState<
    "basic" | "premium" | "enterprise"
  >("premium");
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<
    "monthly" | "annual"
  >("monthly");

  const prices = {
    basic: { base: 150, perStudent: 1.5 },
    premium: { base: 250, perStudent: 1 },
    enterprise: { base: 400, perStudent: 0.5 },
  };

  const handleSubscribe = async () => {
    await onSubscribe(selectedPlanType, selectedBillingPeriod);
  };

  return (
    <SectionCard title="Escolha seu Plano" icon={Sparkles}>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <DuoCard
          variant={
            selectedBillingPeriod === "monthly" ? "highlighted" : "default"
          }
          size="md"
          className={cn(
            "cursor-pointer transition-all",
            selectedBillingPeriod === "monthly"
              ? "border-duo-green bg-duo-green/10"
              : "hover:border-duo-green/50"
          )}
          onClick={() => setSelectedBillingPeriod("monthly")}
        >
          <div className="mb-2 text-lg font-bold text-duo-text">Mensal</div>
          <div className="text-xs text-duo-gray-dark">por mês</div>
        </DuoCard>

        <DuoCard
          variant={
            selectedBillingPeriod === "annual" ? "highlighted" : "default"
          }
          size="md"
          className={cn(
            "cursor-pointer transition-all relative",
            selectedBillingPeriod === "annual"
              ? "border-duo-green bg-duo-green/10"
              : "hover:border-duo-green/50"
          )}
          onClick={() => setSelectedBillingPeriod("annual")}
        >
          <span className="absolute -top-2 right-2 rounded-full bg-duo-yellow px-2 py-0.5 text-xs font-bold">
            Economize
          </span>
          <div className="mb-2 text-lg font-bold text-duo-text">Anual</div>
          <div className="text-xs text-duo-gray-dark">por ano</div>
        </DuoCard>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {(["basic", "premium", "enterprise"] as const).map((plan) => {
          const planPrices = prices[plan];
          const monthlyBase = planPrices.base;
          // Descontos diferenciados: Basic 5%, Premium 10%, Enterprise 15%
          const annualDiscounts = {
            basic: 0.95, // 5% desconto
            premium: 0.9, // 10% desconto
            enterprise: 0.85, // 15% desconto
          };
          const annualBase = Math.round(
            monthlyBase * 12 * annualDiscounts[plan]
          );
          const monthlyPerStudent = planPrices.perStudent;
          const annualPerStudent = Math.round(
            monthlyPerStudent * 12 * annualDiscounts[plan]
          );

          const displayBase =
            selectedBillingPeriod === "annual" ? annualBase : monthlyBase;
          const displayPerStudent =
            selectedBillingPeriod === "annual"
              ? annualPerStudent
              : monthlyPerStudent;

          const isSelected = selectedPlanType === plan;
          return (
            <DuoCard
              key={plan}
              variant={isSelected ? "highlighted" : "default"}
              size="md"
              className={cn(
                "cursor-pointer transition-all relative text-left",
                isSelected
                  ? "border-duo-green bg-duo-green/10"
                  : "hover:border-duo-green/50"
              )}
              onClick={() => setSelectedPlanType(plan)}
            >
              {plan === "premium" && (
                <span className="absolute -top-2 right-2 rounded-full bg-duo-yellow px-2 py-0.5 text-xs font-bold">
                  Popular
                </span>
              )}
              <div className="mb-2 text-lg font-bold text-duo-text capitalize">
                {plan}
              </div>
              <div className="mb-1 text-2xl font-bold text-duo-green">
                R$ {displayBase}
              </div>
              {selectedBillingPeriod === "annual" ? (
                <div className="text-xs text-duo-gray-dark">
                  Preço fixo anual
                </div>
              ) : (
                <div className="text-xs text-duo-gray-dark">
                  + R$ {displayPerStudent}/aluno
                </div>
              )}
              {selectedBillingPeriod === "annual" && (
                <div className="mt-1 text-xs text-duo-green font-bold">
                  Sem cobrança por aluno
                </div>
              )}
            </DuoCard>
          );
        })}
      </div>

      <div className="space-y-2 pt-4 border-t-2 border-duo-border">
        <div className="flex items-center gap-2 text-sm text-duo-text">
          <CheckCircle className="h-4 w-4 text-duo-green" />
          <span>Gestão completa de alunos</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-duo-text">
          <CheckCircle className="h-4 w-4 text-duo-green" />
          <span>Dashboard avançado</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-duo-text">
          <CheckCircle className="h-4 w-4 text-duo-green" />
          <span>Premium gratuito para todos os alunos</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-duo-text">
          <CheckCircle className="h-4 w-4 text-duo-green" />
          <span>Relatórios detalhados</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-duo-text">
          <CheckCircle className="h-4 w-4 text-duo-green" />
          <span>Suporte prioritário</span>
        </div>
      </div>

      <Button
        onClick={handleSubscribe}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? "Processando..." : "Assinar Agora"}
      </Button>
    </SectionCard>
  );
}
