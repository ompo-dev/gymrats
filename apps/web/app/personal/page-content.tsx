"use client";

import type { PersonalMembershipPlan } from "@gymrats/types/personal-module";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useMemo } from "react";
import { PersonalMoreMenu } from "@/components/organisms/navigation/personal-more-menu";
import { useInvalidatePersonalBootstrap } from "@/hooks/use-bootstrap-refresh";
import { usePersonal } from "@/hooks/use-personal";
import {
  usePersonalDashboardBootstrapBridge,
  usePersonalFinancialBootstrapBridge,
  usePersonalGymsBootstrapBridge,
  usePersonalSettingsBootstrapBridge,
  usePersonalStatsBootstrapBridge,
  usePersonalStudentsBootstrapBridge,
} from "@/hooks/use-personal-bootstrap";
import type { MembershipPlan, StudentData } from "@/lib/types";
import { PersonalDashboardPageContent } from "./_dashboard/page-content";
import { PersonalFinancialPageContent } from "./_financial/page-content";
import { PersonalGymsPageContent } from "./_gyms/page-content";
import { PersonalSettingsPageContent } from "./_settings/page-content";
import { PersonalStatsPageContent } from "./_stats/page-content";
import { PersonalStudentsPageContent } from "./_students/page-content";

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
  usePersonalDashboardBootstrapBridge();

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
  usePersonalStudentsBootstrapBridge();

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
  usePersonalGymsBootstrapBridge();

  const affiliations = usePersonal("affiliations");

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
  usePersonalFinancialBootstrapBridge();

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
  usePersonalSettingsBootstrapBridge();

  const { profile, membershipPlans } = usePersonal(
    "profile",
    "membershipPlans",
  );

  return (
    <PersonalSettingsPageContent
      profile={profile}
      plans={membershipPlans as PersonalMembershipPlan[]}
      onRefresh={onRefresh}
    />
  );
}

function PersonalStatsTab() {
  usePersonalStatsBootstrapBridge();

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
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("dashboard"),
  );
  const [gymId, setGymId] = useQueryState("gymId", parseAsString);
  const refreshPersonalBootstrap = useInvalidatePersonalBootstrap();

  const refreshGyms = refreshPersonalBootstrap;
  const refreshFinancial = refreshPersonalBootstrap;
  const refreshSettings = refreshPersonalBootstrap;

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
      {tab === "settings" && (
        <PersonalSettingsTab onRefresh={refreshSettings} />
      )}
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
