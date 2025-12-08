"use client";

import { ProfilePageContent } from "./profile-content";
import type { UserProgress, WorkoutHistory, PersonalRecord } from "@/lib/types";

interface ProfilePageProps {
  progress: UserProgress;
  workoutHistory: WorkoutHistory[];
  personalRecords: PersonalRecord[];
  weightHistory: Array<{ date: Date | string; weight: number }>;
}

export function ProfilePage({
  progress,
  workoutHistory,
  personalRecords,
  weightHistory,
}: ProfilePageProps) {
  return (
    <ProfilePageContent
      progress={progress}
      workoutHistory={workoutHistory}
      personalRecords={personalRecords}
      weightHistory={weightHistory}
    />
  );
}
