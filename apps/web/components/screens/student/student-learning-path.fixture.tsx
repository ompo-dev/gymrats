import type { StudentLearningPathScreenProps } from "./student-learning-path.screen";

export function createStudentLearningPathFixture(
  overrides: Partial<StudentLearningPathScreenProps> = {},
): StudentLearningPathScreenProps {
  return {
    hasPlan: false,
    nodesSlot: (
      <div className="rounded-2xl border-2 border-dashed border-duo-border p-6 text-center text-sm text-duo-gray-dark">
        Weekly plan placeholder
      </div>
    ),
    onCreatePlan: () => undefined,
    onOpenLibrary: () => undefined,
    sectionLabel: "7 dias - Segunda a Domingo",
    title: "Plano Semanal",
    ...overrides,
  };
}
