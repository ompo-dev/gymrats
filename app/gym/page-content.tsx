"use client";

import { parseAsString, useQueryState } from "nuqs";
import { Suspense } from "react";
import { GymDashboardPage } from "./components/gym-dashboard";
import { GymStudentsPage } from "./components/gym-students";
import { GymEquipmentPage } from "./components/gym-equipment";
import { GymFinancialPage } from "./components/gym-financial";
import { GymStatsPage } from "./components/gym-stats";
import { GymSettingsPage } from "./components/gym-settings";
import { GymGamificationPage } from "./components/gym-gamification";
import { GymMoreMenu } from "@/components/gym-more-menu";
import type {
  GymProfile,
  GymStats,
  StudentData,
  Equipment,
  FinancialSummary,
  CheckIn,
} from "@/lib/types";

interface GymHomeContentProps {
  initialProfile: GymProfile;
  initialStats: GymStats;
  initialStudents: StudentData[];
  initialEquipment: Equipment[];
  initialFinancialSummary: FinancialSummary;
  initialRecentCheckIns?: CheckIn[];
}

function GymHomeContent({
  initialProfile,
  initialStats,
  initialStudents,
  initialEquipment,
  initialFinancialSummary,
  initialRecentCheckIns,
}: GymHomeContentProps) {
  const [tab] = useQueryState("tab", parseAsString.withDefault("dashboard"));

  return (
    <div className="px-4 py-6">
      {tab === "dashboard" && (
        <GymDashboardPage
          profile={initialProfile}
          stats={initialStats}
          students={initialStudents}
          equipment={initialEquipment}
          recentCheckIns={initialRecentCheckIns}
        />
      )}
      {tab === "students" && <GymStudentsPage students={initialStudents} />}
      {tab === "equipment" && <GymEquipmentPage equipment={initialEquipment} />}
      {tab === "financial" && (
        <GymFinancialPage financialSummary={initialFinancialSummary} />
      )}
      {tab === "stats" && (
        <GymStatsPage stats={initialStats} equipment={initialEquipment} />
      )}
      {tab === "settings" && <GymSettingsPage profile={initialProfile} />}
      {tab === "gamification" && (
        <GymGamificationPage profile={initialProfile} />
      )}
      {tab === "more" && <GymMoreMenu />}
    </div>
  );
}

export default function GymHome({
  initialProfile,
  initialStats,
  initialStudents,
  initialEquipment,
  initialFinancialSummary,
  initialRecentCheckIns,
}: GymHomeContentProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          Carregando...
        </div>
      }
    >
      <GymHomeContent
        initialProfile={initialProfile}
        initialStats={initialStats}
        initialStudents={initialStudents}
        initialEquipment={initialEquipment}
        initialFinancialSummary={initialFinancialSummary}
        initialRecentCheckIns={initialRecentCheckIns}
      />
    </Suspense>
  );
}
