"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard, DuoSelect } from "@/components/duo";
import { usePersonalFinancial } from "@/hooks/use-personal-financial";
import { PersonalFinancialOverviewTab } from "./personal-financial-overview-tab";
import { PersonalFinancialSubscriptionTab } from "./personal-financial-subscription-tab";

type PersonalFinancialViewMode = "overview" | "subscription";

export interface PersonalFinancialPageProps {
  subscription?: unknown;
  onRefresh?: () => Promise<void>;
}

export function PersonalFinancialPage({
  onRefresh,
}: PersonalFinancialPageProps = {}) {
  const { subTab, setSubTab, stats, subscription } = usePersonalFinancial();
  const [querySubTab, setQuerySubTab] = useQueryState(
    "subTab",
    parseAsString.withDefault("overview"),
  );
  const viewMode = useMemo<PersonalFinancialViewMode>(() => {
    if (
      querySubTab === "overview" ||
      querySubTab === "subscription"
    ) {
      return querySubTab;
    }

    return "overview";
  }, [querySubTab]);

  const handleTabChange = (tab: string) => {
    const mode = tab as PersonalFinancialViewMode;
    void Promise.all([setQuerySubTab(mode), setSubTab(mode)]);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Gestão Financeira
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Assinatura e desconto por afiliação a academias Premium/Enterprise
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
              { value: "subscription", label: "Assinatura" },
            ]}
            value={viewMode}
            onChange={(value) => handleTabChange(value)}
            placeholder="Selecione a categoria"
          />
        </DuoCard.Root>
      </SlideIn>

      {viewMode === "overview" && (
        <PersonalFinancialOverviewTab stats={stats} subscription={subscription} />
      )}

      {viewMode === "subscription" && (
        <PersonalFinancialSubscriptionTab onRefresh={onRefresh} />
      )}
    </div>
  );
}
