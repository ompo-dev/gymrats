"use client";

import type { ReactNode } from "react";
import { Heart, Target, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";
import { BackButton } from "@/components/organisms/navigation/back-button";
import { cn } from "@/lib/utils";

export type StudentCardioView = "menu" | "cardio" | "functional";

export interface StudentCardioScreenProps
  extends ScreenProps<{
    cardioSlot: ReactNode;
    functionalSlot: ReactNode;
    onBackToMenu: () => void;
    onSelectView: (view: Exclude<StudentCardioView, "menu">) => void;
    view: StudentCardioView;
  }> {}

export const studentCardioScreenContract: ViewContract = {
  componentId: "student-cardio-screen",
  testId: "student-cardio-screen",
};

export function StudentCardioScreen({
  cardioSlot,
  functionalSlot,
  onBackToMenu,
  onSelectView,
  view,
}: StudentCardioScreenProps) {
  if (view === "cardio") {
    return (
      <ScreenShell.Root
        className="max-w-4xl"
        screenId={studentCardioScreenContract.testId}
      >
        <ScreenShell.Body>
          <FadeIn>
            <div
              data-testid={createTestSelector(
                studentCardioScreenContract.testId,
                "cardio-view",
              )}
            >
              <BackButton onClick={onBackToMenu} color="duo-red" />
            </div>
          </FadeIn>
          {cardioSlot}
        </ScreenShell.Body>
      </ScreenShell.Root>
    );
  }

  if (view === "functional") {
    return (
      <ScreenShell.Root
        className="max-w-4xl"
        screenId={studentCardioScreenContract.testId}
      >
        <ScreenShell.Body>
          <FadeIn>
            <div
              data-testid={createTestSelector(
                studentCardioScreenContract.testId,
                "functional-view",
              )}
            >
              <BackButton onClick={onBackToMenu} color="duo-blue" />
            </div>
          </FadeIn>
          {functionalSlot}
        </ScreenShell.Body>
      </ScreenShell.Root>
    );
  }

  return (
    <ScreenShell.Root
      className="max-w-4xl"
      screenId={studentCardioScreenContract.testId}
    >
      <ScreenShell.Header>
        <ScreenShell.Heading className="text-center sm:text-center">
          <ScreenShell.Title>Cardio e Funcionais</ScreenShell.Title>
          <ScreenShell.Description>
            Melhore sua saude cardiovascular e funcionalidade.
          </ScreenShell.Description>
        </ScreenShell.Heading>
      </ScreenShell.Header>

      <ScreenShell.Body>
        <DuoStatsGrid.Root
          columns={2}
          data-testid={createTestSelector(
            studentCardioScreenContract.testId,
            "metrics",
          )}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <DuoStatCard.Simple
              icon={Heart}
              iconColor="var(--duo-danger)"
              label="cardio esta semana"
              value="3x"
            />
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <DuoStatCard.Simple
              icon={TrendingUp}
              iconColor="var(--duo-secondary)"
              label="kcal queimadas"
              value="850"
            />
          </motion.div>
        </DuoStatsGrid.Root>

        <SlideIn delay={0.2}>
          <div className="grid gap-4">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <DuoCard.Root
                className={cn(
                  "cursor-pointer transition-all hover:border-duo-red active:scale-[0.98]",
                )}
                data-testid={createTestSelector(
                  studentCardioScreenContract.testId,
                  "cardio-option",
                )}
                onClick={() => onSelectView("cardio")}
                size="default"
                variant="default"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-duo-red text-xl font-black uppercase text-white">
                    Run
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-xl font-bold text-duo-text">
                      Treino Cardio
                    </h3>
                    <p className="mb-3 text-sm text-duo-gray-dark">
                      Corrida, ciclismo, natacao, remo e mais modalidades com
                      tracking de calorias
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-duo-red/20 px-3 py-1 text-xs font-bold text-duo-red">
                        8 modalidades
                      </span>
                      <span className="rounded-full bg-duo-orange/20 px-3 py-1 text-xs font-bold text-duo-orange">
                        Monitor de FC
                      </span>
                      <span className="rounded-full bg-duo-yellow/20 px-3 py-1 text-xs font-bold text-duo-text">
                        Calorias em tempo real
                      </span>
                    </div>
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
                  "cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]",
                )}
                data-testid={createTestSelector(
                  studentCardioScreenContract.testId,
                  "functional-option",
                )}
                onClick={() => onSelectView("functional")}
                size="default"
                variant="default"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-duo-blue text-xs font-black uppercase tracking-[0.2em] text-white">
                    Func
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-xl font-bold text-duo-text">
                      Treino Funcional
                    </h3>
                    <p className="mb-3 text-sm text-duo-gray-dark">
                      Exercicios para todas as idades: criancas, adultos e
                      terceira idade
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-duo-green/20 px-3 py-1 text-xs font-bold text-duo-green">
                        Mobilidade
                      </span>
                      <span className="rounded-full bg-duo-blue/20 px-3 py-1 text-xs font-bold text-duo-blue">
                        Equilibrio
                      </span>
                      <span className="rounded-full bg-duo-orange/20 px-3 py-1 text-xs font-bold text-duo-orange">
                        Coordenacao
                      </span>
                    </div>
                  </div>
                </div>
              </DuoCard.Root>
            </motion.div>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <DuoCard.Root
                data-testid={createTestSelector(
                  studentCardioScreenContract.testId,
                  "calculation-card",
                )}
                padding="md"
                variant="yellow"
              >
                <DuoCard.Header>
                  <div className="flex items-center gap-2">
                    <Target
                      aria-hidden
                      className="h-5 w-5 shrink-0"
                      style={{ color: "var(--duo-secondary)" }}
                    />
                    <h2 className="font-bold text-[var(--duo-fg)]">
                      Calculo Personalizado
                    </h2>
                  </div>
                </DuoCard.Header>
                <p className="text-sm text-duo-gray-dark">
                  As calorias sao calculadas baseadas no seu peso, idade,
                  genero e perfil hormonal para maxima precisao.
                </p>
              </DuoCard.Root>
            </motion.div>
          </div>
        </SlideIn>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
