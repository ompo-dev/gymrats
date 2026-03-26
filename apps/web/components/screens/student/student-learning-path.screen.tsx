"use client";

import type { ReactNode } from "react";
import { BookOpen, Dumbbell, Plus } from "lucide-react";
import { motion } from "motion/react";
import { DuoButton, DuoCard } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";
import { UnitSectionCard } from "@/components/ui/unit-section-card";

export interface StudentLearningPathScreenProps
  extends ScreenProps<{
    hasPlan: boolean;
    nodesSlot: ReactNode;
    onCreatePlan: () => void | Promise<void>;
    onOpenLibrary: () => void;
    sectionLabel: string;
    title: string;
  }> {}

export const studentLearningPathScreenContract: ViewContract = {
  componentId: "student-learning-path-screen",
  testId: "student-learning-path-screen",
};

export function StudentLearningPathScreen({
  hasPlan,
  nodesSlot,
  onCreatePlan,
  onOpenLibrary,
  sectionLabel,
  title,
}: StudentLearningPathScreenProps) {
  if (!hasPlan) {
    return (
      <ScreenShell.Root
        className="max-w-4xl"
        screenId={studentLearningPathScreenContract.testId}
      >
        <ScreenShell.Header>
          <ScreenShell.Heading className="text-center sm:text-center">
            <ScreenShell.Title>Treinos</ScreenShell.Title>
            <ScreenShell.Description>
              Crie seu plano semanal de 7 dias.
            </ScreenShell.Description>
          </ScreenShell.Heading>
        </ScreenShell.Header>

        <ScreenShell.Body>
          <DuoCard.Root
            data-testid={createTestSelector(
              studentLearningPathScreenContract.testId,
              "empty-state",
            )}
            padding="md"
            variant="default"
          >
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Dumbbell
                  aria-hidden
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                />
                <h2 className="font-bold text-duo-fg">Meu Plano Semanal</h2>
              </div>
            </DuoCard.Header>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center space-y-4 py-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <Dumbbell className="h-12 w-12 text-duo-green" />
              <p className="text-lg font-bold text-duo-fg">
                Comece a criar seus treinos!
              </p>
              <p className="text-sm text-duo-fg-muted">
                Plano de 7 dias com treinos e dias de descanso. Crie
                manualmente ou use o Chat IA.
              </p>
              <DuoButton
                className="w-fit"
                data-testid={createTestSelector(
                  studentLearningPathScreenContract.testId,
                  "create-plan",
                )}
                onClick={onCreatePlan}
                variant="primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Plano Semanal
              </DuoButton>
            </motion.div>
          </DuoCard.Root>
        </ScreenShell.Body>
      </ScreenShell.Root>
    );
  }

  return (
    <ScreenShell.Root
      className="max-w-2xl"
      screenId={studentLearningPathScreenContract.testId}
    >
      <ScreenShell.Body>
        <div
          className="mb-8"
          data-testid={createTestSelector(
            studentLearningPathScreenContract.testId,
            "header-card",
          )}
        >
          <UnitSectionCard
            buttonIcon={BookOpen}
            onButtonClick={onOpenLibrary}
            sectionLabel={sectionLabel}
            title={title}
          />
        </div>

        <div
          data-testid={createTestSelector(
            studentLearningPathScreenContract.testId,
            "nodes",
          )}
        >
          {nodesSlot}
        </div>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
