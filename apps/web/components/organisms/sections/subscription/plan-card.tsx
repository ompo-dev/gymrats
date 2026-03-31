"use client";

import { Crown } from "lucide-react";
import { DuoCard } from "@/components/duo";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "../subscription-section";

interface PlanCardProps {
  plan: SubscriptionPlan;
  isSelected: boolean;
  onSelect: () => void;
  billingPeriod: "monthly" | "annual";
  userType: "student" | "gym" | "personal";
  plansCount: number;
  texts: {
    perMonth: string;
  };
}

function formatAddonPrice(price: number) {
  return price.toLocaleString("pt-BR", {
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function GymMonthlyAddons({ plan }: { plan: SubscriptionPlan }) {
  if (
    plan.perStudentPrice === undefined &&
    plan.perPersonalPrice === undefined
  ) {
    return null;
  }

  return (
    <>
      {plan.perStudentPrice !== undefined ? (
        <div>+ R$ {formatAddonPrice(plan.perStudentPrice)}/aluno</div>
      ) : null}
      {plan.perPersonalPrice !== undefined ? (
        <div>
          + R$ {formatAddonPrice(plan.perPersonalPrice)}/personal filiado
        </div>
      ) : null}
    </>
  );
}

function PlanCardSimple({
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
    <DuoCard.Root
      variant={isSelected ? "highlighted" : "default"}
      size="md"
      className={cn(
        "cursor-pointer transition-all relative text-left",
        isSelected
          ? "border-duo-green bg-duo-green/10"
          : "hover:border-duo-green/50",
        shouldSpanFullWidth && "col-span-2",
      )}
      onClick={onSelect}
    >
      {plan.id === "premium" && (
        <span className="absolute -top-2 right-2 rounded-full bg-duo-yellow px-2 py-0.5 text-xs font-bold">
          Popular
        </span>
      )}
      {isEnterprise && shouldSpanFullWidth ? (
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
                  <span>Preco fixo anual</span>
                ) : (
                  <span>{texts.perMonth}</span>
                )}
              </div>
              {billingPeriod === "monthly" && userType === "gym" ? (
                <div className="space-y-1 text-sm text-duo-gray-dark whitespace-nowrap">
                  <GymMonthlyAddons plan={plan} />
                </div>
              ) : null}
            </div>
            {billingPeriod === "annual" && userType === "gym" ? (
              <div className="mt-2 text-sm text-duo-gray-dark">
                Sem cobranca variavel por aluno ou personal
              </div>
            ) : null}
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
        <>
          <div className="mb-2 text-lg font-bold text-duo-text capitalize">
            {plan.name}
          </div>
          <div className="mb-1 text-2xl font-bold text-duo-green">
            R$ {Math.round(planPrice).toLocaleString("pt-BR")}
          </div>
          {billingPeriod === "annual" ? (
            <div className="space-y-1 text-xs text-duo-gray-dark">
              <div>Preco fixo anual</div>
              {userType === "gym" ? (
                <div>Sem cobranca variavel por aluno ou personal</div>
              ) : null}
            </div>
          ) : (
            <div className="text-xs text-duo-gray-dark">{texts.perMonth}</div>
          )}
          {billingPeriod === "monthly" && userType === "gym" ? (
            <div className="mt-1 space-y-1 text-xs text-duo-gray-dark">
              <GymMonthlyAddons plan={plan} />
            </div>
          ) : null}
        </>
      )}
    </DuoCard.Root>
  );
}

export const PlanCard = { Simple: PlanCardSimple };
