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
}) {
  const router = useRouter();
  const hydrateInitial = usePersonalUnifiedStore((s) => s.hydrateInitial);
  const hydrationKey = JSON.stringify({
    subscriptionId: subscription?.id ?? null,
    studentIds: students.map((student) => student.id),
    affiliationIds: affiliations.map((affiliation) => affiliation.id),
  });

  useEffect(() => {
    hydrateInitial({ subscription, students, affiliations });
  }, [hydrateInitial, hydrationKey, subscription, students, affiliations]);

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
