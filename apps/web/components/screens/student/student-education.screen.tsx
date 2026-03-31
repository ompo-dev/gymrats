"use client";

import { motion } from "motion/react";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";
import { DuoCard } from "@/components/duo";
import { cn } from "@/lib/utils";

export interface StudentEducationScreenProps
  extends ScreenProps<{
    onSelectView: (view: "muscles" | "lessons") => void;
  }> {}

export const studentEducationScreenContract: ViewContract = {
  componentId: "student-education-screen",
  testId: "student-education-screen",
};

export function StudentEducationScreen({
  onSelectView,
}: StudentEducationScreenProps) {
  return (
    <ScreenShell.Root
      className="max-w-4xl"
      screenId={studentEducationScreenContract.testId}
    >
      <ScreenShell.Header>
        <ScreenShell.Heading className="text-center sm:text-center">
          <ScreenShell.Title>Central de Aprendizado</ScreenShell.Title>
          <ScreenShell.Description>
            Conhecimento baseado em ciencia.
          </ScreenShell.Description>
        </ScreenShell.Heading>
      </ScreenShell.Header>

      <ScreenShell.Body>
        <div className="grid gap-4">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <DuoCard.Root
              className={cn(
                "cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]",
              )}
              data-testid={createTestSelector(
                studentEducationScreenContract.testId,
                "muscles-option",
              )}
              onClick={() => onSelectView("muscles")}
              size="default"
              variant="default"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-duo-blue text-xs font-black uppercase tracking-[0.2em] text-white">
                  Body
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-bold text-duo-text">
                    Anatomia e Exercicios
                  </h3>
                  <p className="text-sm text-duo-gray-dark">
                    Explore musculos, funcoes e tecnicas corretas de execucao.
                  </p>
                </div>
              </div>
            </DuoCard.Root>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <DuoCard.Root
              className={cn(
                "cursor-pointer transition-all hover:border-duo-green active:scale-[0.98]",
              )}
              data-testid={createTestSelector(
                studentEducationScreenContract.testId,
                "lessons-option",
              )}
              onClick={() => onSelectView("lessons")}
              size="default"
              variant="default"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-duo-green text-xs font-black uppercase tracking-[0.2em] text-white">
                  Read
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-bold text-duo-text">
                    Licoes de Ciencia
                  </h3>
                  <p className="text-sm text-duo-gray-dark">
                    Aprenda sobre hipertrofia, nutricao e recuperacao com
                    evidencias.
                  </p>
                </div>
              </div>
            </DuoCard.Root>
          </motion.div>
        </div>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
