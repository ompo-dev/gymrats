"use client";

import type { ReactNode } from "react";
import { Book } from "lucide-react";
import { DuoCard, DuoSelect } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";

export type StudentMuscleExplorerView = "muscles" | "exercises";

export interface StudentMuscleExplorerScreenProps
  extends ScreenProps<{
    contentSlot: ReactNode;
    onViewChange: (view: StudentMuscleExplorerView) => void;
    searchSlot: ReactNode;
    view: StudentMuscleExplorerView;
  }> {}

export const studentMuscleExplorerScreenContract: ViewContract = {
  componentId: "student-muscle-explorer-screen",
  testId: "student-muscle-explorer-screen",
};

const viewOptions = [
  { value: "muscles", label: "Musculos", emoji: "Body" },
  { value: "exercises", label: "Exercicios", emoji: "Move" },
] as const;

export function StudentMuscleExplorerScreen({
  contentSlot,
  onViewChange,
  searchSlot,
  view,
}: StudentMuscleExplorerScreenProps) {
  return (
    <ScreenShell.Root
      className="max-w-4xl"
      screenId={studentMuscleExplorerScreenContract.testId}
    >
      <ScreenShell.Header>
        <ScreenShell.Heading className="text-center sm:text-center">
          <ScreenShell.Title>Biblioteca de Conhecimento</ScreenShell.Title>
          <ScreenShell.Description>
            Aprenda anatomia e tecnica com base cientifica.
          </ScreenShell.Description>
        </ScreenShell.Heading>
      </ScreenShell.Header>

      <ScreenShell.Body>
        <DuoCard.Root
          data-testid={createTestSelector(
            studentMuscleExplorerScreenContract.testId,
            "selector",
          )}
          padding="md"
          variant="default"
        >
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Book
                aria-hidden
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
              />
              <h2 className="font-bold text-[var(--duo-fg)]">
                Selecione a categoria
              </h2>
            </div>
          </DuoCard.Header>
          <DuoSelect.Simple
            onChange={(value) =>
              onViewChange(value as StudentMuscleExplorerView)
            }
            options={viewOptions as unknown as { label: string; value: string }[]}
            placeholder="Selecione a categoria"
            value={view}
          />
        </DuoCard.Root>

        <div
          data-testid={createTestSelector(
            studentMuscleExplorerScreenContract.testId,
            "search",
          )}
        >
          {searchSlot}
        </div>

        <div
          data-testid={createTestSelector(
            studentMuscleExplorerScreenContract.testId,
            "content",
          )}
        >
          {contentSlot}
        </div>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
