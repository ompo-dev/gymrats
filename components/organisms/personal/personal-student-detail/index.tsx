"use client";

import { ArrowLeft } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoSelect } from "@/components/duo";
import type { PersonalStudentAssignmentForDetail } from "./hooks/use-personal-student-detail";
import { usePersonalStudentDetail } from "./hooks/use-personal-student-detail";
import {
  PersonalOverviewTab,
  PersonalWorkoutsTab,
  PersonalDietTab,
  PersonalProgressTab,
  PersonalRecordsTab,
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
  } = usePersonalStudentDetail({
    studentId,
    assignment,
    onBack,
  });

  const studentName = assignment.student?.user?.name ?? "Aluno";
  const studentEmail = assignment.student?.user?.email ?? "";
  const gymName = assignment.gym?.name;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="flex items-center gap-4">
          <DuoButton variant="outline" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </DuoButton>
          <div>
            <h1 className="text-2xl font-bold text-duo-text">{studentName}</h1>
            <p className="text-sm text-duo-fg-muted">
              {gymName ? `Via ${gymName}` : "Atendimento independente"}
            </p>
          </div>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <h2 className="font-bold text-duo-fg">Categoria</h2>
          </DuoCard.Header>
          <DuoSelect.Simple
            options={tabOptions}
            value={activeTab}
            onChange={(v) => setActiveTab(v as typeof activeTab)}
            placeholder="Selecione"
          />
        </DuoCard.Root>
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
