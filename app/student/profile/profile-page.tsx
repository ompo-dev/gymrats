"use client";

import { ProfilePageContent } from "./profile-content";
import type { UserProgress, WorkoutHistory, PersonalRecord } from "@/lib/types";

interface ProfilePageProps {
  progress: UserProgress;
  workoutHistory: WorkoutHistory[];
  personalRecords: PersonalRecord[];
  weightHistory: Array<{ date: Date | string; weight: number }>;
  userInfo?: { isAdmin: boolean; role: string | null };
}

export function ProfilePage({
  progress,
  workoutHistory,
  personalRecords,
  weightHistory,
  userInfo = { isAdmin: false, role: null },
}: ProfilePageProps) {
  // Debug: verificar o que está chegando
  console.log("[ProfilePage] userInfo recebido:", userInfo, "JSON:", JSON.stringify(userInfo));
  
  return (
    <ProfilePageContent
      progress={progress}
      workoutHistory={workoutHistory}
      personalRecords={personalRecords}
      weightHistory={weightHistory}
      userInfo={userInfo}
    />
  );
}
