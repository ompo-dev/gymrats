"use client";

import type { PlanSlotData, UserProfile, WeeklyPlanData } from "@/lib/types";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import {
  DAY_NAMES,
  UnitDetailsForm,
  useEditUnitModal,
  WorkoutDetailView,
  WorkoutsListSection,
} from "./edit-unit-modal/index";
import { ExerciseSearch } from "./exercise-search";
import { Modal } from "./modal";
import { WorkoutChat } from "./workout-chat";

interface EditUnitModalProps {
  isWeeklyPlanMode?: boolean;
  isLibraryMode?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onPlanUpdated?: () => void;
  apiMode?: "student" | "gym";
  studentId?: string;
  weeklyPlan?: WeeklyPlanData | null;
  loadWeeklyPlan?: (force?: boolean) => Promise<void>;
  profile?: UserProfile;
}

export function EditUnitModal(props: EditUnitModalProps = {}) {
  const api = useEditUnitModal(props);

  const {
    isOpen,
    close,
    isWeeklyPlanMode,
    unitId,
    weeklyPlan,
    planSlots,
    sortedWorkouts,
    title,
    setTitle,
    description,
    setDescription,
    workoutTitle,
    setWorkoutTitle,
    workoutMuscleGroup,
    setWorkoutMuscleGroup,
    workoutItems,
    exerciseItems,
    editingWorkoutId,
    setEditingWorkoutId,
    activeWorkout,
    showExerciseSearch,
    setShowExerciseSearch,
    showWorkoutChat,
    setShowWorkoutChat,
    loadingSlotId,
    chatSlotId,
    setChatSlotId,
    resetting,
    weeklyPlanSlotsKey,
    calculatedEstimatedTime,
    deleteConfirmationId,
    deleteWorkoutConfirmationId,
    saving,
    handleSaveUnit,
    handleResetWeek,
    handleCreateWorkout,
    handleDeleteWorkoutClick,
    confirmDeleteWorkout,
    cancelDeleteWorkout,
    handleAddWorkoutToSlot,
    handleRemoveWorkoutFromSlot,
    handleReorderWorkouts,
    handleUpdateWorkout,
    handleAddExercise,
    handleUpdateExercise,
    handleReorderExercises,
    handleDeleteExercise,
    confirmDeleteExercise,
    cancelDelete,
    goBackFromWorkout,
    closeWorkoutChatWithRefresh,
  } = api;

  if (!isOpen) return null;
  if (isWeeklyPlanMode && !weeklyPlan) return null;

  return (
    <>
      <Modal.Root isOpen={isOpen} onClose={close}>
        <Modal.Header
          title={
            editingWorkoutId
              ? `Editar ${activeWorkout?.title}`
              : "Editar Planejamento"
          }
          onClose={close}
          onBack={editingWorkoutId ? goBackFromWorkout : undefined}
        />

        <Modal.Content maxHeight="none">
          {!editingWorkoutId ? (
            <div className="space-y-8" style={{ minHeight: "400px" }}>
              <UnitDetailsForm
                title={title}
                description={description}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onSave={handleSaveUnit}
                isWeeklyPlanMode={isWeeklyPlanMode}
                onResetWeek={handleResetWeek}
                resetting={resetting}
                saving={saving}
              />
              <WorkoutsListSection
                key={
                  isWeeklyPlanMode ? `weekly-${weeklyPlanSlotsKey}` : undefined
                }
                isWeeklyPlanMode={isWeeklyPlanMode}
                weeklyPlan={weeklyPlan ? { id: String(weeklyPlan.id) } : null}
                planSlots={planSlots}
                workoutItems={workoutItems}
                loadingSlotId={loadingSlotId}
                onChatClick={setChatSlotId}
                onAddWorkoutToSlot={handleAddWorkoutToSlot}
                onRemoveWorkoutFromSlot={handleRemoveWorkoutFromSlot}
                onEditWorkout={setEditingWorkoutId}
                onReorderWorkouts={handleReorderWorkouts}
                onCreateWorkout={handleCreateWorkout}
                onDeleteWorkoutClick={handleDeleteWorkoutClick}
                onOpenWorkoutChat={() => setShowWorkoutChat(true)}
              />
            </div>
          ) : (
            <WorkoutDetailView
              workoutTitle={workoutTitle}
              workoutMuscleGroup={workoutMuscleGroup}
              onWorkoutTitleChange={setWorkoutTitle}
              onWorkoutTitleBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                if (
                  activeWorkout &&
                  e.target.value !== activeWorkout.title &&
                  e.target.value.trim() !== ""
                ) {
                  handleUpdateWorkout(activeWorkout.id, {
                    title: e.target.value,
                  });
                } else if (e.target.value.trim() === "") {
                  setWorkoutTitle(activeWorkout?.title ?? "");
                }
              }}
              onMuscleGroupChange={(value: string) => {
                setWorkoutMuscleGroup(value);
                if (activeWorkout) {
                  handleUpdateWorkout(activeWorkout.id, { muscleGroup: value });
                }
              }}
              activeWorkoutId={editingWorkoutId}
              calculatedEstimatedTime={calculatedEstimatedTime}
              exerciseItems={exerciseItems}
              onReorderExercises={handleReorderExercises}
              onUpdateExercise={handleUpdateExercise}
              onAddExercise={handleAddExercise}
              onDeleteExercise={handleDeleteExercise}
              isWeeklyPlanMode={isWeeklyPlanMode}
              weeklyPlan={weeklyPlan ? { id: String(weeklyPlan.id) } : null}
              planSlots={planSlots}
              onOpenSlotChat={setChatSlotId}
              onOpenWorkoutChat={() => setShowWorkoutChat(true)}
            />
          )}
        </Modal.Content>
      </Modal.Root>

      {showExerciseSearch && editingWorkoutId && isOpen && (
        <ExerciseSearch.Simple
          workoutId={editingWorkoutId}
          onClose={() => setShowExerciseSearch(false)}
          apiMode={props.apiMode}
          studentId={props.studentId}
          profile={props.profile}
          onPlanUpdated={props.onPlanUpdated}
        />
      )}

      {showWorkoutChat && isOpen && unitId && (
        <WorkoutChat
          unitId={unitId}
          workouts={sortedWorkouts}
          onClose={() => setShowWorkoutChat(false)}
          mode={props.apiMode}
          studentId={props.studentId}
          weeklyPlan={props.weeklyPlan}
          profile={props.profile}
          onPlanUpdated={props.onPlanUpdated}
          loadWeeklyPlan={props.loadWeeklyPlan}
        />
      )}

      {chatSlotId && isWeeklyPlanMode && weeklyPlan && (
        <WorkoutChat
          planSlotId={chatSlotId}
          slotContext={
            DAY_NAMES[
              planSlots.find((s: PlanSlotData) => s.id === chatSlotId)
                ?.dayOfWeek ?? 0
            ]
          }
          onClose={closeWorkoutChatWithRefresh}
          mode={props.apiMode}
          studentId={props.studentId}
          weeklyPlan={props.weeklyPlan}
          profile={props.profile}
          onPlanUpdated={props.onPlanUpdated}
          loadWeeklyPlan={props.loadWeeklyPlan}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!deleteConfirmationId}
        onConfirm={confirmDeleteExercise}
        onCancel={cancelDelete}
        title="Remover Exercício?"
        message="Tem certeza que deseja remover este exercício do treino?"
      />

      <DeleteConfirmationModal
        isOpen={!!deleteWorkoutConfirmationId}
        onConfirm={confirmDeleteWorkout}
        onCancel={cancelDeleteWorkout}
        title="Remover Dia de Treino?"
        message="Tem certeza que deseja remover este dia de treino? Todos os exercícios serão removidos também."
      />
    </>
  );
}
