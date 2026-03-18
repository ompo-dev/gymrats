"use client";

import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useEffect } from "react";
import { GymDashboardPage } from "@/components/organisms/gym/gym-dashboard";
import { GymEquipmentPage } from "@/components/organisms/gym/gym-equipment";
import { GymFinancialPage } from "@/components/organisms/gym/gym-financial";
import { GymGamificationPage } from "@/components/organisms/gym/gym-gamification";
import { GymSettingsPage } from "@/components/organisms/gym/gym-settings";
import { GymStatsPage } from "@/components/organisms/gym/gym-stats";
import { GymStudentsPage } from "@/components/organisms/gym/gym-students";
import { GymMoreMenu } from "@/components/organisms/navigation/gym-more-menu";
import { useGym } from "@/hooks/use-gym";
import { useGymInitializer } from "@/hooks/use-gym-initializer";
import { useLoadPrioritizedGym } from "@/hooks/use-load-prioritized-gym";
import { useUserSession } from "@/hooks/use-user-session";
import { normalizeEquipmentList } from "@/lib/utils/gym/normalize-equipment";

function GymDashboardTab() {
  const {
    profile,
    stats,
    students = [],
    equipment: rawEquipment = [],
    recentCheckIns = [],
    subscription,
  } = useGym(
    "profile",
    "stats",
    "students",
    "equipment",
    "recentCheckIns",
    "subscription",
  );
  const equipment = normalizeEquipmentList(rawEquipment);

  if (!profile || !stats) {
    return null;
  }

  return (
    <GymDashboardPage
      profile={profile}
      stats={stats}
      students={students}
      equipment={equipment}
      recentCheckIns={recentCheckIns}
      subscription={subscription}
    />
  );
}

function GymStudentsTab() {
  const { students = [] } = useGym("students");
  return <GymStudentsPage students={students} />;
}

function GymEquipmentTab() {
  const { equipment: rawEquipment = [] } = useGym("equipment");
  return <GymEquipmentPage equipment={normalizeEquipmentList(rawEquipment)} />;
}

function GymFinancialTab() {
  const {
    financialSummary,
    payments = [],
    coupons = [],
    campaigns = [],
    membershipPlans: plans = [],
    expenses = [],
    balanceWithdraws,
    subscription,
  } = useGym(
    "financialSummary",
    "payments",
    "coupons",
    "campaigns",
    "membershipPlans",
    "expenses",
    "balanceWithdraws",
    "subscription",
  );

  return (
    <GymFinancialPage
      financialSummary={financialSummary}
      payments={payments}
      coupons={coupons}
      campaigns={campaigns}
      plans={plans}
      expenses={expenses}
      balanceReais={balanceWithdraws?.balanceReais ?? 0}
      balanceCents={balanceWithdraws?.balanceCents ?? 0}
      withdraws={balanceWithdraws?.withdraws ?? []}
      subscription={subscription}
    />
  );
}

function GymStatsTab() {
  const { stats, equipment: rawEquipment = [] } = useGym("stats", "equipment");

  if (!stats) {
    return null;
  }

  return (
    <GymStatsPage
      stats={stats}
      equipment={normalizeEquipmentList(rawEquipment)}
    />
  );
}

function GymSettingsTab() {
  const { profile, membershipPlans: plans = [] } = useGym(
    "profile",
    "membershipPlans",
  );

  if (!profile) {
    return null;
  }

  return <GymSettingsPage profile={profile} plans={plans} />;
}

function GymGamificationTab() {
  const { profile } = useGym("profile");

  if (!profile) {
    return null;
  }

  return <GymGamificationPage profile={profile} />;
}

function GymHomeContent() {
  const router = useRouter();
  const { isAdmin, role } = useUserSession();
  const userIsAdmin = isAdmin || role === "ADMIN";

  useGymInitializer();
  useLoadPrioritizedGym({ onlyPriorities: true });

  const [tab] = useQueryState("tab", parseAsString.withDefault("dashboard"));

  useEffect(() => {
    if (tab === "gamification" && !userIsAdmin) {
      router.replace("/gym?tab=dashboard");
    }
  }, [tab, userIsAdmin, router]);

  return (
    <div className="px-4 py-6">
      {tab === "dashboard" && <GymDashboardTab />}
      {tab === "students" && <GymStudentsTab />}
      {tab === "equipment" && <GymEquipmentTab />}
      {tab === "financial" && <GymFinancialTab />}
      {tab === "stats" && <GymStatsTab />}
      {tab === "settings" && <GymSettingsTab />}
      {tab === "gamification" && userIsAdmin && <GymGamificationTab />}
      {tab === "more" && <GymMoreMenu.Simple />}
    </div>
  );
}

export default function GymHome({}: Record<string, never> = {}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          Carregando...
        </div>
      }
    >
      <GymHomeContent />
    </Suspense>
  );
}
