import { Suspense } from "react";
import GymDashboardPage from "./page-content";
import {
  getGymProfile,
  getGymStats,
  getGymStudents,
  getGymEquipment,
  getGymRecentCheckIns,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [profile, stats, students, equipment, recentCheckIns] =
    await Promise.all([
      getGymProfile(),
      getGymStats(),
      getGymStudents(),
      getGymEquipment(),
      getGymRecentCheckIns(),
    ]);

  return (
    <GymDashboardPage
      profile={profile}
      stats={stats}
      students={students}
      equipment={equipment}
      recentCheckIns={recentCheckIns}
    />
  );
}
