"use client";

import { motion } from "motion/react";
import {
  Weight,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkoutExercise } from "@/lib/types";

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

export function WorkoutFooter({
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
    <div className="border-t-2 border-duo-border bg-white p-3 sm:p-4 shadow-lg shrink-0">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-2 sm:space-y-3"
        >
          {isCardio ? (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onToggleCardio}
              className={cn(
                "w-full rounded-xl sm:rounded-2xl py-3 sm:py-4 font-bold text-white transition-all flex items-center justify-center gap-2",
                isRunning
                  ? "bg-duo-orange hover:bg-duo-orange/90"
                  : "bg-duo-green hover:bg-duo-green/90"
              )}
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
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenWeightTracker}
              className="duo-button-green w-full flex items-center justify-center gap-2 text-sm sm:text-base lg:text-lg py-3 sm:py-4"
            >
              <Weight className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">
                REGISTRAR SÉRIES E CARGAS
              </span>
              <span className="sm:hidden">SÉRIES E CARGAS</span>
            </motion.button>
          )}

          {/* Botão de alternativas */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenAlternatives}
            className="w-full rounded-xl sm:rounded-2xl border-2 border-duo-blue bg-duo-blue/10 py-3 sm:py-4 font-bold text-xs sm:text-sm text-duo-blue transition-all hover:bg-duo-blue/20 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">
              EQUIPAMENTO OCUPADO? VER ALTERNATIVAS (
              {currentExercise?.alternatives?.length || 0})
            </span>
            <span className="sm:hidden">
              VER ALTERNATIVAS (
              {currentExercise?.alternatives?.length || 0})
            </span>
          </motion.button>

          {/* Botão CONCLUIR para cardio */}
          {isCardio && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCompleteCardio}
              className="w-full rounded-xl sm:rounded-2xl bg-duo-green py-3 sm:py-4 font-bold text-white hover:bg-duo-green/90 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>CONCLUIR EXERCÍCIO</span>
            </motion.button>
          )}

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {canGoBack && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onGoBack}
                className="rounded-xl sm:rounded-2xl border-2 border-duo-border bg-white py-3 sm:py-4 font-bold text-xs sm:text-sm text-duo-gray-dark transition-all hover:bg-gray-50"
              >
                <span className="hidden sm:inline">← ANTERIOR</span>
                <span className="sm:hidden">ANTERIOR</span>
              </motion.button>
            )}
            {/* Verificar se é o último exercício */}
            {isLastExercise ? (
              // Último exercício: mostrar botão FINALIZAR
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onFinish}
                className={cn(
                  "rounded-xl sm:rounded-2xl border-2 border-duo-green bg-duo-green py-3 sm:py-4 font-bold text-xs sm:text-sm text-white transition-all hover:bg-duo-green/90",
                  !canGoBack && "col-span-2"
                )}
              >
                <span className="hidden sm:inline">
                  FINALIZAR TREINO
                </span>
                <span className="sm:hidden">FINALIZAR</span>
              </motion.button>
            ) : (
              // Não é o último: mostrar botão PULAR
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSkip}
                className={cn(
                  "rounded-xl sm:rounded-2xl border-2 border-duo-border bg-white py-3 sm:py-4 font-bold text-xs sm:text-sm text-duo-gray-dark transition-all hover:bg-gray-50",
                  !canGoBack && "col-span-2"
                )}
              >
                <span className="hidden sm:inline">
                  PULAR EXERCÍCIO
                </span>
                <span className="sm:hidden">PULAR</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
