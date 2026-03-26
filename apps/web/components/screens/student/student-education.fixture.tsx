import type { StudentEducationScreenProps } from "./student-education.screen";

export function createStudentEducationFixture(
  overrides: Partial<StudentEducationScreenProps> = {},
): StudentEducationScreenProps {
  return {
    onSelectView: () => undefined,
    ...overrides,
  };
}
