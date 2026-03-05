"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard, DuoSelect } from "@/components/duo";
import { FinancialExpensesTab } from "@/components/organisms/gym/financial/financial-expenses-tab";
import { FinancialOverviewTab } from "@/components/organisms/gym/financial/financial-overview-tab";
import { PersonalFinancialSubscriptionTab } from "@/components/organisms/personal/financial/personal-financial-subscription-tab";
import type {
  Expense,
  FinancialSummary,
} from "@/lib/types";
import type { PersonalSubscriptionData } from "../types";

const EMPTY_FINANCIAL_SUMMARY: FinancialSummary = {
  totalRevenue: 0,
  totalExpenses: 0,
  netProfit: 0,
  monthlyRecurring: 0,
  pendingPayments: 0,
  overduePayments: 0,
  averageTicket: 0,
  churnRate: 0,
  revenueGrowth: 0,
};

interface PersonalFinancialPageContentProps {
  subscription: PersonalSubscriptionData | null;
  expenses?: Expense[];
  financialSummary?: FinancialSummary | null;
  onRefresh?: () => Promise<void>;
}

export function PersonalFinancialPageContent({
  subscription,
  expenses = [],
  financialSummary = EMPTY_FINANCIAL_SUMMARY,
  onRefresh,
}: PersonalFinancialPageContentProps) {
  const [subTab, setSubTab] = useQueryState(
    "subTab",
    parseAsString.withDefault("overview"),
  );
  type ViewMode = "overview" | "expenses" | "subscription";
  const [viewMode, setViewMode] = useState<ViewMode>(
    (subTab || "overview") as ViewMode,
  );

  useEffect(() => {
    if (subTab && ["overview", "expenses", "subscription"].includes(subTab)) {
      setViewMode(subTab as ViewMode);
    }
  }, [subTab]);

  const handleTabChange = (tab: string) => {
    setViewMode(tab as ViewMode);
    setSubTab(tab);
  };

  const subscriptionForOverview = subscription
    ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      }
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Gestão Financeira
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Controle completo de receitas e despesas
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <h2 className="font-bold text-duo-fg">Categoria</h2>
          </DuoCard.Header>
          <DuoSelect.Simple
            options={[
              { value: "overview", label: "Resumo" },
              { value: "expenses", label: "Despesas" },
              { value: "subscription", label: "Assinatura" },
            ]}
            value={viewMode}
            onChange={(value) => handleTabChange(value)}
            placeholder="Selecione a categoria"
          />
        </DuoCard.Root>
      </SlideIn>

      {viewMode === "overview" && financialSummary && (
        <FinancialOverviewTab
          financialSummary={financialSummary}
          payments={[]}
          subscription={subscriptionForOverview}
          balanceReais={0}
          balanceCents={0}
          withdraws={[]}
          showWithdraw={false}
        />
      )}

      {viewMode === "expenses" && (
        <FinancialExpensesTab expenses={expenses} />
      )}

      {viewMode === "subscription" && (
        <PersonalFinancialSubscriptionTab onRefresh={onRefresh} />
      )}
    </div>
  );
}

