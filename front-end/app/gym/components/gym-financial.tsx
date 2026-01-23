"use client";

import { useState, useEffect } from "react";
import { parseAsString, useQueryState } from "nuqs";
import type { FinancialSummary } from "@/lib/types";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { SectionCard } from "@/components/ui/section-card";
import { OptionSelector } from "@/components/ui/option-selector";
import { DollarSign } from "lucide-react";
import { FinancialOverviewTab } from "./financial/financial-overview-tab";
import { FinancialPaymentsTab } from "./financial/financial-payments-tab";
import { FinancialCouponsTab } from "./financial/financial-coupons-tab";
import { FinancialReferralsTab } from "./financial/financial-referrals-tab";
import { FinancialExpensesTab } from "./financial/financial-expenses-tab";
import { FinancialSubscriptionTab } from "./financial/financial-subscription-tab";
import {
  mockPayments,
  mockCoupons,
  mockReferrals,
  mockExpenses,
} from "@/lib/gym-mock-data";

interface GymFinancialPageProps {
  financialSummary: FinancialSummary;
  payments?: typeof mockPayments;
  coupons?: typeof mockCoupons;
  referrals?: typeof mockReferrals;
  expenses?: typeof mockExpenses;
}

export function GymFinancialPage({
  financialSummary,
  payments = mockPayments,
  coupons = mockCoupons,
  referrals = mockReferrals,
  expenses = mockExpenses,
}: GymFinancialPageProps) {
  const [subTab, setSubTab] = useQueryState(
    "subTab",
    parseAsString.withDefault("overview")
  );

  const [viewMode, setViewMode] = useState<
    | "overview"
    | "payments"
    | "coupons"
    | "referrals"
    | "expenses"
    | "subscription"
  >("overview");

  useEffect(() => {
    if (subTab) {
      setViewMode(
        subTab as
          | "overview"
          | "payments"
          | "coupons"
          | "referrals"
          | "expenses"
          | "subscription"
      );
    }
  }, [subTab]);

  const tabOptions = [
    { value: "overview", label: "Resumo" },
    { value: "payments", label: "Pagamentos" },
    { value: "coupons", label: "Cupons" },
    { value: "referrals", label: "Indicações" },
    { value: "expenses", label: "Despesas" },
    { value: "subscription", label: "Assinatura" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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
        <SectionCard title="Selecione a Categoria" icon={DollarSign}>
          <OptionSelector
            options={tabOptions}
            value={viewMode}
            onChange={(value) => {
              const newViewMode = value as
                | "overview"
                | "payments"
                | "coupons"
                | "referrals"
                | "expenses"
                | "subscription";
              setViewMode(newViewMode);
              setSubTab(newViewMode);
            }}
            layout="list"
            size="md"
            textAlign="center"
            animate={true}
          />
        </SectionCard>
      </SlideIn>

      {viewMode === "overview" && (
        <SlideIn delay={0.2}>
          <FinancialOverviewTab
            financialSummary={financialSummary}
            payments={payments}
          />
        </SlideIn>
      )}

      {viewMode === "payments" && (
        <SlideIn delay={0.2}>
          <FinancialPaymentsTab payments={payments} />
        </SlideIn>
      )}

      {viewMode === "coupons" && (
        <SlideIn delay={0.2}>
          <FinancialCouponsTab coupons={coupons} />
        </SlideIn>
      )}

      {viewMode === "referrals" && (
        <SlideIn delay={0.2}>
          <FinancialReferralsTab referrals={referrals} />
        </SlideIn>
      )}

      {viewMode === "expenses" && (
        <SlideIn delay={0.2}>
          <FinancialExpensesTab expenses={expenses} />
        </SlideIn>
      )}

      {viewMode === "subscription" && (
        <SlideIn delay={0.2}>
          <FinancialSubscriptionTab />
        </SlideIn>
      )}
    </div>
  );
}
