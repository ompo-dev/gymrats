"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard, DuoSelect } from "@/components/duo";
import { FinancialCouponsTab } from "@/components/organisms/gym/financial/financial-coupons-tab";
import { FinancialExpensesTab } from "@/components/organisms/gym/financial/financial-expenses-tab";
import { FinancialOverviewTab } from "@/components/organisms/gym/financial/financial-overview-tab";
import { FinancialPaymentsTab } from "@/components/organisms/gym/financial/financial-payments-tab";
import { FinancialSubscriptionTab } from "@/components/organisms/gym/financial/financial-subscription-tab";
import { FinancialAdsTab } from "@/components/organisms/gym/financial/financial-ads-tab";
import type {
  BoostCampaign,
  Coupon,
  Expense,
  FinancialSummary,
  MembershipPlan,
  Payment,
} from "@/lib/types";

interface FinancialPageProps {
  financialSummary: FinancialSummary;
  payments: Payment[];
  coupons: Coupon[];
  campaigns?: BoostCampaign[];
  plans?: MembershipPlan[];
  balanceReais: number;
  balanceCents: number;
  withdraws: {
    id: string;
    amount: number;
    pixKey: string;
    pixKeyType: string;
    externalId: string;
    status: string;
    createdAt: Date;
    completedAt: Date | null;
  }[];
  /** Quando true, saque só persiste no DB (dev). Remover para usar AbacatePay real. */
  fakeWithdraw?: boolean;
  expenses: Expense[];
  subscription?: {
    id: string;
    plan: string;
    status: string;
    basePrice: number;
    pricePerStudent: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt: Date | null;
    trialStart: Date | null;
    trialEnd: Date | null;
    isTrial: boolean;
    daysRemaining: number | null;
    activeStudents: number;
    totalAmount: number;
  } | null;
  startTrial?: () => Promise<{ error?: string; success?: boolean }>;
}

export default function FinancialPage({
  financialSummary,
  payments,
  coupons,
  balanceReais,
  balanceCents,
  withdraws,
  fakeWithdraw = true,
  expenses,
  subscription: initialSubscription,
  campaigns = [],
  plans = [],
}: FinancialPageProps) {
  const [subTab, setSubTab] = useQueryState(
    "subTab",
    parseAsString.withDefault("overview"),
  );
  type ViewMode =
    | "overview"
    | "payments"
    | "coupons"
    | "expenses"
    | "subscription"
    | "ads";

  const viewMode = useMemo(
    () => ((subTab || "overview") === "referrals" ? "overview" : subTab) as ViewMode,
    [subTab],
  );

  const handleTabChange = (tab: string) => {
    const newViewMode = (tab === "referrals" ? "overview" : tab) as ViewMode;
    void setSubTab(newViewMode);
  };

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
              { value: "payments", label: "Pagamentos" },
              { value: "coupons", label: "Cupons" },
              { value: "expenses", label: "Despesas" },
              { value: "subscription", label: "Assinatura" },
              { value: "ads", label: "Impulsionamento" },
            ]}
            value={viewMode}
            onChange={(value) => handleTabChange(value)}
            placeholder="Selecione a categoria"
          />
        </DuoCard.Root>
      </SlideIn>

      {viewMode === "overview" && (
        <FinancialOverviewTab
          financialSummary={financialSummary}
          payments={payments}
          subscription={initialSubscription}
          balanceReais={balanceReais}
          balanceCents={balanceCents}
          withdraws={withdraws}
          fakeWithdraw={fakeWithdraw}
        />
      )}

      {viewMode === "payments" && <FinancialPaymentsTab payments={payments} />}

      {viewMode === "coupons" && <FinancialCouponsTab coupons={coupons} />}

      {viewMode === "expenses" && <FinancialExpensesTab expenses={expenses} />}

      {viewMode === "subscription" && (
        <FinancialSubscriptionTab
          subscription={initialSubscription || undefined}
        />
      )}

      {viewMode === "ads" && (
        <FinancialAdsTab
          campaigns={campaigns}
          coupons={coupons}
          plans={plans}
        />
      )}
    </div>
  );
}
