"use client";

import type { PersonalMembershipPlan } from "@gymrats/types/personal-module";
import { parseAsString, useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { Suspense, useMemo } from "react";
import { PersonalMoreMenu } from "@/components/organisms/navigation/personal-more-menu";
import { invalidateBootstrapDomain } from "@/hooks/use-bootstrap-refresh";
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
  const { profile, subscription, financialSummary } = usePersonal(
    "profile",
    "subscription",
    "financialSummary",
  );
  const { affiliations, students, stats } = usePersonalStatsSnapshot();
  usePersonalDashboardBootstrapBridge({
    enabled:
      !profile &&
      !subscription &&
      !financialSummary &&
      affiliations.length === 0 &&
      students.length === 0,
  });

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
  gymView,
  onViewGym,
  onBackFromGym,
  onOpenGymAccess,
  onBackFromAccess,
  onRefresh,
}: {
  gymId: string | null;
  gymView: string | null;
  onViewGym: (gymId: string) => void;
  onBackFromGym: () => void;
  onOpenGymAccess: () => void;
  onBackFromAccess: () => void;
  onRefresh: () => Promise<void>;
}) {
  usePersonalGymsBootstrapBridge();

  const affiliations = usePersonal("affiliations");

  return (
    <PersonalGymsPageContent
      affiliations={affiliations}
      onRefresh={onRefresh}
      gymId={gymId}
      gymView={gymView}
      onViewGym={onViewGym}
      onBackFromGym={onBackFromGym}
      onOpenGymAccess={onOpenGymAccess}
      onBackFromAccess={onBackFromAccess}
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
  const router = useRouter();
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("dashboard"),
  );
  const [gymId, setGymId] = useQueryState("gymId", parseAsString);
  const [gymView, setGymView] = useQueryState("gymView", parseAsString);
  const refreshPersonalSurface = async () => {
    invalidateBootstrapDomain("personal");
    router.refresh();
  };

  return (
    <div className="px-4 py-6">
      {tab === "dashboard" && (
        <PersonalDashboardTab
          onViewGym={(id) => {
            void (async () => {
              await setGymId(id);
              await setGymView("profile");
              await setTab("gyms");
            })();
          }}
        />
      )}
      {tab === "students" && <PersonalStudentsTab />}
      {tab === "gyms" && (
        <PersonalGymsTab
          gymId={gymId ?? null}
          gymView={gymView ?? null}
          onRefresh={refreshPersonalSurface}
          onViewGym={(id) => {
            void (async () => {
              await setGymId(id);
              await setGymView("profile");
            })();
          }}
          onBackFromGym={() => {
            void (async () => {
              await setGymView(null);
              await setGymId(null);
            })();
          }}
          onOpenGymAccess={() => {
            void setGymView("catracas");
          }}
          onBackFromAccess={() => {
            void setGymView("profile");
          }}
        />
      )}
      {tab === "financial" && (
        <PersonalFinancialTab onRefresh={refreshPersonalSurface} />
      )}
      {tab === "settings" && (
        <PersonalSettingsTab onRefresh={refreshPersonalSurface} />
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
