"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";
import { GymFinancialScreen } from "@/components/screens/gym";
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

interface GymFinancialPageProps {
  financialSummary: FinancialSummary | null;
  payments?: Payment[];
  coupons?: Coupon[];
  campaigns?: BoostCampaign[];
  plans?: MembershipPlan[];
  expenses?: Expense[];
  balanceReais?: number;
  balanceCents?: number;
  withdraws?: BalanceWithdrawSnapshot["withdraws"];
  subscription?: GymSubscriptionSnapshot | null;
}

function normalizeFinancialViewMode(value: string | null): FinancialViewMode {
  if (!value || value === "referrals") {
    return "overview";
  }

  switch (value) {
    case "overview":
    case "payments":
    case "coupons":
    case "expenses":
    case "subscription":
    case "ads":
      return value;
    default:
      return "overview";
  }
}

export function GymFinancialPage({
  financialSummary,
  payments = [],
  coupons = [],
  campaigns = [],
  plans = [],
  expenses = [],
  balanceReais = 0,
  balanceCents = 0,
  withdraws = [],
  subscription,
}: GymFinancialPageProps) {
  const [subTab, setSubTab] = useQueryState(
    "subTab",
    parseAsString.withDefault("overview"),
  );

  const viewMode = useMemo(
    () => normalizeFinancialViewMode(subTab),
    [subTab],
  );

  return (
    <GymFinancialScreen
      financialSummary={financialSummary}
      payments={payments}
      coupons={coupons}
      campaigns={campaigns}
      plans={plans}
      expenses={expenses}
      balanceWithdraws={{
        balanceReais,
        balanceCents,
        withdraws,
      }}
      subscription={subscription}
      viewMode={viewMode}
      onViewModeChange={(nextViewMode) => void setSubTab(nextViewMode)}
    />
  );
}
