"use client";

import type { PersonalSubscriptionData } from "@gymrats/types/personal-module";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoAlert, DuoButton, DuoCard, DuoSelect } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { createTestSelector, ScreenShell } from "@/components/foundations";
import { FinancialAdsTab } from "@/components/organisms/gym/financial/financial-ads-tab";
import { FinancialCouponsTab } from "@/components/organisms/gym/financial/financial-coupons-tab";
import { FinancialExpensesTab } from "@/components/organisms/gym/financial/financial-expenses-tab";
import { FinancialOverviewTab } from "@/components/organisms/gym/financial/financial-overview-tab";
import { FinancialPaymentsTab } from "@/components/organisms/gym/financial/financial-payments-tab";
import { PersonalFinancialSubscriptionTab } from "@/components/organisms/personal/financial/personal-financial-subscription-tab";
import type {
  BoostCampaign,
  Coupon,
  Expense,
  FinancialSummary,
  Payment,
} from "@/lib/types";

type BoostCampaignPlanOption = {
  id: string;
  name: string;
};

export type PersonalFinancialViewMode =
  | "overview"
  | "payments"
  | "coupons"
  | "expenses"
  | "subscription"
  | "ads";

export interface PersonalFinancialScreenProps
  extends ScreenProps<{
    subscription: PersonalSubscriptionData | null;
    payments?: Payment[];
    coupons?: Coupon[];
    campaigns?: BoostCampaign[];
    plans?: BoostCampaignPlanOption[];
    expenses?: Expense[];
    financialSummary?: FinancialSummary | null;
    loadErrors?: {
      financialSummary?: string | null;
      payments?: string | null;
    };
    viewMode: PersonalFinancialViewMode;
    onViewModeChange: (viewMode: PersonalFinancialViewMode) => void;
    onRefresh?: () => Promise<void>;
  }> {}

export const personalFinancialScreenContract: ViewContract = {
  componentId: "personal-financial-screen",
  testId: "personal-financial-screen",
};

export function PersonalFinancialScreen({
  subscription,
  payments = [],
  coupons = [],
  campaigns = [],
  plans = [],
  expenses = [],
  financialSummary = null,
  loadErrors,
  viewMode,
  onViewModeChange,
  onRefresh,
}: PersonalFinancialScreenProps) {
  const financialSummaryLoadError = loadErrors?.financialSummary ?? null;
  const paymentsLoadError = loadErrors?.payments ?? null;
  const hasOverviewError = Boolean(
    financialSummaryLoadError || paymentsLoadError,
  );

  const subscriptionForOverview = subscription
    ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      }
    : null;

  return (
    <ScreenShell.Root screenId={personalFinancialScreenContract.testId}>
      <FadeIn>
        <ScreenShell.Header>
          <ScreenShell.Heading>
            <ScreenShell.Title>Gestão Financeira</ScreenShell.Title>
            <ScreenShell.Description>
              Controle completo de receitas, descontos e assinatura do personal.
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
              personalFinancialScreenContract.testId,
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
              onChange={(value) =>
                onViewModeChange(value as PersonalFinancialViewMode)
              }
              placeholder="Selecione a categoria"
            />
          </DuoCard.Root>
        </SlideIn>

        {viewMode === "overview" ? (
          <div
            data-testid={createTestSelector(
              personalFinancialScreenContract.testId,
              "overview",
            )}
          >
            {hasOverviewError ? (
              <div className="space-y-3">
                <DuoAlert
                  variant="danger"
                  title="Erro ao carregar resumo financeiro"
                >
                  {financialSummaryLoadError || paymentsLoadError}
                </DuoAlert>
                {onRefresh ? (
                  <DuoButton variant="white" onClick={() => void onRefresh()}>
                    Tentar novamente
                  </DuoButton>
                ) : null}
              </div>
            ) : financialSummary ? (
              <FinancialOverviewTab
                financialSummary={financialSummary}
                payments={payments}
                subscription={subscriptionForOverview}
                balanceReais={0}
                balanceCents={0}
                withdraws={[]}
                showWithdraw={false}
              />
            ) : (
              <DuoAlert variant="warning" title="Resumo indisponivel">
                Ainda nao ha dados financeiros para exibir.
              </DuoAlert>
            )}
          </div>
        ) : null}

        {viewMode === "payments" ? (
          <div
            data-testid={createTestSelector(
              personalFinancialScreenContract.testId,
              "payments",
            )}
          >
            {paymentsLoadError ? (
              <div className="space-y-3">
                <DuoAlert variant="danger" title="Erro ao carregar pagamentos">
                  {paymentsLoadError}
                </DuoAlert>
                {onRefresh ? (
                  <DuoButton variant="white" onClick={() => void onRefresh()}>
                    Tentar novamente
                  </DuoButton>
                ) : null}
              </div>
            ) : (
              <FinancialPaymentsTab payments={payments} />
            )}
          </div>
        ) : null}

        {viewMode === "coupons" ? (
          <div
            data-testid={createTestSelector(
              personalFinancialScreenContract.testId,
              "coupons",
            )}
          >
            <FinancialCouponsTab coupons={coupons} variant="personal" />
          </div>
        ) : null}

        {viewMode === "expenses" ? (
          <div
            data-testid={createTestSelector(
              personalFinancialScreenContract.testId,
              "expenses",
            )}
          >
            <FinancialExpensesTab expenses={expenses} variant="personal" />
          </div>
        ) : null}

        {viewMode === "subscription" ? (
          <div
            data-testid={createTestSelector(
              personalFinancialScreenContract.testId,
              "subscription",
            )}
          >
            <PersonalFinancialSubscriptionTab onRefresh={onRefresh} />
          </div>
        ) : null}

        {viewMode === "ads" ? (
          <div
            data-testid={createTestSelector(
              personalFinancialScreenContract.testId,
              "ads",
            )}
          >
            <FinancialAdsTab
              campaigns={campaigns}
              coupons={coupons}
              plans={plans}
              variant="personal"
            />
          </div>
        ) : null}
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
