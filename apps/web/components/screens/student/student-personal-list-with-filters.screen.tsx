"use client";

import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { DuoCard, DuoSelect } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";

export interface StudentPersonalListWithFiltersScreenOption {
  label: string;
  value: string;
}

export interface StudentPersonalListWithFiltersScreenProps
  extends ScreenProps<{
    contentSlot: ReactNode;
    filterOptions: StudentPersonalListWithFiltersScreenOption[];
    onFilterChange: (value: string) => void;
    selectedFilter: string;
  }> {}

export const studentPersonalListWithFiltersScreenContract: ViewContract = {
  componentId: "student-personal-list-with-filters-screen",
  testId: "student-personal-list-with-filters-screen",
};

export function StudentPersonalListWithFiltersScreen({
  contentSlot,
  filterOptions,
  onFilterChange,
  selectedFilter,
}: StudentPersonalListWithFiltersScreenProps) {
  return (
    <ScreenShell.Root
      className="max-w-4xl"
      screenId={studentPersonalListWithFiltersScreenContract.testId}
    >
      <ScreenShell.Header>
        <ScreenShell.Heading className="text-center sm:text-center">
          <ScreenShell.Title>Personais</ScreenShell.Title>
          <ScreenShell.Description>
            Encontre personais proximos ou com atendimento remoto.
          </ScreenShell.Description>
        </ScreenShell.Heading>
      </ScreenShell.Header>

      <ScreenShell.Body>
        <DuoCard.Root
          data-testid={createTestSelector(
            studentPersonalListWithFiltersScreenContract.testId,
            "filters",
          )}
          padding="md"
          variant="default"
        >
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Users
                aria-hidden
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
              />
              <h2 className="font-bold text-duo-fg">Filtros</h2>
            </div>
          </DuoCard.Header>
          <DuoSelect.Simple
            onChange={onFilterChange}
            options={filterOptions}
            placeholder="Filtro"
            value={selectedFilter}
          />
        </DuoCard.Root>

        <div
          data-testid={createTestSelector(
            studentPersonalListWithFiltersScreenContract.testId,
            "content",
          )}
        >
          {contentSlot}
        </div>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
