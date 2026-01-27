"use client";

import type { MuscleInfo, MuscleGroup } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";

interface MuscleListProps {
  muscles: MuscleInfo[];
  musclesByGroup: [string, MuscleInfo[]][];
  searchQuery: string;
  onMuscleSelect: (muscle: MuscleInfo) => void;
  muscleGroupLabels: Record<MuscleGroup, string>;
}

export function MuscleList({
  muscles,
  musclesByGroup,
  searchQuery,
  onMuscleSelect,
  muscleGroupLabels,
}: MuscleListProps) {
  if (muscles.length === 0) {
    return (
      <SlideIn delay={0.2}>
        <DuoCard variant="default" size="default">
          <div className="py-8 text-center text-duo-gray-dark">
            <p className="font-bold">Nenhum músculo encontrado</p>
            <p className="mt-1 text-sm">Tente buscar por outro termo</p>
          </div>
        </DuoCard>
      </SlideIn>
    );
  }

  if (searchQuery) {
    return (
      <SlideIn delay={0.2}>
        <div className="space-y-3">
          {muscles.map((muscle, index) => (
            <motion.div
              key={muscle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <DuoCard
                variant="default"
                size="md"
                onClick={() => onMuscleSelect(muscle)}
                className="cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-bold text-duo-text">
                        {muscle.name}
                      </span>
                      <span className="rounded-full bg-duo-blue/20 px-2 py-0.5 text-xs font-bold capitalize text-duo-blue">
                        {muscleGroupLabels[muscle.group]}
                      </span>
                    </div>
                    <div className="text-sm text-duo-gray-dark">
                      {muscle.scientificName}
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 shrink-0 text-duo-gray-dark" />
                </div>
              </DuoCard>
            </motion.div>
          ))}
        </div>
      </SlideIn>
    );
  }

  return (
    <SlideIn delay={0.2}>
      <div className="space-y-6">
        {musclesByGroup.map(([group, groupMuscles]) => (
          <div key={group} className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <h2 className="text-xl font-bold capitalize text-duo-text">
                {muscleGroupLabels[group as MuscleGroup]}
              </h2>
              <span className="rounded-full bg-duo-gray-dark/20 px-2 py-0.5 text-xs font-bold text-duo-gray-dark">
                {groupMuscles.length}
              </span>
            </motion.div>
            <div className="space-y-3">
              {groupMuscles.map((muscle, index) => (
                <motion.div
                  key={muscle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <DuoCard
                    variant="default"
                    size="md"
                    onClick={() => onMuscleSelect(muscle)}
                    className="cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="mb-1 font-bold text-duo-text">
                          {muscle.name}
                        </div>
                        <div className="text-sm text-duo-gray-dark">
                          {muscle.scientificName}
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-duo-gray-dark" />
                    </div>
                  </DuoCard>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SlideIn>
  );
}
