"use client";

import { motion } from "motion/react";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type {
  PersonalAffiliation,
  PersonalProfile,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
} from "./types";
import { PersonalDashboardPageContent } from "./_dashboard/page-content";
import { PersonalFinancialPageContent } from "./_financial/page-content";
import { PersonalGymsPageContent } from "./_gyms/page-content";
import { PersonalSettingsPageContent } from "./_settings/page-content";
import { PersonalStatsPageContent } from "./_stats/page-content";
import { PersonalStudentsPageContent } from "./_students/page-content";
import { PersonalMoreMenu } from "@/components/organisms/navigation/personal-more-menu";
import { usePersonalInitializer } from "@/hooks/use-personal-initializer";
import { useLoadPrioritizedPersonal } from "@/hooks/use-load-prioritized-personal";
import { usePersonalUnifiedStore } from "@/stores/personal-unified-store";
import { getPersonalStudentsAsStudentData } from "./actions";
import type {
  BoostCampaign,
  Coupon,
  Expense,
  FinancialSummary,
  MembershipPlan,
  Payment,
  StudentData,
} from "@/lib/types";
import { PersonalMembershipPlan } from "./actions";

interface PersonalHomeProps {
  initialProfile: PersonalProfile | null;
  initialAffiliations: PersonalAffiliation[];
  initialStudents: PersonalStudentAssignment[];
  initialSubscription: PersonalSubscriptionData | null;
  initialFinancialSummary: FinancialSummary | null;
  initialPayments: Payment[];
  initialCoupons: Coupon[];
  initialExpenses: Expense[];
  initialCampaigns: BoostCampaign[];
  initialPlans: PersonalMembershipPlan[];
}

function PersonalHomeContent({
  initialProfile,
  initialAffiliations,
  initialStudents,
  initialSubscription,
  initialFinancialSummary,
  initialPayments,
  initialCoupons,
  initialExpenses,
  initialCampaigns,
  initialPlans,
}: PersonalHomeProps) {
  const [tab] = useQueryState("tab", parseAsString.withDefault("dashboard"));
  const [gymId, setGymId] = useQueryState("gymId", parseAsString);
  const hydrateInitial = usePersonalUnifiedStore((state) => state.hydrateInitial);
  const loadAll = usePersonalUnifiedStore((state) => state.loadAll);
  usePersonalInitializer();
  useLoadPrioritizedPersonal({ onlyPriorities: true });

  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  useEffect(() => {
    hydrateInitial({
      profile: initialProfile,
      affiliations: initialAffiliations,
      students: initialStudents,
      subscription: initialSubscription,
      financialSummary: initialFinancialSummary,
      expenses: initialExpenses,
    });
  }, [
    hydrateInitial,
    initialProfile,
    initialAffiliations,
    initialStudents,
    initialSubscription,
    initialFinancialSummary,
    initialExpenses,
  ]);

  // Load StudentData[] when students tab is active
  useEffect(() => {
    if (tab === "students" && !studentsLoaded) {
      getPersonalStudentsAsStudentData().then((data) => {
        setStudentsData(data);
        setStudentsLoaded(true);
      });
    }
  }, [tab, studentsLoaded]);

  const store = usePersonalUnifiedStore((state) => state.data);
  const profile = store.profile ?? initialProfile;
  const affiliations =
    store.affiliations.length > 0 ? store.affiliations : initialAffiliations;
  const students =
    store.students.length > 0 ? store.students : initialStudents;
  const subscription = store.subscription ?? initialSubscription;

  const financialSummary = store.financialSummary ?? null;
  const storeExpenses = store.expenses ?? [];

  const load = useCallback(async () => {
    await loadAll();
    setStudentsLoaded(false); // Force reload on next visit
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
        />
      )}
      {tab === "students" && (
        <PersonalStudentsPageContent
          students={studentsData}
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
          payments={initialPayments}
          coupons={initialCoupons}
          campaigns={initialCampaigns}
          plans={initialPlans as unknown as MembershipPlan[]}
          onRefresh={load}
        />
      )}
      {tab === "settings" && (
        <PersonalSettingsPageContent
          profile={profile}
          plans={initialPlans}
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

export default function PersonalHome({
  initialProfile,
  initialAffiliations,
  initialStudents,
  initialSubscription,
  initialFinancialSummary,
  initialPayments,
  initialCoupons,
  initialExpenses,
  initialCampaigns,
  initialPlans,
}: PersonalHomeProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          Carregando...
        </div>
      }
    >
      <PersonalHomeContent
        initialProfile={initialProfile}
        initialAffiliations={initialAffiliations}
        initialStudents={initialStudents}
        initialSubscription={initialSubscription}
        initialFinancialSummary={initialFinancialSummary}
        initialPayments={initialPayments}
        initialCoupons={initialCoupons}
        initialExpenses={initialExpenses}
        initialCampaigns={initialCampaigns}
        initialPlans={initialPlans}
      />
    </Suspense>
  );
}

