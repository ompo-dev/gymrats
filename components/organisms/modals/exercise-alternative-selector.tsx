"use client";

import { useState } from "react";
import type { WorkoutExercise, AlternativeExercise } from "@/lib/types";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, Info, BookOpen, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/buttons/button";
import { DuoCard } from "@/components/molecules/cards/duo-card";

interface ExerciseAlternativeSelectorProps {
  exercise: WorkoutExercise;
  onSelect: (exerciseId: string, alternativeId?: string) => void;
  onCancel: () => void;
  onViewEducation?: (educationalId: string) => void;
}

export function ExerciseAlternativeSelector({
  exercise,
  onSelect,
  onCancel,
  onViewEducation,
}: ExerciseAlternativeSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>(
    exercise.selectedAlternative || exercise.id
  );

  const handleSelect = () => {
    const alternativeId = selectedId === exercise.id ? undefined : selectedId;
    onSelect(exercise.id, alternativeId);
  };

  const allOptions = [
    {
      id: exercise.id,
      name: exercise.name,
      reason: "Exercício principal",
      isMain: true,
      educationalId: exercise.educationalId,
    },
    ...(exercise.alternatives || []).map((alt) => ({
      ...alt,
      isMain: false,
    })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b-2 border-duo-border bg-white p-4 sm:p-6">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-duo-orange" />
                <span className="text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                  Equipamento Ocupado?
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-duo-text">
                Escolha uma Alternativa
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="rounded-xl p-2 transition-colors hover:bg-gray-100"
            >
              <X className="h-6 w-6 text-duo-gray-dark" />
            </button>
          </div>
          <p className="text-sm text-duo-gray-dark">
            Selecione o exercício principal ou uma das alternativas abaixo
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 p-4 sm:p-6">
          {allOptions.map((option, index) => {
            const isSelected = selectedId === option.id;

            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <DuoCard
                  variant={
                    isSelected ? (option.isMain ? "highlighted" : "blue") : "default"
                  }
                  size="md"
                  onClick={() => setSelectedId(option.id)}
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected && "ring-2 ring-offset-2",
                    isSelected && option.isMain && "ring-duo-green",
                    isSelected && !option.isMain && "ring-duo-blue",
                    !isSelected && "hover:border-duo-gray active:scale-[0.98]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
                        isSelected && option.isMain && "bg-duo-green",
                        isSelected && !option.isMain && "bg-duo-blue",
                        !isSelected && "bg-duo-gray"
                      )}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      ) : (
                        <span className="text-lg font-bold text-white">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-duo-text wrap-break-word">
                          {option.name}
                        </h3>
                        {option.isMain && (
                          <span className="rounded-full bg-duo-green/20 px-2 py-0.5 text-xs font-bold text-duo-green">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-duo-gray-dark wrap-break-word">
                        {option.reason}
                      </p>

                      {/* Link para conteúdo educacional */}
                      {option.educationalId && onViewEducation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewEducation(option.educationalId!);
                          }}
                          className="mt-2 flex items-center gap-1 text-xs font-bold text-duo-blue transition-colors hover:text-duo-blue/80"
                        >
                          <BookOpen className="h-4 w-4" />
                          Ver técnica e instruções
                        </button>
                      )}
                    </div>
                  </div>
                </DuoCard>
              </motion.div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mx-4 sm:mx-6 mb-4">
          <DuoCard variant="yellow" size="sm">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 shrink-0 text-duo-yellow" />
              <div className="text-xs sm:text-sm text-duo-text">
                <strong>Dica:</strong> As alternativas trabalham os mesmos
                grupos musculares com eficiência similar. Escolha a que tiver
                equipamento disponível!
              </div>
            </div>
          </DuoCard>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 border-t-2 border-duo-border bg-white p-4 sm:p-6 shadow-lg">
          <div className="flex gap-3">
            <Button variant="white" onClick={onCancel} className="flex-1">
              CANCELAR
            </Button>
            <Button variant="default" onClick={handleSelect} className="flex-1">
              CONFIRMAR
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
