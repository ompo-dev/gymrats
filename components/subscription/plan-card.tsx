"use client";

import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DuoCard } from "@/components/ui/duo-card";
import type { SubscriptionPlan } from "../subscription-section";

interface PlanCardProps {
  plan: SubscriptionPlan;
  isSelected: boolean;
  onSelect: () => void;
  billingPeriod: "monthly" | "annual";
  userType: "student" | "gym";
  plansCount: number;
  texts: {
    perMonth: string;
  };
}

export function PlanCard({
  plan,
  isSelected,
  onSelect,
  billingPeriod,
  userType,
  plansCount,
  texts,
}: PlanCardProps) {
  const planPrice =
    billingPeriod === "annual" ? plan.annualPrice : plan.monthlyPrice;

  const isEnterprise = userType === "gym" && plan.id === "enterprise";
  const shouldSpanFullWidth = isEnterprise && plansCount === 3;

  return (
    <DuoCard
      variant={isSelected ? "highlighted" : "default"}
      size="md"
      className={cn(
        "cursor-pointer transition-all relative text-left",
        isSelected
          ? "border-duo-green bg-duo-green/10"
          : "hover:border-duo-green/50",
        shouldSpanFullWidth && "col-span-2"
      )}
      onClick={onSelect}
    >
      {plan.id === "premium" && (
        <span className="absolute -top-2 right-2 rounded-full bg-duo-yellow px-2 py-0.5 text-xs font-bold">
          Popular
        </span>
      )}
      {isEnterprise && shouldSpanFullWidth ? (
        // Layout especial para Enterprise (2 colunas)
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 text-xl font-bold text-duo-text capitalize">
              {plan.name}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="text-3xl font-bold text-duo-green whitespace-nowrap">
                R$ {Math.round(planPrice).toLocaleString("pt-BR")}
              </div>
              <div className="text-sm text-duo-gray-dark whitespace-nowrap">
                {billingPeriod === "annual" ? (
                  <span>Preço fixo anual</span>
                ) : (
                  <span>{texts.perMonth}</span>
                )}
              </div>
              {billingPeriod === "monthly" &&
                userType === "gym" &&
                plan.perStudentPrice !== undefined && (
                  <div className="text-sm text-duo-gray-dark whitespace-nowrap">
                    + R${" "}
                    {plan.perStudentPrice.toLocaleString("pt-BR", {
                      minimumFractionDigits:
                        plan.perStudentPrice % 1 === 0 ? 0 : 2,
                      maximumFractionDigits: 2,
                    })}
                    /aluno
                  </div>
                )}
            </div>
          </div>
          {isEnterprise && (
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-duo-green/20 px-3 py-1 text-sm font-semibold text-duo-green">
                <Crown className="h-4 w-4" />
                Melhor escolha
              </span>
            </div>
          )}
        </div>
      ) : (
        // Layout padrão para outros planos
        <>
          <div className="mb-2 text-lg font-bold text-duo-text capitalize">
            {plan.name}
          </div>
          <div className="mb-1 text-2xl font-bold text-duo-green">
            R$ {Math.round(planPrice).toLocaleString("pt-BR")}
          </div>
          {billingPeriod === "annual" ? (
            <div className="text-xs text-duo-gray-dark">Preço fixo anual</div>
          ) : (
            <div className="text-xs text-duo-gray-dark">{texts.perMonth}</div>
          )}
          {billingPeriod === "monthly" &&
            userType === "gym" &&
            plan.perStudentPrice !== undefined && (
              <div className="mt-1 text-xs text-duo-gray-dark">
                + R${" "}
                {plan.perStudentPrice.toLocaleString("pt-BR", {
                  minimumFractionDigits: plan.perStudentPrice % 1 === 0 ? 0 : 2,
                  maximumFractionDigits: 2,
                })}
                /aluno
              </div>
            )}
        </>
      )}
    </DuoCard>
  );
}
