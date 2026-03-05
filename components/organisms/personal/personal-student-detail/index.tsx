"use client";

import { Activity, Flame, Target, Users } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import { StudentTabSelector } from "@/components/organisms/gym/gym-student-detail/components/student-tab-selector";
import type { PersonalStudentAssignmentForDetail } from "./hooks/use-personal-student-detail";
import { usePersonalStudentDetail } from "./hooks/use-personal-student-detail";
import {
  PersonalOverviewTab,
  PersonalWorkoutsTab,
  PersonalDietTab,
  PersonalProgressTab,
  PersonalRecordsTab,
  PersonalStudentHeaderCard,
} from "./components";

interface PersonalStudentDetailProps {
  studentId: string;
  assignment: PersonalStudentAssignmentForDetail;
  onBack: () => void;
}

export function PersonalStudentDetail({
  studentId,
  assignment,
  onBack,
}: PersonalStudentDetailProps) {
  const {
    activeTab,
    setActiveTab,
    weeklyPlan,
    dailyNutrition,
    nutritionDate,
    setNutritionDate,
    isLoadingWeeklyPlan,
    isLoadingNutrition,
    fetchNutrition,
    tabOptions,
    openWorkoutsEditor,
    openDietTab,
    handleRemoveAssignment,
    isRemovingAssignment,
  } = usePersonalStudentDetail({
    studentId,
    assignment,
    onBack,
  });

  const progress = assignment.student?.progress;
  const recordsCount = assignment.student?.records?.length ?? 0;
  const studentEmail = assignment.student?.user?.email ?? "";
  const gymName = assignment.gym?.name;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <DuoButton variant="ghost" onClick={onBack} className="gap-2 font-bold">
          Voltar para Alunos
        </DuoButton>
      </FadeIn>

      <SlideIn delay={0.1}>
        <PersonalStudentHeaderCard
          assignment={assignment}
          onAssignWorkout={openWorkoutsEditor}
          onAssignDiet={openDietTab}
          onRemoveAssignment={() => handleRemoveAssignment(studentId)}
          isRemovingAssignment={isRemovingAssignment}
        />
      </SlideIn>

      <SlideIn delay={0.2}>
        <DuoStatsGrid.Root columns={4} className="gap-4">
          <DuoStatCard.Simple
            icon={Target}
            value={String(progress?.currentLevel ?? 1)}
            label="Nível"
            iconColor="var(--duo-secondary)"
          />
          <DuoStatCard.Simple
            icon={Activity}
            value={String(recordsCount)}
            label="Recordes"
            iconColor="var(--duo-primary)"
          />
          <DuoStatCard.Simple
            icon={Flame}
            value="—"
            label="Sequência"
            iconColor="var(--duo-accent)"
          />
          <DuoStatCard.Simple
            icon={Users}
            value="—"
            label="Frequência"
            iconColor="#A560E8"
          />
        </DuoStatsGrid.Root>
      </SlideIn>

      <SlideIn delay={0.3}>
        <StudentTabSelector
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t as typeof activeTab)}
          tabOptions={tabOptions}
        />
      </SlideIn>

      {activeTab === "overview" && (
        <SlideIn delay={0.2}>
          <PersonalOverviewTab
            studentEmail={studentEmail}
            gymName={gymName}
            profile={assignment.student?.profile ?? null}
          />
        </SlideIn>
      )}

      {activeTab === "workouts" && (
        <SlideIn delay={0.2}>
          <PersonalWorkoutsTab
            weeklyPlan={weeklyPlan}
            isLoadingWeeklyPlan={isLoadingWeeklyPlan}
          />
        </SlideIn>
      )}

      {activeTab === "diet" && (
        <SlideIn delay={0.2}>
          <PersonalDietTab
            dailyNutrition={dailyNutrition}
            nutritionDate={nutritionDate}
            isLoadingNutrition={isLoadingNutrition}
            onNutritionDateChange={setNutritionDate}
            onFetchNutrition={fetchNutrition}
          />
        </SlideIn>
      )}

      {activeTab === "progress" && (
        <SlideIn delay={0.2}>
          <PersonalProgressTab progress={assignment.student?.progress ?? null} />
        </SlideIn>
      )}

      {activeTab === "records" && (
        <SlideIn delay={0.2}>
          <PersonalRecordsTab records={assignment.student?.records ?? []} />
        </SlideIn>
      )}
    </div>
  );
}
