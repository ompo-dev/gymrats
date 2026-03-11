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
import { useGymInitializer } from "@/hooks/use-gym-initializer";
import { useGymsList } from "@/hooks/use-gyms-list";
import { useLoadPrioritizedGym } from "@/hooks/use-load-prioritized-gym";
import { useUserSession } from "@/hooks/use-user-session";
import { useGymUnifiedStore } from "@/stores/gym-unified-store";

function GymHomeContent() {
  const router = useRouter();
  const { activeGymId } = useGymsList();
  const { isAdmin, role } = useUserSession();
  const userIsAdmin = isAdmin || role === "ADMIN";
  useGymInitializer();
  useLoadPrioritizedGym({ onlyPriorities: true });

  const store = useGymUnifiedStore((state) => state.data);
  const profile = store.profile;
  const stats = store.stats;
  const students = store.students ?? [];
  const equipment = store.equipment ?? [];
  const financialSummary = store.financialSummary;
  const recentCheckIns = store.recentCheckIns ?? [];
  const plans = store.membershipPlans ?? [];
  const payments = store.payments ?? [];
  const expenses = store.expenses ?? [];
  const coupons = store.coupons ?? [];
  const campaigns = store.campaigns ?? [];
  const balanceWithdraws = store.balanceWithdraws;
  const subscription = store.subscription;

  // Usar valor padrão para evitar problemas de SSR
  const [tab] = useQueryState("tab", parseAsString.withDefault("dashboard"));

  // Bloquear acesso à gamificação para não-admin (redireciona e não renderiza)
  useEffect(() => {
    if (tab === "gamification" && !userIsAdmin) {
      router.replace("/gym?tab=dashboard");
    }
  }, [tab, userIsAdmin, router]);

  // key força remount ao trocar academia, evitando estado desatualizado
  return (
    <div key={activeGymId || "gym"} className="px-4 py-6">
      {tab === "dashboard" && profile && stats && (
        <GymDashboardPage
          profile={profile}
          stats={stats}
          students={students}
          equipment={equipment}
          recentCheckIns={recentCheckIns}
          subscription={subscription}
        />
      )}
      {tab === "students" && <GymStudentsPage students={students ?? []} />}
      {tab === "equipment" && <GymEquipmentPage equipment={equipment} />}
      {tab === "financial" && (
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
      )}
      {tab === "stats" && stats && (
        <GymStatsPage stats={stats} equipment={equipment} />
      )}
      {tab === "settings" && profile && (
        <GymSettingsPage profile={profile} plans={plans} />
      )}
      {tab === "gamification" && profile && userIsAdmin && (
        <GymGamificationPage profile={profile} />
      )}
      {tab === "more" && <GymMoreMenu.Simple />}
    </div>
  );
}

export default function GymHome({
}: Record<string, never> = {}) {
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
