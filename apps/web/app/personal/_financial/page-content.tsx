"use client";

import type { PersonalSubscriptionData } from "@gymrats/types/personal-module";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";
import { PersonalFinancialScreen } from "@/components/screens/personal";
import type {
  BoostCampaign,
  Coupon,
  Expense,
  FinancialSummary,
  Payment,
} from "@/lib/types";
import type { PersonalMetadata } from "@/lib/types/personal-unified";
import { resolvePersonalFinancialLoadErrors } from "@/lib/utils/personal-financial-errors";

type BoostCampaignPlanOption = {
  id: string;
  name: string;
};

type ViewMode =
  | "overview"
  | "payments"
  | "coupons"
  | "expenses"
  | "subscription"
  | "ads";

interface PersonalFinancialPageContentProps {
  subscription: PersonalSubscriptionData | null;
  payments?: Payment[];
  coupons?: Coupon[];
  campaigns?: BoostCampaign[];
  plans?: BoostCampaignPlanOption[];
  expenses?: Expense[];
  financialSummary?: FinancialSummary | null;
  metadata?: PersonalMetadata | null;
  onRefresh?: () => Promise<void>;
}

export function PersonalFinancialPageContent({
  subscription,
  payments = [],
  coupons = [],
  campaigns = [],
  plans = [],
  expenses = [],
  financialSummary = null,
  metadata = null,
  onRefresh,
}: PersonalFinancialPageContentProps) {
  const [subTab, setSubTab] = useQueryState(
    "subTab",
    parseAsString.withDefault("overview"),
  );

  const viewMode = useMemo<ViewMode>(() => {
    if (!subTab || subTab === "referrals") {
      return "overview";
    }

    switch (subTab) {
      case "overview":
      case "payments":
      case "coupons":
      case "expenses":
      case "subscription":
      case "ads":
        return subTab;
      default:
        return "overview";
    }
  }, [subTab]);

  const loadErrors = useMemo(
    () => resolvePersonalFinancialLoadErrors(metadata),
    [metadata],
  );

  return (
    <PersonalFinancialScreen
      subscription={subscription}
      payments={payments}
      coupons={coupons}
      campaigns={campaigns}
      plans={plans}
      expenses={expenses}
      financialSummary={financialSummary}
      loadErrors={loadErrors}
      viewMode={viewMode}
      onViewModeChange={(nextViewMode) => void setSubTab(nextViewMode)}
      onRefresh={onRefresh}
    />
  );
}
