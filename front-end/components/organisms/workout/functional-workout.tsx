"use client";

import { useState } from "react";
import { functionalExercises } from "@/lib/functional-exercises-data";
import type { FunctionalCategory } from "@/lib/types";
import { Users, Baby, HeartPulse, Target } from "lucide-react";
import { OptionSelector } from "@/components/molecules/selectors/option-selector";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function FunctionalWorkout() {
  const [selectedCategory, setSelectedCategory] = useState<
    FunctionalCategory | "all"
  >("all");
  const [selectedAudience, setSelectedAudience] = useState<
    "criancas" | "adultos" | "idosos" | "all"
  >("all");

  const categories: {
    value: FunctionalCategory | "all";
    label: string;
    emoji: string;
  }[] = [
    { value: "all", label: "Todos", emoji: "🎯" },
    { value: "mobilidade", label: "Mobilidade", emoji: "🧘" },
    { value: "equilibrio", label: "Equilíbrio", emoji: "⚖️" },
    { value: "coordenacao", label: "Coordenação", emoji: "🎪" },
    { value: "agilidade", label: "Agilidade", emoji: "⚡" },
    { value: "core-funcional", label: "Core", emoji: "💪" },
  ];

  const filteredExercises = functionalExercises.filter((ex) => {
    const categoryMatch =
      selectedCategory === "all" || ex.category === selectedCategory;
    const audienceMatch =
      selectedAudience === "all" ||
      ex.targetAudience.includes(selectedAudience);
    return categoryMatch && audienceMatch;
  });

  const audienceOptions = [
    { value: "all", label: "Todos", emoji: "👥" },
    { value: "criancas", label: "Crianças", emoji: "👶" },
    { value: "adultos", label: "Adultos", emoji: "👤" },
    { value: "idosos", label: "Idosos", emoji: "👴" },
  ];

  const categoryOptions = categories.map((cat) => ({
    value: cat.value,
    label: cat.label,
    emoji: cat.emoji,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Treino Funcional
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Exercícios para todas as idades e níveis
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <SectionCard title="Para quem?" icon={Users}>
          <OptionSelector
            options={audienceOptions}
            value={selectedAudience}
            onChange={(value) =>
              setSelectedAudience(
                value as "criancas" | "adultos" | "idosos" | "all"
              )
            }
            layout="grid"
            columns={2}
            size="md"
            textAlign="center"
            animate={true}
          />
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.2}>
        <SectionCard title="Categoria" icon={Target}>
          <OptionSelector
            options={categoryOptions}
            value={selectedCategory}
            onChange={(value) =>
              setSelectedCategory(value as FunctionalCategory | "all")
            }
            layout="grid"
            columns={2}
            size="md"
            textAlign="center"
            animate={true}
          />
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.3}>
        <div className="space-y-4">
          {filteredExercises.length === 0 ? (
            <DuoCard
              variant="default"
              size="default"
              className="p-8 text-center"
            >
              <div className="mb-2 text-4xl">🔍</div>
              <div className="text-sm font-bold text-duo-gray-dark">
                Nenhum exercício encontrado para esses filtros
              </div>
            </DuoCard>
          ) : (
            filteredExercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <DuoCard
                  variant="default"
                  size="default"
                  className="hover:border-duo-blue/50 transition-colors"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="mb-2 text-lg font-bold text-duo-text">
                        {exercise.name}
                      </h4>
                      <div className="mb-2 flex flex-wrap gap-2">
                        {exercise.targetAudience.map((aud) => (
                          <span
                            key={aud}
                            className="rounded-full bg-duo-purple/10 px-2 py-1 text-xs font-bold text-duo-purple capitalize"
                          >
                            {aud}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-duo-orange">
                        {exercise.caloriesBurnedPerMinute} cal/min
                      </div>
                      <div className="text-xs text-duo-gray-dark capitalize">
                        {exercise.difficulty}
                      </div>
                    </div>
                  </div>

                  <p className="mb-3 text-sm text-duo-gray-dark">
                    {exercise.description}
                  </p>

                  <div className="mb-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-duo-border/30 p-2 text-center">
                      <div className="text-xs text-duo-gray-dark">Séries</div>
                      <div className="font-bold text-duo-text">
                        {exercise.sets}x
                      </div>
                    </div>
                    <div className="rounded-lg bg-duo-border/30 p-2 text-center">
                      <div className="text-xs text-duo-gray-dark">Duração</div>
                      <div className="font-bold text-duo-text">
                        {exercise.duration}
                      </div>
                    </div>
                    <div className="rounded-lg bg-duo-border/30 p-2 text-center">
                      <div className="text-xs text-duo-gray-dark">Descanso</div>
                      <div className="font-bold text-duo-text">
                        {exercise.rest}s
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-xs font-bold text-duo-gray-dark">
                      Benefícios:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {exercise.benefits.map((benefit, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-duo-green/10 px-2 py-1 text-xs font-bold text-duo-green"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </DuoCard>
              </motion.div>
            ))
          )}
        </div>
      </SlideIn>
    </div>
  );
}
