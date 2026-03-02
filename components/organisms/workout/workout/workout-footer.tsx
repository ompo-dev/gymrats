"use client";

import { CheckCircle2, Pause, Play, RefreshCw, Weight } from "lucide-react";
import { motion } from "motion/react";
import { DuoButton } from "@/components/duo";
import type { WorkoutExercise } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WorkoutFooterProps {
  isCardio: boolean;
  isRunning: boolean;
  currentExercise: WorkoutExercise;
  canGoBack: boolean;
  isLastExercise: boolean;
  onToggleCardio: () => void;
  onOpenWeightTracker: () => void;
  onOpenAlternatives: () => void;
  onCompleteCardio: () => void;
  onGoBack: () => void;
  onFinish: () => void;
  onSkip: () => void;
}

function WorkoutFooterSimple({
  isCardio,
  isRunning,
  currentExercise,
  canGoBack,
  isLastExercise,
  onToggleCardio,
  onOpenWeightTracker,
  onOpenAlternatives,
  onCompleteCardio,
  onGoBack,
  onFinish,
  onSkip,
}: WorkoutFooterProps) {
  return (
    <div className="border-t-2 border-duo-border bg-duo-bg-card p-3 sm:p-4 shadow-lg shrink-0">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-2 sm:space-y-3"
        >
          {isCardio ? (
            <DuoButton
              type="button"
              variant={isRunning ? "accent" : "primary"}
              onClick={onToggleCardio}
              className="w-full rounded-xl sm:rounded-2xl py-3 sm:py-4 flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>PAUSAR</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>INICIAR</span>
                </>
              )}
            </DuoButton>
          ) : (
            <DuoButton
              type="button"
              variant="primary"
              onClick={onOpenWeightTracker}
              className="w-full flex items-center justify-center gap-2 text-sm sm:text-base lg:text-lg py-3 sm:py-4 rounded-xl sm:rounded-2xl"
            >
              <Weight className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">
                REGISTRAR SÉRIES E CARGAS
              </span>
              <span className="sm:hidden">SÉRIES E CARGAS</span>
            </DuoButton>
          )}

          {/* Botão de alternativas */}
          <DuoButton
            type="button"
            variant="outline"
            onClick={onOpenAlternatives}
            className="w-full rounded-xl sm:rounded-2xl border-2 border-duo-blue bg-duo-blue/10 py-3 sm:py-4 text-xs sm:text-sm text-duo-blue hover:bg-duo-blue/20 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">
              EQUIPAMENTO OCUPADO? VER ALTERNATIVAS (
              {currentExercise?.alternatives?.length || 0})
            </span>
            <span className="sm:hidden">
              VER ALTERNATIVAS ({currentExercise?.alternatives?.length || 0})
            </span>
          </DuoButton>

          {/* Botão CONCLUIR para cardio */}
          {isCardio && (
            <DuoButton
              type="button"
              variant="primary"
              onClick={onCompleteCardio}
              className="w-full rounded-xl sm:rounded-2xl py-3 sm:py-4 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>CONCLUIR EXERCÍCIO</span>
            </DuoButton>
          )}

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {canGoBack && (
              <DuoButton
                type="button"
                variant="outline"
                onClick={onGoBack}
                className="rounded-xl sm:rounded-2xl py-3 sm:py-4 text-xs sm:text-sm text-duo-fg-muted"
              >
                <span className="hidden sm:inline">← ANTERIOR</span>
                <span className="sm:hidden">ANTERIOR</span>
              </DuoButton>
            )}
            {/* Verificar se é o último exercício */}
            {isLastExercise ? (
              // Último exercício: mostrar botão FINALIZAR
              <DuoButton
                type="button"
                variant="primary"
                onClick={onFinish}
                className={cn(
                  "rounded-xl sm:rounded-2xl py-3 sm:py-4 text-xs sm:text-sm",
                  !canGoBack && "col-span-2",
                )}
              >
                <span className="hidden sm:inline">FINALIZAR TREINO</span>
                <span className="sm:hidden">FINALIZAR</span>
              </DuoButton>
            ) : (
              // Não é o último: mostrar botão PULAR
              <DuoButton
                type="button"
                variant="outline"
                onClick={onSkip}
                className={cn(
                  "rounded-xl sm:rounded-2xl py-3 sm:py-4 text-xs sm:text-sm text-duo-fg-muted",
                  !canGoBack && "col-span-2",
                )}
              >
                <span className="hidden sm:inline">PULAR EXERCÍCIO</span>
                <span className="sm:hidden">PULAR</span>
              </DuoButton>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export const WorkoutFooter = { Simple: WorkoutFooterSimple };
