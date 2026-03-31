import type { StudentPersonalListWithFiltersScreenProps } from "./student-personal-list-with-filters.screen";

export function createStudentPersonalListWithFiltersFixture(
  overrides: Partial<StudentPersonalListWithFiltersScreenProps> = {},
): StudentPersonalListWithFiltersScreenProps {
  return {
    contentSlot: (
      <div className="rounded-2xl border-2 border-dashed border-duo-border p-6 text-center text-sm text-duo-gray-dark">
        Personal list placeholder
      </div>
    ),
    filterOptions: [
      { value: "all", label: "Todos" },
      { value: "near", label: "Proximos" },
    ],
    onFilterChange: () => undefined,
    selectedFilter: "all",
    ...overrides,
  };
}
