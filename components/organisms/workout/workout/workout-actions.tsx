"use client";

import { motion } from "motion/react";
import { Weight, RefreshCw, Play, Pause, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkoutExercise } from "@/lib/types";

interface WorkoutActionsProps {
  isCardio: boolean;
  isRunning?: boolean;
  currentExercise: WorkoutExercise;
  currentIndex: number;
  onWeightTrack: () => void;
  onToggleTimer?: () => void;
  onComplete?: () => void;
  onAlternatives: () => void;
  onPrevious?: () => void;
  onSkip: () => void;
}

export function WorkoutActions({
  isCardio,
  isRunning = false,
  currentExercise,
  currentIndex,
  onWeightTrack,
  onToggleTimer,
  onComplete,
  onAlternatives,
  onPrevious,
  onSkip,
}: WorkoutActionsProps) {
  return (
    <div className="border-t-2 border-duo-border bg-white p-3 sm:p-4 shadow-lg shrink-0">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-2 sm:space-y-3"
        >
          {/* Botão Principal */}
          {isCardio && onToggleTimer ? (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onToggleTimer}
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
              onClick={onWeightTrack}
              className="duo-button-green w-full flex items-center justify-center gap-2 text-sm sm:text-base lg:text-lg py-3 sm:py-4"
            >
              <Weight className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">
                REGISTRAR SÉRIES E CARGAS
              </span>
              <span className="sm:hidden">SÉRIES E CARGAS</span>
            </motion.button>
          )}

          {/* Botão de Alternativas */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAlternatives}
            className="w-full rounded-xl sm:rounded-2xl border-2 border-duo-blue bg-duo-blue/10 py-3 sm:py-4 font-bold text-xs sm:text-sm text-duo-blue transition-all hover:bg-duo-blue/20 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">
              EQUIPAMENTO OCUPADO? VER ALTERNATIVAS (
              {currentExercise?.alternatives?.length || 0})
            </span>
            <span className="sm:hidden">
              VER ALTERNATIVAS ({currentExercise?.alternatives?.length || 0})
            </span>
          </motion.button>

          {/* Botão CONCLUIR para cardio */}
          {isCardio && onComplete && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onComplete}
              className="w-full rounded-xl sm:rounded-2xl bg-duo-green py-3 sm:py-4 font-bold text-white hover:bg-duo-green/90 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>CONCLUIR EXERCÍCIO</span>
            </motion.button>
          )}

          {/* Botões de Navegação */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {currentIndex > 0 && onPrevious && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onPrevious}
                className="rounded-xl sm:rounded-2xl border-2 border-duo-border bg-white py-3 sm:py-4 font-bold text-xs sm:text-sm text-duo-gray-dark transition-all hover:bg-gray-50"
              >
                <span className="hidden sm:inline">← ANTERIOR</span>
                <span className="sm:hidden">ANTERIOR</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSkip}
              className={cn(
                "rounded-xl sm:rounded-2xl border-2 border-duo-border bg-white py-3 sm:py-4 font-bold text-xs sm:text-sm text-duo-gray-dark transition-all hover:bg-gray-50",
                currentIndex === 0 && "col-span-2"
              )}
            >
              <span className="hidden sm:inline">PULAR EXERCÍCIO</span>
              <span className="sm:hidden">PULAR</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
