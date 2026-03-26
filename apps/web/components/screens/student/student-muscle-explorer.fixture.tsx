import type { StudentMuscleExplorerScreenProps } from "./student-muscle-explorer.screen";

export function createStudentMuscleExplorerFixture(
  overrides: Partial<StudentMuscleExplorerScreenProps> = {},
): StudentMuscleExplorerScreenProps {
  return {
    contentSlot: (
      <div className="rounded-2xl border-2 border-dashed border-duo-border p-6 text-center text-sm text-duo-gray-dark">
        Muscle explorer content placeholder
      </div>
    ),
    onViewChange: () => undefined,
    searchSlot: (
      <div className="rounded-2xl border-2 border-dashed border-duo-border p-4 text-sm text-duo-gray-dark">
        Search placeholder
      </div>
    ),
    view: "muscles",
    ...overrides,
  };
}
