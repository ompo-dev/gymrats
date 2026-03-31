import type { StudentCardioScreenProps } from "./student-cardio.screen";

export function createStudentCardioFixture(
  overrides: Partial<StudentCardioScreenProps> = {},
): StudentCardioScreenProps {
  return {
    cardioSlot: (
      <div className="rounded-2xl border-2 border-dashed border-duo-red/40 p-6 text-center text-sm text-duo-gray-dark">
        Cardio tracker placeholder
      </div>
    ),
    functionalSlot: (
      <div className="rounded-2xl border-2 border-dashed border-duo-blue/40 p-6 text-center text-sm text-duo-gray-dark">
        Functional workout placeholder
      </div>
    ),
    onBackToMenu: () => undefined,
    onSelectView: () => undefined,
    view: "menu",
    ...overrides,
  };
}
