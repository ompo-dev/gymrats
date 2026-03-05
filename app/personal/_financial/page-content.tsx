"use client";

import { PersonalFinancialPage } from "@/components/organisms/personal";
import type { PersonalSubscriptionData } from "../types";

interface PersonalFinancialPageContentProps {
  subscription: PersonalSubscriptionData | null;
  onRefresh: () => Promise<void>;
}

export function PersonalFinancialPageContent({
  subscription,
  onRefresh,
}: PersonalFinancialPageContentProps) {
  return (
    <PersonalFinancialPage
      subscription={subscription}
      onRefresh={onRefresh}
    />
  );
}
