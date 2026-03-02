"use client";

import { CheckCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { DuoButton, DuoCard } from "@/components/duo";
import { cn } from "@/lib/utils";
import {
  GYM_PLANS_CONFIG,
  centsToReais,
} from "@/lib/access-control/plans-config";

interface SubscriptionPlansSelectorProps {
  onSubscribe: (
    plan: "basic" | "premium" | "enterprise",
    billingPeriod: "monthly" | "annual",
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



  const handleSubscribe = async () => {
    await onSubscribe(selectedPlanType, selectedBillingPeriod);
  };

  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <Sparkles
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--duo-secondary)" }}
            aria-hidden
          />
          <h2 className="font-bold text-[var(--duo-fg)]">Escolha seu Plano</h2>
        </div>
      </DuoCard.Header>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <DuoCard.Root
          variant={
            selectedBillingPeriod === "monthly" ? "highlighted" : "default"
          }
          size="md"
          className={cn(
            "cursor-pointer transition-all",
            selectedBillingPeriod === "monthly"
              ? "border-duo-green bg-duo-green/10"
              : "hover:border-duo-green/50",
          )}
          onClick={() => setSelectedBillingPeriod("monthly")}
        >
          <div className="mb-2 text-lg font-bold text-duo-text">Mensal</div>
          <div className="text-xs text-duo-gray-dark">por mês</div>
        </DuoCard.Root>

        <DuoCard.Root
          variant={
            selectedBillingPeriod === "annual" ? "highlighted" : "default"
          }
          size="md"
          className={cn(
            "cursor-pointer transition-all relative",
            selectedBillingPeriod === "annual"
              ? "border-duo-green bg-duo-green/10"
              : "hover:border-duo-green/50",
          )}
          onClick={() => setSelectedBillingPeriod("annual")}
        >
          <span className="absolute -top-2 right-2 rounded-full bg-duo-yellow px-2 py-0.5 text-xs font-bold">
            Economize
          </span>
          <div className="mb-2 text-lg font-bold text-duo-text">Anual</div>
          <div className="text-xs text-duo-gray-dark">por ano</div>
        </DuoCard.Root>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {(["basic", "premium", "enterprise"] as const).map((plan) => {
          const config = GYM_PLANS_CONFIG[plan.toUpperCase() as keyof typeof GYM_PLANS_CONFIG];
          const monthlyBase = centsToReais(config.prices.monthly);
          const annualBase = centsToReais(config.prices.annual);
          const monthlyPerStudent = centsToReais(config.pricePerStudent);
          const annualPerStudent = 0; // Preço fixo no anual

          const displayBase =
            selectedBillingPeriod === "annual" ? annualBase : monthlyBase;
          const displayPerStudent =
            selectedBillingPeriod === "annual"
              ? annualPerStudent
              : monthlyPerStudent;

          const isSelected = selectedPlanType === plan;
          return (
            <DuoCard.Root
              key={plan}
              variant={isSelected ? "highlighted" : "default"}
              size="md"
              className={cn(
                "cursor-pointer transition-all relative text-left",
                isSelected
                  ? "border-duo-green bg-duo-green/10"
                  : "hover:border-duo-green/50",
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
            </DuoCard.Root>
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

      <DuoButton
        onClick={handleSubscribe}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? "Processando..." : "Assinar Agora"}
      </DuoButton>
    </DuoCard.Root>
  );
}
