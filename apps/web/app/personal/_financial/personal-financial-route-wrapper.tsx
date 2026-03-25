"use client";

import type { PersonalMembershipPlan } from "@gymrats/types/personal-module";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  BoostCampaign,
  Coupon,
  Expense,
  FinancialSummary,
  Payment,
} from "@/lib/types";
import { usePersonalUnifiedStore } from "@/stores/personal-unified-store";
import type {
  PersonalAffiliation,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
} from "../types";
import { PersonalFinancialPageContent } from "./page-content";

export function PersonalFinancialRouteWrapper({
  subscription,
  students,
  affiliations,
  payments = [],
  coupons = [],
  campaigns = [],
  plans = [],
  expenses = [],
  financialSummary,
}: {
  subscription: PersonalSubscriptionData | null;
  students: PersonalStudentAssignment[];
  affiliations: PersonalAffiliation[];
  payments?: Payment[];
  coupons?: Coupon[];
  campaigns?: BoostCampaign[];
  plans?: PersonalMembershipPlan[];
  expenses?: Expense[];
  financialSummary?: FinancialSummary | null;
}) {
  const router = useRouter();
  const hydrateInitial = usePersonalUnifiedStore((s) => s.hydrateInitial);
  const lastHydrationKeyRef = useRef<string | null>(null);
  const hydrationPayload = useMemo(
    () => ({ subscription, students, affiliations }),
    [subscription, students, affiliations],
  );
  const hydrationKey = useMemo(
    () =>
      JSON.stringify({
        subscription,
        students,
        affiliations,
      }),
    [subscription, students, affiliations],
  );

  useEffect(() => {
    if (lastHydrationKeyRef.current === hydrationKey) {
      return;
    }

    lastHydrationKeyRef.current = hydrationKey;
    hydrateInitial(hydrationPayload);
  }, [hydrateInitial, hydrationKey, hydrationPayload]);

  const onRefresh = useCallback(async () => {
    router.refresh();
  }, [router]);

  return (
    <PersonalFinancialPageContent
      subscription={subscription}
      payments={payments}
      coupons={coupons}
      campaigns={campaigns}
      plans={plans}
      expenses={expenses}
      financialSummary={financialSummary}
      onRefresh={onRefresh}
    />
  );
}
