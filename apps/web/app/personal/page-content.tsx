"use client";

import { motion } from "motion/react";
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

function PersonalHomeContent() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("dashboard"));
  const [gymId, setGymId] = useQueryState("gymId", parseAsString);
  usePersonalInitializer();
  useLoadPrioritizedPersonal({ onlyPriorities: true });

  const { loadAll } = usePersonal("loaders");
  const {
    profile,
    affiliations,
    students,
    studentDirectory,
    subscription,
    financialSummary,
    expenses: storeExpenses,
    payments: storePayments,
    coupons: storeCoupons,
    campaigns: storeCampaigns,
    membershipPlans: storePlans,
  } = usePersonal(
    "profile",
    "affiliations",
    "students",
    "studentDirectory",
    "subscription",
    "financialSummary",
    "expenses",
    "payments",
    "coupons",
    "campaigns",
    "membershipPlans",
  );

  const load = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  const stats = useMemo(() => {
    const studentsViaGym = students.filter((item) => item.gym?.id).length;
    const independentStudents = students.length - studentsViaGym;
    return {
      gyms: affiliations.length,
      students: students.length,
      studentsViaGym,
      independentStudents,
    };
  }, [affiliations.length, students]);

  return (
    <motion.div
      key={tab}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-6"
    >
      {tab === "dashboard" && (
        <PersonalDashboardPageContent
          profile={profile}
          stats={stats}
          affiliations={affiliations}
          students={students}
          subscription={subscription}
          financialSummary={financialSummary}
          onViewGym={(id) => {
            setTab("gyms");
            setGymId(id);
          }}
        />
      )}
      {tab === "students" && (
        <PersonalStudentsPageContent
          students={studentDirectory as unknown as StudentData[]}
          affiliations={affiliations}
        />
      )}
      {tab === "gyms" && (
        <PersonalGymsPageContent
          affiliations={affiliations}
          onRefresh={load}
          gymId={gymId ?? null}
          onViewGym={(id) => setGymId(id)}
          onBackFromGym={() => setGymId(null)}
        />
      )}
      {tab === "financial" && (
        <PersonalFinancialPageContent
          subscription={subscription}
          financialSummary={financialSummary}
          expenses={storeExpenses}
          payments={storePayments}
          coupons={storeCoupons}
          campaigns={storeCampaigns}
          plans={storePlans as unknown as MembershipPlan[]}
          onRefresh={load}
        />
      )}
      {tab === "settings" && (
        <PersonalSettingsPageContent
          profile={profile}
          plans={storePlans}
          onRefresh={load}
        />
      )}
      {tab === "stats" && (
        <PersonalStatsPageContent
          gyms={stats.gyms}
          students={stats.students}
          studentsViaGym={stats.studentsViaGym}
          independentStudents={stats.independentStudents}
        />
      )}
      {tab === "more" && <PersonalMoreMenu.Simple />}
    </motion.div>
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
