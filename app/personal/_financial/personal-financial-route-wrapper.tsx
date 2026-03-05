"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePersonalUnifiedStore } from "@/stores/personal-unified-store";
import { PersonalFinancialPageContent } from "./page-content";
import type {
  PersonalAffiliation,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
} from "../types";

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
  balanceReais = 0,
  balanceCents = 0,
  withdraws = [],
}: {
  subscription: PersonalSubscriptionData | null;
  students: PersonalStudentAssignment[];
  affiliations: PersonalAffiliation[];
  payments?: any[];
  coupons?: any[];
  campaigns?: any[];
  plans?: any[];
  expenses?: any[];
  financialSummary?: any;
  balanceReais?: number;
  balanceCents?: number;
  withdraws?: any[];
}) {
  const router = useRouter();
  const hydrateInitial = usePersonalUnifiedStore((s) => s.hydrateInitial);

  useEffect(() => {
    hydrateInitial({ subscription, students, affiliations });
  }, [hydrateInitial, subscription, students, affiliations]);

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
      balanceReais={balanceReais}
      balanceCents={balanceCents}
      withdraws={withdraws}
      onRefresh={onRefresh}
    />
  );
}
