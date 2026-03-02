"use client";

import { Dumbbell } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DuoButton } from "@/components/duo";
import { useModalState } from "@/hooks/use-modal-state";
import { useWorkoutExecution } from "@/hooks/use-workout-execution";
import { useWorkoutStore } from "@/stores";
import { ExerciseAlternativeSelector } from "../modals/exercise-alternative-selector";
import { CardioConfigModal } from "./workout/cardio-config-modal";
import { ExerciseCardView } from "./workout/exercise-card-view";
import { WeightTrackerOverlay } from "./workout/weight-tracker-overlay";
import { WorkoutCompletionView } from "./workout/workout-completion-view";
import { WorkoutFooter } from "./workout/workout-footer";
import { WorkoutHeader } from "./workout/workout-header";

/**
 * Refactored WorkoutModal
 * Logic extracted to useWorkoutExecution hook
 * UI broken down into sub-components
 */
function WorkoutModalSimple() {
  const {
    workout,
    activeWorkout,
    currentIndex,
    currentExercise,
    totalExercises,
    workoutProgress,
    skippedExercises,
    skippedExerciseIndices,
    showCompletion,
    completedWorkoutData,
    cardioState,
    modals,
    handlers,
    methods,
    actions,
  } = useWorkoutExecution();

  const { isRunning, elapsedTime, calories, heartRate, setIsRunning } =
    cardioState;
  const {
    workoutModal,
    weightTrackerModal,
    alternativeSelectorModal,
    cardioConfigModal,
  } = modals;
  const editPlanModal = useModalState("edit-plan");

  // View logic for Completion screen
  if (showCompletion && workout) {
    const workoutData = completedWorkoutData || {
      exerciseLogs: activeWorkout?.exerciseLogs || [],
      xpEarned: activeWorkout?.xpEarned || 0,
      skippedExercises: activeWorkout?.skippedExercises || [],
    };

    const totalVolume = workoutData.exerciseLogs.reduce(
      (acc, log) =>
        acc +
        (log.sets
          ?.filter((set) => (set.weight || 0) > 0 && (set.reps || 0) > 0)
          .reduce(
            (setAcc, set) => setAcc + (set.weight || 0) * (set.reps || 0),
            0,
          ) || 0),
      0,
    );

    return (
      <WorkoutCompletionView.Simple
        workout={workout}
        workoutData={workoutData}
        totalVolume={totalVolume}
        onClose={handlers.handleClose}
        onRepeat={() => {
          if (!workout) return;
          useWorkoutStore.getState().clearWorkoutProgress(workout.id);
          actions.setActiveWorkout(workout);
          actions.setShowCompletion(false);
          actions.setCompletedWorkoutData(null);
        }}
      />
    );
  }

  // Estado vazio: workout existe mas não tem exercícios
  if (workout && totalExercises === 0 && workoutModal.isOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-2xl bg-duo-bg-card p-8 max-w-md mx-4 shadow-xl border border-duo-border">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 rounded-full bg-duo-green/10 flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-duo-green" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-duo-text mb-1">
                Este dia ainda não tem exercícios
              </h3>
              <p className="text-sm text-duo-fg-muted">
                Adicione exercícios para começar a treinar. Você pode editar o
                plano e adicionar os exercícios aqui.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <DuoButton
                className="flex-1 bg-duo-green hover:bg-duo-green-dark text-white font-bold"
                onClick={() => {
                  handlers.handleClose();
                  editPlanModal.open();
                }}
              >
                <Dumbbell className="h-4 w-4 mr-2" />
                Adicionar exercícios
              </DuoButton>
              <DuoButton
                variant="outline"
                className="flex-1"
                onClick={handlers.handleClose}
              >
                Fechar
              </DuoButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading / Null states
  if (!activeWorkout || !currentExercise || !workout) {
    if (workoutModal.isOpen && !workout) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-duo-bg-card p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-duo-blue border-t-transparent" />
              <p className="text-sm text-duo-gray-dark">Carregando treino...</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {workoutModal.isOpen && (
        <motion.div
          key={workout.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex h-screen flex-col bg-duo-bg overflow-hidden"
        >
          {/* Sub-Modals & Overlays */}
          <WeightTrackerOverlay.Simple
            isOpen={weightTrackerModal.isOpen}
            onClose={weightTrackerModal.close}
            exerciseName={methods.getCurrentExerciseName()}
            exercise={currentExercise}
            progress={workoutProgress}
            currentExercise={currentIndex + 1}
            totalExercises={totalExercises}
            exerciseIds={workout.exercises.map((ex) => ex.id)}
            completedExerciseIds={activeWorkout.exerciseLogs.map(
              (log) => log.exerciseId,
            )}
            skippedExerciseIds={skippedExercises}
            skippedIndices={skippedExerciseIndices}
            currentExerciseId={currentExercise.id}
            onComplete={handlers.handleExerciseComplete}
            onSaveProgress={handlers.handleSaveProgress}
            existingLog={methods.getCurrentExerciseLog()}
            isUnilateral={methods.isCurrentExerciseUnilateral()}
          />

          <CardioConfigModal.Simple
            isOpen={cardioConfigModal.isOpen}
            onClose={cardioConfigModal.close}
            onSelectPreference={actions.setCardioPreference}
          />

          <WorkoutHeader.Simple
            onClose={handlers.handleClose}
            hearts={5} // Default value or could be dynamic
            currentExercise={currentIndex + 1}
            totalExercises={totalExercises}
            progress={workoutProgress}
            exerciseIds={workout.exercises.map((ex) => ex.id)}
            completedExerciseIds={activeWorkout.exerciseLogs.map(
              (log) => log.exerciseId,
            )}
            skippedExerciseIds={skippedExercises}
            skippedIndices={skippedExerciseIndices}
          />

          {/* Main Exercise Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center justify-center p-4 sm:p-6 min-h-0">
            <div className="w-full max-w-2xl">
              <AnimatePresence mode="wait">
                <ExerciseCardView.Simple
                  key={currentIndex}
                  exercise={currentExercise}
                  exerciseName={methods.getCurrentExerciseName()}
                  hasAlternative={
                    !!activeWorkout.selectedAlternatives?.[currentExercise.id]
                  }
                  isCardio={!!methods.isCurrentExerciseCardio()}
                  elapsedTime={elapsedTime}
                  xpPerExercise={Math.round(workout.xpReward / totalExercises)}
                  onViewEducation={() => handlers.handleViewEducation()}
                  isCompleted={!!methods.getCurrentExerciseLog()}
                  completedSetsCount={
                    methods.getCurrentExerciseLog()?.sets?.length || 0
                  }
                />
              </AnimatePresence>
            </div>
          </div>

          <WorkoutFooter.Simple
            isCardio={!!methods.isCurrentExerciseCardio()}
            isRunning={isRunning}
            currentExercise={currentExercise}
            canGoBack={currentIndex > 0}
            isLastExercise={currentIndex + 1 >= totalExercises}
            onToggleCardio={() => setIsRunning(!isRunning)}
            onOpenWeightTracker={weightTrackerModal.open}
            onOpenAlternatives={alternativeSelectorModal.open}
            onCompleteCardio={() => {
              const existingLog = methods.getCurrentExerciseLog();
              if (existingLog) {
                handlers.handleExerciseComplete(existingLog);
              } else {
                // Create minimal log for cardio if it doesn't exist
                handlers.handleExerciseComplete({
                  id: `cardio-${Date.now()}`,
                  workoutId: workout.id,
                  exerciseId: currentExercise.id,
                  exerciseName: methods.getCurrentExerciseName(),
                  sets: [
                    {
                      setNumber: 1,
                      reps: parseInt(currentExercise.reps || "0", 10),
                      weight: 0,
                      completed: true,
                    },
                  ],
                  date: new Date(),
                  difficulty: "ideal",
                });
              }
            }}
            onGoBack={() => {
              const newIndex = currentIndex - 1;
              actions.setCurrentExerciseIndex(newIndex);
              actions.setExerciseIndexParam(newIndex);
            }}
            onFinish={handlers.handleFinish}
            onSkip={handlers.handleSkip}
          />

          <AnimatePresence>
            {alternativeSelectorModal.isOpen && (
              <ExerciseAlternativeSelector
                exercise={currentExercise}
                onSelect={handlers.handleSelectAlternative}
                onCancel={alternativeSelectorModal.close}
                onViewEducation={(id) => handlers.handleViewEducation(id)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const WorkoutModal = {
  Simple: WorkoutModalSimple,
};
