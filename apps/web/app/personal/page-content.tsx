"use client";

import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useCallback, useMemo } from "react";
import { PersonalDashboardPageContent } from "./_dashboard/page-content";
import { PersonalFinancialPageContent } from "./_financial/page-content";
import { PersonalGymsPageContent } from "./_gyms/page-content";
import { PersonalSettingsPageContent } from "./_settings/page-content";
import { PersonalStatsPageContent } from "./_stats/page-content";
import { PersonalStudentsPageContent } from "./_students/page-content";
import { PersonalMoreMenu } from "@/components/organisms/navigation/personal-more-menu";
import { usePersonalInitializer } from "@/hooks/use-personal-initializer";
import { useLoadPrioritizedPersonal } from "@/hooks/use-load-prioritized-personal";
import { usePersonal } from "@/hooks/use-personal";
import type { MembershipPlan, StudentData } from "@/lib/types";
import type { PersonalMembershipPlan } from "@gymrats/types/personal-module";

function usePersonalStatsSnapshot() {
  const { affiliations, students } = usePersonal("affiliations", "students");

  return useMemo(() => {
    const studentsViaGym = students.filter((item) => item.gym?.id).length;
    const independentStudents = students.length - studentsViaGym;

    return {
      affiliations,
      students,
      stats: {
        gyms: affiliations.length,
        students: students.length,
        studentsViaGym,
        independentStudents,
      },
    };
  }, [affiliations, students]);
}

function PersonalDashboardTab({
  onViewGym,
}: {
  onViewGym: (gymId: string) => void;
}) {
  const { profile, subscription, financialSummary } = usePersonal(
    "profile",
    "subscription",
    "financialSummary",
  );
  const { affiliations, students, stats } = usePersonalStatsSnapshot();

  return (
    <PersonalDashboardPageContent
      profile={profile}
      stats={stats}
      affiliations={affiliations}
      students={students}
      subscription={subscription}
      financialSummary={financialSummary}
      onViewGym={onViewGym}
    />
  );
}

function PersonalStudentsTab() {
  const { affiliations, studentDirectory } = usePersonal(
    "affiliations",
    "studentDirectory",
  );

  return (
    <PersonalStudentsPageContent
      students={studentDirectory as unknown as StudentData[]}
      affiliations={affiliations}
    />
  );
}

function PersonalGymsTab({
  gymId,
  onViewGym,
  onBackFromGym,
  onRefresh,
}: {
  gymId: string | null;
  onViewGym: (gymId: string) => void;
  onBackFromGym: () => void;
  onRefresh: () => Promise<void>;
}) {
  const { affiliations } = usePersonal("affiliations");

  return (
    <PersonalGymsPageContent
      affiliations={affiliations}
      onRefresh={onRefresh}
      gymId={gymId}
      onViewGym={onViewGym}
      onBackFromGym={onBackFromGym}
    />
  );
}

function PersonalFinancialTab({
  onRefresh,
}: {
  onRefresh: () => Promise<void>;
}) {
  const {
    subscription,
    financialSummary,
    expenses,
    payments,
    coupons,
    campaigns,
    membershipPlans,
  } = usePersonal(
    "subscription",
    "financialSummary",
    "expenses",
    "payments",
    "coupons",
    "campaigns",
    "membershipPlans",
  );

  return (
    <PersonalFinancialPageContent
      subscription={subscription}
      financialSummary={financialSummary}
      expenses={expenses}
      payments={payments}
      coupons={coupons}
      campaigns={campaigns}
      plans={membershipPlans as unknown as MembershipPlan[]}
      onRefresh={onRefresh}
    />
  );
}

function PersonalSettingsTab({
  onRefresh,
}: {
  onRefresh: () => Promise<void>;
}) {
  const { profile, membershipPlans } = usePersonal("profile", "membershipPlans");

  return (
    <PersonalSettingsPageContent
      profile={profile}
      plans={membershipPlans as PersonalMembershipPlan[]}
      onRefresh={onRefresh}
    />
  );
}

function PersonalStatsTab() {
  const { stats } = usePersonalStatsSnapshot();

  return (
    <PersonalStatsPageContent
      gyms={stats.gyms}
      students={stats.students}
      studentsViaGym={stats.studentsViaGym}
      independentStudents={stats.independentStudents}
    />
  );
}

function PersonalHomeContent() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("dashboard"));
  const [gymId, setGymId] = useQueryState("gymId", parseAsString);

  usePersonalInitializer();
  useLoadPrioritizedPersonal({ onlyPriorities: true });

  const { loadSection } = usePersonal("loaders");

  const refreshGyms = useCallback(async () => {
    await Promise.all([
      loadSection("affiliations", true),
      loadSection("students", true),
    ]);
  }, [loadSection]);

  const refreshFinancial = useCallback(async () => {
    await Promise.all([
      loadSection("subscription", true),
      loadSection("financialSummary", true),
      loadSection("expenses", true),
      loadSection("payments", true),
      loadSection("coupons", true),
      loadSection("campaigns", true),
      loadSection("membershipPlans", true),
    ]);
  }, [loadSection]);

  const refreshSettings = useCallback(async () => {
    await Promise.all([
      loadSection("profile", true),
      loadSection("membershipPlans", true),
      loadSection("subscription", true),
    ]);
  }, [loadSection]);

  return (
    <div className="px-4 py-6">
      {tab === "dashboard" && (
        <PersonalDashboardTab
          onViewGym={(id) => {
            void (async () => {
              await setGymId(id);
              await setTab("gyms");
            })();
          }}
        />
      )}
      {tab === "students" && <PersonalStudentsTab />}
      {tab === "gyms" && (
        <PersonalGymsTab
          gymId={gymId ?? null}
          onRefresh={refreshGyms}
          onViewGym={(id) => {
            void setGymId(id);
          }}
          onBackFromGym={() => {
            void setGymId(null);
          }}
        />
      )}
      {tab === "financial" && (
        <PersonalFinancialTab onRefresh={refreshFinancial} />
      )}
      {tab === "settings" && <PersonalSettingsTab onRefresh={refreshSettings} />}
      {tab === "stats" && <PersonalStatsTab />}
      {tab === "more" && <PersonalMoreMenu.Simple />}
    </div>
  );
}

export default function PersonalHome(
  _props: { initialPlans?: PersonalMembershipPlan[] } = {},
) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          Carregando...
        </div>
      }
    >
      <PersonalHomeContent />
    </Suspense>
  );
}
