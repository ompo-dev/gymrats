import { Suspense } from "react";
import GymHome from "./page-content";
import {
  getGymProfile,
  getGymStats,
  getGymStudents,
  getGymEquipment,
  getGymFinancialSummary,
  getGymRecentCheckIns,
} from "./actions";

export default async function GymPage() {
  const [
    profile,
    stats,
    students,
    equipment,
    financialSummary,
    recentCheckIns,
  ] = await Promise.all([
    getGymProfile(),
    getGymStats(),
    getGymStudents(),
    getGymEquipment(),
    getGymFinancialSummary(),
    getGymRecentCheckIns(),
  ]);

  return (
    <GymHome
      initialProfile={profile}
      initialStats={stats}
      initialStudents={students}
      initialEquipment={equipment}
      initialFinancialSummary={financialSummary}
      initialRecentCheckIns={recentCheckIns}
    />
  );
}
