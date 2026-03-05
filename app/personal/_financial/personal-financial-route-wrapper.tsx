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
}: {
  subscription: PersonalSubscriptionData | null;
  students: PersonalStudentAssignment[];
  affiliations: PersonalAffiliation[];
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
      onRefresh={onRefresh}
    />
  );
}
