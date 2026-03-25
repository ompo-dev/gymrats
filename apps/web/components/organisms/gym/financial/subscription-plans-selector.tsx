"use client";

import { CheckCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { DuoButton, DuoCard } from "@/components/duo";
import {
  centsToReais,
  GYM_PLANS_CONFIG,
} from "@/lib/access-control/plans-config";
import { cn } from "@/lib/utils";

interface SubscriptionPlansSelectorProps {
  onSubscribe: (
    plan: "basic" | "premium" | "enterprise",
    billingPeriod: "monthly" | "annual",
  ) => Promise<void>;
  isLoading: boolean;
}

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
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
          <div className="text-xs text-duo-gray-dark">por mes</div>
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
          const config =
            GYM_PLANS_CONFIG[
              plan.toUpperCase() as keyof typeof GYM_PLANS_CONFIG
            ];
          const monthlyBase = centsToReais(config.prices.monthly);
          const annualBase = centsToReais(config.prices.annual);
          const monthlyPerStudent = centsToReais(config.pricePerStudent);
          const monthlyPerPersonal = centsToReais(config.pricePerPersonal ?? 0);

          const displayBase =
            selectedBillingPeriod === "annual" ? annualBase : monthlyBase;
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
              {plan === "premium" ? (
                <span className="absolute -top-2 right-2 rounded-full bg-duo-yellow px-2 py-0.5 text-xs font-bold">
                  Popular
                </span>
              ) : null}
              <div className="mb-2 text-lg font-bold text-duo-text capitalize">
                {plan}
              </div>
              <div className="mb-1 text-2xl font-bold text-duo-green">
                R$ {formatPrice(displayBase)}
              </div>
              {selectedBillingPeriod === "annual" ? (
                <div className="space-y-1 text-xs text-duo-gray-dark">
                  <div>Preco fixo anual</div>
                  <div>Sem cobranca por aluno ou personal</div>
                </div>
              ) : (
                <div className="space-y-1 text-xs text-duo-gray-dark">
                  <div>+ R$ {formatPrice(monthlyPerStudent)}/aluno</div>
                  <div>
                    + R$ {formatPrice(monthlyPerPersonal)}/personal filiado
                  </div>
                </div>
              )}
            </DuoCard.Root>
          );
        })}
      </div>

      <div className="space-y-2 pt-4 border-t-2 border-duo-border">
        <div className="flex items-center gap-2 text-sm text-duo-text">
          <CheckCircle className="h-4 w-4 text-duo-green" />
          <span>Gestao completa de alunos</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-duo-text">
          <CheckCircle className="h-4 w-4 text-duo-green" />
          <span>Dashboard avancado</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-duo-text">
          <CheckCircle className="h-4 w-4 text-duo-green" />
          <span>Controle de personais filiados</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-duo-text">
          <CheckCircle className="h-4 w-4 text-duo-green" />
          <span>Relatorios detalhados</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-duo-text">
          <CheckCircle className="h-4 w-4 text-duo-green" />
          <span>Suporte prioritario</span>
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
