"use client";

import { StudentProfileScreen } from "@/components/screens/student";
import { MyAcademiasCard, MyPersonalsCard } from "./components";
import { useProfilePage } from "./hooks/use-profile-page";

/**
 * Student profile container.
 *
 * This file remains responsible for orchestration only:
 * - consume the unified student store
 * - wire navigation and mutations
 * - mount the canonical profile screen
 */
export function ProfilePageContent() {
  const {
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
  } = useProfilePage();

  return (
    <StudentProfileScreen
      profileUserInfo={profileUserInfo}
      totalWorkoutsCompleted={totalWorkoutsCompleted}
      displayProgress={displayProgress}
      weeklyWorkouts={weeklyWorkouts}
      weightHistory={weightHistoryLocal}
      currentWeight={currentWeight}
      weightGain={weightGain}
      hasWeightLossGoal={hasWeightLossGoal}
      recentWorkoutHistory={recentWorkoutHistory}
      personalRecords={personalRecords}
      lastInProgressWorkout={lastInProgressWorkout}
      isAdmin={isAdmin}
      isWeightModalOpen={weightModal.isOpen}
      newWeight={newWeight}
      gymsSlot={<MyAcademiasCard />}
      personalsSlot={<MyPersonalsCard />}
      onNewWeightChange={setNewWeight}
      onCloseWeightModal={weightModal.close}
      onOpenWeightModal={handleOpenWeightModal}
      onSaveWeight={handleSaveWeight}
      onOpenWorkout={() => router.push(firstWorkoutUrl)}
      onSwitchToGym={handleSwitchToGym}
      onLogout={handleLogout}
    />
  );
}
