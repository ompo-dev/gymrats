"use client";

import { CreditCard } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard, DuoSelect } from "@/components/duo";
import type {
  ScreenProps,
  ViewContract,
} from "@/components/foundations";
import {
  ScreenShell,
  createTestSelector,
} from "@/components/foundations";
import { FinancialAdsTab } from "@/components/organisms/gym/financial/financial-ads-tab";
import { FinancialCouponsTab } from "@/components/organisms/gym/financial/financial-coupons-tab";
import { FinancialExpensesTab } from "@/components/organisms/gym/financial/financial-expenses-tab";
import { FinancialOverviewTab } from "@/components/organisms/gym/financial/financial-overview-tab";
import { FinancialPaymentsTab } from "@/components/organisms/gym/financial/financial-payments-tab";
import { FinancialSubscriptionTab } from "@/components/organisms/gym/financial/financial-subscription-tab";
import type {
  BalanceWithdrawSnapshot,
  BoostCampaign,
  Coupon,
  Expense,
  FinancialSummary,
  GymSubscriptionSnapshot,
  MembershipPlan,
  Payment,
} from "@/lib/types";

export type FinancialViewMode =
  | "overview"
  | "payments"
  | "coupons"
  | "expenses"
  | "subscription"
  | "ads";

export interface GymFinancialScreenProps
  extends ScreenProps<{
    financialSummary: FinancialSummary | null;
    payments?: Payment[];
    coupons?: Coupon[];
    campaigns?: BoostCampaign[];
    plans?: MembershipPlan[];
    expenses?: Expense[];
    balanceWithdraws?: BalanceWithdrawSnapshot;
    subscription?: GymSubscriptionSnapshot | null;
    viewMode: FinancialViewMode;
    onViewModeChange: (viewMode: FinancialViewMode) => void;
    onSettlePayment?: (paymentId: string) => Promise<void> | void;
    settlingPaymentId?: string | null;
  }> {}

export const gymFinancialScreenContract: ViewContract = {
  componentId: "gym-financial-screen",
  testId: "gym-financial-screen",
};

export function GymFinancialScreen({
  financialSummary,
  payments = [],
  coupons = [],
  campaigns = [],
  plans = [],
  expenses = [],
  balanceWithdraws,
  subscription,
  viewMode,
  onViewModeChange,
  onSettlePayment,
  settlingPaymentId,
}: GymFinancialScreenProps) {
  return (
    <ScreenShell.Root screenId={gymFinancialScreenContract.testId}>
      <FadeIn>
        <ScreenShell.Header>
          <ScreenShell.Heading>
            <ScreenShell.Title>Gestão Financeira</ScreenShell.Title>
            <ScreenShell.Description>
              Controle completo de receitas, cobranças e assinatura.
            </ScreenShell.Description>
          </ScreenShell.Heading>
        </ScreenShell.Header>
      </FadeIn>

      <ScreenShell.Body>
        <SlideIn delay={0.1}>
          <DuoCard.Root
            variant="default"
            padding="md"
            data-testid={createTestSelector(
              gymFinancialScreenContract.testId,
              "selector",
            )}
          >
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
              onChange={(value) => onViewModeChange(value as FinancialViewMode)}
              placeholder="Selecione a categoria"
            />
          </DuoCard.Root>
        </SlideIn>

        {viewMode === "overview" && financialSummary ? (
          <div
            data-testid={createTestSelector(
              gymFinancialScreenContract.testId,
              "overview",
            )}
          >
            <FinancialOverviewTab
              financialSummary={financialSummary}
              payments={payments}
              subscription={
                subscription
                  ? {
                      id: subscription.id,
                      plan: subscription.plan,
                      status: subscription.status,
                      currentPeriodEnd: subscription.currentPeriodEnd,
                    }
                  : null
              }
              balanceReais={balanceWithdraws?.balanceReais ?? 0}
              balanceCents={balanceWithdraws?.balanceCents ?? 0}
              withdraws={balanceWithdraws?.withdraws ?? []}
            />
          </div>
        ) : null}

        {viewMode === "payments" ? (
          <div
            data-testid={createTestSelector(
              gymFinancialScreenContract.testId,
              "payments",
            )}
          >
            <FinancialPaymentsTab
              payments={payments}
              onSettlePayment={onSettlePayment}
              settlingPaymentId={settlingPaymentId}
            />
          </div>
        ) : null}

        {viewMode === "coupons" ? (
          <div
            data-testid={createTestSelector(
              gymFinancialScreenContract.testId,
              "coupons",
            )}
          >
            <FinancialCouponsTab coupons={coupons} />
          </div>
        ) : null}

        {viewMode === "expenses" ? (
          <div
            data-testid={createTestSelector(
              gymFinancialScreenContract.testId,
              "expenses",
            )}
          >
            <FinancialExpensesTab expenses={expenses} />
          </div>
        ) : null}

        {viewMode === "subscription" ? (
          <div
            data-testid={createTestSelector(
              gymFinancialScreenContract.testId,
              "subscription",
            )}
          >
            <FinancialSubscriptionTab subscription={subscription} />
          </div>
        ) : null}

        {viewMode === "ads" ? (
          <div
            data-testid={createTestSelector(
              gymFinancialScreenContract.testId,
              "ads",
            )}
          >
            <FinancialAdsTab
              campaigns={campaigns}
              coupons={coupons}
              plans={plans.map((plan) => ({ id: plan.id, name: plan.name }))}
            />
          </div>
        ) : null}

        {!financialSummary && viewMode === "overview" ? (
          <DuoCard.Root
            variant="default"
            padding="md"
            data-testid={createTestSelector(
              gymFinancialScreenContract.testId,
              "empty",
            )}
          >
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <CreditCard
                  className="h-5 w-5 shrink-0 text-duo-secondary"
                  aria-hidden
                />
                <h2 className="font-bold text-duo-fg">
                  Dados financeiros indisponíveis
                </h2>
              </div>
            </DuoCard.Header>
            <p className="text-sm text-duo-gray-dark">
              Ainda não há dados suficientes para montar o resumo financeiro.
            </p>
          </DuoCard.Root>
        ) : null}
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
