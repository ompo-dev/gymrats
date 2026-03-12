"use client";

import { useState } from "react";
import { Activity, Flame, Target, Users } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import {
  DuoButton,
  DuoCard,
  DuoStatCard,
  DuoStatsGrid,
} from "@/components/duo";
import { NutritionLibraryModal } from "@/components/organisms/modals/nutrition-library-modal";
import type { Payment, StudentData } from "@/lib/types";
import {
  AssignPersonalModal,
  DietTab,
  OverviewTab,
  PaymentsTab,
  ProgressTab,
  RecordsTab,
  StudentHeaderCard,
  StudentTabSelector,
  WorkoutsTab,
} from "./components";
import { useGymStudentDetail } from "./hooks/use-gym-student-detail";

interface GymStudentDetailProps {
  student: StudentData | null;
  payments?: Payment[];
  onBack: () => void;
  variant?: "gym" | "personal";
}

export function GymStudentDetail({
  student,
  payments = [],
  onBack,
  variant = "gym",
}: GymStudentDetailProps) {
  const {
    student: studentData,
    studentPayments,
    activeTab,
    setActiveTab,
    isEditWeeklyPlanOpen,
    setIsEditWeeklyPlanOpen,
    membershipStatus,
    isUpdatingStatus,
    weeklyPlan,
    dailyNutrition,
    nutritionDate,
    setNutritionDate,
    isLoadingWeeklyPlan,
    isLoadingNutrition,
    fetchWeeklyPlan,
    fetchNutrition,
    handleMealComplete,
    handleAddMealSubmit,
    handleAddFood,
    applyNutrition,
    updateTargetWater,
    removeMeal,
    removeFoodFromMeal,
    handleToggleWaterGlass,
    handleMembershipAction,
    handleAssignPersonal,
    isAssigningPersonal,
    togglePaymentStatus,
    tabOptions,
    openWorkoutsEditor,
    openDietTab,
    isNutritionLibraryOpen,
    setIsNutritionLibraryOpen,
    isCurrentNutritionDate,
    handleNutritionPlansSynced,
    createWeeklyPlan,
    studentsApiBase,
  } = useGymStudentDetail({ student, payments, onBack, variant });

  const [assignPersonalOpen, setAssignPersonalOpen] = useState(false);

  const handleOpenAssignPersonal = () => setAssignPersonalOpen(true);

  const handleAssignAndClose = async (personalId: string) => {
    try {
      await handleAssignPersonal(personalId);
      setAssignPersonalOpen(false);
    } catch (error) {
      console.error("[GymStudentDetail] Erro ao atribuir personal:", error);
      alert("Não foi possível atribuir o personal para este aluno.");
    }
  };

  if (!studentData) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <DuoCard.Root
          variant="default"
          size="default"
          className="p-12 text-center"
        >
          <p className="text-xl font-bold text-duo-gray-dark">
            Aluno não encontrado
          </p>
          <DuoButton onClick={onBack} className="mt-4">
            Voltar para Alunos
          </DuoButton>
        </DuoCard.Root>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <DuoButton variant="ghost" onClick={onBack} className="gap-2 font-bold">
          Voltar para Alunos
        </DuoButton>
      </FadeIn>

      <SlideIn delay={0.1}>
        <StudentHeaderCard
          student={studentData}
          membershipStatus={membershipStatus}
          isUpdatingStatus={isUpdatingStatus}
          onMembershipAction={handleMembershipAction}
          onAssignWorkout={openWorkoutsEditor}
          onAssignDiet={openDietTab}
          onAssignPersonal={variant === "personal" ? undefined : handleOpenAssignPersonal}
          isAssigningPersonal={isAssigningPersonal}
        />
        <AssignPersonalModal
          isOpen={assignPersonalOpen}
          onClose={() => setAssignPersonalOpen(false)}
          onAssign={handleAssignAndClose}
          isAssigning={isAssigningPersonal}
        />
      </SlideIn>

      <SlideIn delay={0.2}>
        <DuoStatsGrid.Root columns={4} className="gap-4">
          <DuoStatCard.Simple
            icon={Flame}
            value={String(studentData.currentStreak)}
            label="Sequência"
            iconColor="var(--duo-accent)"
          />
          <DuoStatCard.Simple
            icon={Target}
            value={String(studentData.progress?.currentLevel ?? 1)}
            label="Nível"
            iconColor="var(--duo-secondary)"
          />
          <DuoStatCard.Simple
            icon={Activity}
            value={String(studentData.totalVisits)}
            label="Treinos"
            iconColor="var(--duo-primary)"
          />
          <DuoStatCard.Simple
            icon={Users}
            value={`${studentData.attendanceRate}%`}
            label="Frequência"
            iconColor="#A560E8"
          />
        </DuoStatsGrid.Root>
      </SlideIn>

      <SlideIn delay={0.3}>
        <StudentTabSelector
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabOptions={tabOptions}
        />
      </SlideIn>

      {activeTab === "overview" && (
        <SlideIn delay={0.4}>
          <OverviewTab student={studentData} />
        </SlideIn>
      )}

      {activeTab === "workouts" && (
        <SlideIn delay={0.4}>
          <WorkoutsTab
            student={studentData}
            weeklyPlan={weeklyPlan}
            isLoadingWeeklyPlan={isLoadingWeeklyPlan}
            isEditOpen={isEditWeeklyPlanOpen}
            onEditOpenChange={setIsEditWeeklyPlanOpen}
            onReloadWeeklyPlan={fetchWeeklyPlan}
            onCreateWeeklyPlan={createWeeklyPlan}
          />
        </SlideIn>
      )}

      {activeTab === "diet" && (
        <SlideIn delay={0.4}>
          <DietTab
            student={studentData}
            dailyNutrition={dailyNutrition}
            nutritionDate={nutritionDate}
            isCurrentDate={isCurrentNutritionDate}
            isLoadingNutrition={isLoadingNutrition}
            onNutritionDateChange={setNutritionDate}
            onFetchNutrition={fetchNutrition}
            onMealComplete={handleMealComplete}
            onAddMeal={handleAddMealSubmit}
            onAddFood={handleAddFood}
            onApplyNutrition={applyNutrition}
            onUpdateTargetWater={updateTargetWater}
            onRemoveMeal={removeMeal}
            onRemoveFood={removeFoodFromMeal}
            onToggleWaterGlass={handleToggleWaterGlass}
            onOpenLibrary={() => setIsNutritionLibraryOpen(true)}
            chatStreamUrl={
              studentData
                ? `${studentsApiBase}/${studentData.id}/nutrition/chat-stream`
                : undefined
            }
          />
          {isNutritionLibraryOpen && (
            <NutritionLibraryModal
              apiMode={variant}
              studentId={studentData.id}
              isOpen={isNutritionLibraryOpen}
              onClose={() => setIsNutritionLibraryOpen(false)}
              onPlansSynced={handleNutritionPlansSynced}
            />
          )}
        </SlideIn>
      )}

      {activeTab === "progress" && (
        <SlideIn delay={0.4}>
          <ProgressTab student={studentData} />
        </SlideIn>
      )}

      {activeTab === "records" && (
        <SlideIn delay={0.4}>
          <RecordsTab student={studentData} />
        </SlideIn>
      )}

      {activeTab === "payments" && (
        <SlideIn delay={0.4}>
          <PaymentsTab
            payments={studentPayments}
            onTogglePaymentStatus={togglePaymentStatus}
          />
        </SlideIn>
      )}
    </div>
  );
}
