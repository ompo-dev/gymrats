"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLoadPrioritized } from "@/hooks/use-load-prioritized";
import { useModalState } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import type {
  PersonalRecord,
  Unit,
  UserProgress,
  WorkoutHistory,
  WorkoutSession,
} from "@/lib/types";
import type {
  StudentProfileData,
  UserInfo,
  WeightHistoryItem,
} from "@/lib/types/student-unified";
import { useAuthStore } from "@/stores";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import { useWorkoutStore } from "@/stores/workout-store";

export function useProfilePage() {
  useLoadPrioritized({ context: "profile" });

  const router = useRouter();
  const weightModal = useModalState("weight");
  const [newWeight, setNewWeight] = useState<string>("");

  const { loadWeightHistory, loadProfile, loadProgress, loadUser } =
    useStudent("loaders");

  useEffect(() => {
    const loadData = async () => {
      const state = useStudentUnifiedStore.getState();
      if (!state.data.weightHistory || state.data.weightHistory.length === 0) {
        await loadWeightHistory();
      }
      if (!state.data.profile) {
        await loadProfile();
      }
      if (
        !state.data.progress ||
        state.data.progress.workoutsCompleted === undefined
      ) {
        await loadProgress();
      }
      if (!state.data.user || !state.data.user.email) {
        await loadUser();
      }
    };
    loadData();
  }, [loadWeightHistory, loadProfile, loadProgress, loadUser]);

  useEffect(() => {
    const handleWorkoutCompleted = async () => {
      await loadProgress();
    };
    window.addEventListener("workoutCompleted", handleWorkoutCompleted);
    return () =>
      window.removeEventListener("workoutCompleted", handleWorkoutCompleted);
  }, [loadProgress]);

  const {
    progress: storeProgress,
    weightHistory: storeWeightHistory,
    weightGain: storeWeightGain,
    profile: storeProfileRaw,
    user: storeUserRaw,
    workoutHistory: storeWorkoutHistory,
    personalRecords: storePersonalRecords,
    units: storeUnits,
    isAdmin: storeIsAdmin,
    role: storeRole,
  } = useStudent(
    "progress",
    "weightHistory",
    "weightGain",
    "profile",
    "user",
    "workoutHistory",
    "personalRecords",
    "units",
    "isAdmin",
    "role",
  );

  const { addWeight } = useStudent("actions");

  const progress = (storeProgress as UserProgress | null) ?? null;
  const displayProgress: UserProgress = progress || {
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    currentLevel: 1,
    xpToNextLevel: 100,
    workoutsCompleted: 0,
    todayXP: 0,
    achievements: [],
    lastActivityDate: new Date().toISOString(),
    dailyGoalXP: 50,
    weeklyXP: [0, 0, 0, 0, 0, 0, 0],
  };

  const weightHistoryLocal = Array.isArray(storeWeightHistory)
    ? (storeWeightHistory as WeightHistoryItem[])
    : [];
  const storeProfile = (storeProfileRaw as StudentProfileData | null) ?? null;
  const storeUser = (storeUserRaw as UserInfo | null) ?? null;
  const profile = storeProfile;
  const user = storeUser;

  const currentWeight =
    weightHistoryLocal.length > 0
      ? weightHistoryLocal[0].weight
      : (profile?.weight ?? null);

  let weightGain = typeof storeWeightGain === "number" ? storeWeightGain : null;
  if (weightGain === null && weightHistoryLocal.length > 0) {
    const currentWeightFromHistory = weightHistoryLocal[0]?.weight;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const weightOneMonthAgo = weightHistoryLocal.find(
      (wh: WeightHistoryItem) => new Date(wh.date) <= oneMonthAgo,
    );

    if (weightOneMonthAgo && currentWeightFromHistory) {
      weightGain = currentWeightFromHistory - weightOneMonthAgo.weight;
    } else if (weightHistoryLocal.length > 1 && currentWeightFromHistory) {
      const oldestWeight =
        weightHistoryLocal[weightHistoryLocal.length - 1]?.weight;
      if (oldestWeight) {
        weightGain = currentWeightFromHistory - oldestWeight;
      }
    }
  }

  const workoutHistory = Array.isArray(storeWorkoutHistory)
    ? (storeWorkoutHistory as WorkoutHistory[])
    : [];
  const personalRecords = Array.isArray(storePersonalRecords)
    ? (storePersonalRecords as PersonalRecord[])
    : [];
  const units = Array.isArray(storeUnits) ? (storeUnits as Unit[]) : [];

  const totalWorkoutsCompleted = useMemo(
    () =>
      units.reduce((total: number, unit: Unit) => {
        if (!unit.workouts || !Array.isArray(unit.workouts)) return total;
        return (
          total +
          unit.workouts.filter((w: WorkoutSession) => w.completed === true)
            .length
        );
      }, 0),
    [units],
  );

  const workoutProgress = useWorkoutStore((state) => state.workoutProgress);

  const lastInProgressWorkout = useMemo(() => {
    const progressEntries = Object.entries(workoutProgress);
    const workoutsWithProgress = progressEntries
      .filter(([_, progress]) => progress?.exerciseLogs?.length > 0)
      .map(([workoutId, progress]) => ({
        workoutId,
        progress,
        lastUpdated: progress.lastUpdated
          ? new Date(progress.lastUpdated)
          : progress.startTime,
      }))
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

    if (workoutsWithProgress.length === 0) return null;

    const lastProgress = workoutsWithProgress[0];
    const workout = units
      .flatMap((unit: Unit) => unit.workouts)
      .find((w: WorkoutSession) => w.id === lastProgress.workoutId);

    if (!workout) return null;
    return { workout, progress: lastProgress.progress };
  }, [workoutProgress, units]);

  const recentWorkoutHistory = useMemo(() => {
    if (lastInProgressWorkout) {
      return [
        {
          date:
            lastInProgressWorkout.progress.startTime instanceof Date
              ? lastInProgressWorkout.progress.startTime
              : new Date(lastInProgressWorkout.progress.startTime),
          workoutId: lastInProgressWorkout.workout.id,
          workoutName: lastInProgressWorkout.workout.title,
          duration: Math.round(
            (Date.now() -
              (lastInProgressWorkout.progress.startTime instanceof Date
                ? lastInProgressWorkout.progress.startTime.getTime()
                : new Date(
                    lastInProgressWorkout.progress.startTime,
                  ).getTime())) /
              60000,
          ),
          totalVolume: lastInProgressWorkout.progress.totalVolume || 0,
          exercises: lastInProgressWorkout.progress.exerciseLogs?.map(
            (log) => ({
              id: log.exerciseId,
              exerciseId: log.exerciseId,
              exerciseName: log.exerciseName,
              workoutId: lastInProgressWorkout.workout.id,
              date:
                lastInProgressWorkout.progress.startTime instanceof Date
                  ? lastInProgressWorkout.progress.startTime
                  : new Date(lastInProgressWorkout.progress.startTime),
              sets: log.sets || [],
              notes: log.notes,
              formCheckScore: log.formCheckScore,
              difficulty: log.difficulty || "medio",
            }),
          ),
          overallFeedback: undefined as
            | "excelente"
            | "bom"
            | "regular"
            | "ruim"
            | undefined,
          bodyPartsFatigued: [],
        },
      ];
    }
    return workoutHistory.slice(0, 1);
  }, [lastInProgressWorkout, workoutHistory]);

  const getUsernameFromEmail = (currentUser: UserInfo | null): string => {
    if (!currentUser) return "@usuario";
    if (currentUser.username?.startsWith("@")) return currentUser.username;
    if (currentUser.email) return `@${currentUser.email.split("@")[0]}`;
    return "@usuario";
  };

  const profileUserInfo = user
    ? {
        name: storeUser.name || "Usuário",
        username: getUsernameFromEmail(user),
        memberSince: user.memberSince || "Jan 2025",
      }
    : null;

  const isAdmin = Boolean(storeIsAdmin || storeRole === "ADMIN");

  const firstWorkout =
    units.length > 0 && units[0]?.workouts?.length > 0
      ? units[0].workouts[0]
      : null;

  const firstWorkoutUrl = firstWorkout
    ? `/student?tab=learn&modal=workout&workoutId=${firstWorkout.id}`
    : "/student?tab=learn";

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyWorkouts = workoutHistory.filter(
    (w: WorkoutHistory) => new Date(w.date) >= oneWeekAgo,
  ).length;

  const hasWeightLossGoal = Boolean(storeProfile?.hasWeightLossGoal);

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().signOut();

      if (typeof window !== "undefined") {
        window.location.href = "/welcome";
      }
    } catch {
      if (typeof window !== "undefined") {
        window.location.href = "/welcome";
      }
    }
  };

  const handleSwitchToGym = () => router.push("/gym");

  const handleOpenWeightModal = () => {
    setNewWeight(currentWeight?.toFixed(1) || "");
    weightModal.open();
  };

  const handleSaveWeight = async () => {
    const weightValue = parseFloat(newWeight);

    if (Number.isNaN(weightValue) || weightValue <= 0) {
      alert("Por favor, insira um peso válido maior que zero.");
      return;
    }

    weightModal.close();
    setNewWeight("");
    await addWeight(weightValue);
  };

  return {
    weightModal,
    newWeight,
    setNewWeight,
    displayProgress,
    weightHistoryLocal,
    currentWeight,
    weightGain,
    recentWorkoutHistory,
    personalRecords,
    lastInProgressWorkout,
    profileUserInfo,
    totalWorkoutsCompleted,
    weeklyWorkouts,
    hasWeightLossGoal,
    isAdmin,
    firstWorkoutUrl,
    router,
    handleLogout,
    handleSwitchToGym,
    handleOpenWeightModal,
    handleSaveWeight,
  };
}
