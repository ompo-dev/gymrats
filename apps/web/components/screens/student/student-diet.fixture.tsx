import type { StudentDietScreenProps } from "./student-diet.screen";

export function createStudentDietFixture(
  overrides: Partial<StudentDietScreenProps> = {},
): StudentDietScreenProps {
  return {
    caloriesPercentage: 72,
    completedMeals: 3,
    foodSearchModalSlot: null,
    trackerSlot: (
      <div className="rounded-2xl border-2 border-dashed border-duo-border p-6 text-center text-sm text-duo-gray-dark">
        Nutrition tracker placeholder
      </div>
    ),
    totalMeals: 5,
    ...overrides,
  };
}
