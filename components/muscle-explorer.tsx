"use client";

import { useState, useEffect } from "react";
import { muscleDatabase, exerciseDatabase } from "@/lib/educational-data";
import type { MuscleInfo, ExerciseInfo } from "@/lib/types";
import { ChevronRight, Book, Dumbbell, ArrowLeft } from "lucide-react";
import { OptionSelector } from "@/components/ui/option-selector";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface MuscleExplorerProps {
  muscleId?: string | null;
  exerciseId?: string | null;
  onMuscleSelect?: (id: string) => void;
  onExerciseSelect?: (id: string) => void;
  onBack?: () => void;
}

export function MuscleExplorer({
  muscleId,
  exerciseId,
  onMuscleSelect,
  onExerciseSelect,
  onBack,
}: MuscleExplorerProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleInfo | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseInfo | null>(
    null
  );
  const [view, setView] = useState<"muscles" | "exercises">("muscles");

  useEffect(() => {
    if (muscleId) {
      const muscle = muscleDatabase.find((m) => m.id === muscleId);
      if (muscle) setSelectedMuscle(muscle);
    } else {
      setSelectedMuscle(null);
    }
  }, [muscleId]);

  useEffect(() => {
    if (exerciseId) {
      const exercise = exerciseDatabase.find((e) => e.id === exerciseId);
      if (exercise) setSelectedExercise(exercise);
    } else {
      setSelectedExercise(null);
    }
  }, [exerciseId]);

  const handleMuscleSelect = (muscle: MuscleInfo) => {
    setSelectedMuscle(muscle);
    onMuscleSelect?.(muscle.id);
  };

  const handleExerciseSelect = (exercise: ExerciseInfo) => {
    setSelectedExercise(exercise);
    onExerciseSelect?.(exercise.id);
  };

  const handleBack = () => {
    setSelectedMuscle(null);
    setSelectedExercise(null);
    onBack?.();
  };

  const viewOptions = [
    { value: "muscles", label: "Músculos", emoji: "💪" },
    { value: "exercises", label: "Exercícios", emoji: "🏋️" },
  ];

  if (selectedMuscle) {
    return <MuscleDetail muscle={selectedMuscle} onBack={handleBack} />;
  }

  if (selectedExercise) {
    return <ExerciseDetail exercise={selectedExercise} onBack={handleBack} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Biblioteca de Conhecimento
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Aprenda sobre anatomia e técnica com base científica
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <SectionCard title="Selecione a Categoria" icon={Book}>
          <OptionSelector
            options={viewOptions}
            value={view}
            onChange={(value) => setView(value as "muscles" | "exercises")}
            layout="grid"
            columns={2}
            size="md"
            textAlign="center"
            animate={true}
          />
        </SectionCard>
      </SlideIn>

      {view === "muscles" && (
        <SlideIn delay={0.2}>
          <div className="space-y-3">
            {muscleDatabase.map((muscle, index) => (
              <motion.div
                key={muscle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <DuoCard
                  variant="default"
                  size="md"
                  onClick={() => handleMuscleSelect(muscle)}
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
        </SlideIn>
      )}

      {view === "exercises" && (
        <SlideIn delay={0.2}>
          <div className="space-y-3">
            {exerciseDatabase.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <DuoCard
                  variant="default"
                  size="md"
                  onClick={() => handleExerciseSelect(exercise)}
                  className="cursor-pointer transition-all hover:border-duo-green active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 font-bold text-duo-text">
                        {exercise.name}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {exercise.primaryMuscles.map((muscle, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-duo-green/20 px-2 py-0.5 text-xs font-bold capitalize text-duo-green"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-duo-gray-dark" />
                  </div>
                </DuoCard>
              </motion.div>
            ))}
          </div>
        </SlideIn>
      )}
    </div>
  );
}

function MuscleDetail({
  muscle,
  onBack,
}: {
  muscle: MuscleInfo;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <FadeIn>
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 font-bold text-duo-blue hover:underline"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar
        </button>
      </FadeIn>

      <SlideIn delay={0.1}>
        <SectionCard title={muscle.name} icon={Book} variant="blue">
          <div className="mb-4 text-sm font-bold italic text-duo-gray-dark">
            {muscle.scientificName}
          </div>
          <p className="leading-relaxed text-duo-text">{muscle.description}</p>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.2}>
        <SectionCard title="Funções" icon={Book}>
          <ul className="space-y-3">
            {muscle.functions.map((func, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-duo-green text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-duo-text">{func}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.3}>
        <SectionCard title="Exercícios Comuns" icon={Dumbbell}>
          <div className="flex flex-wrap gap-2">
            {muscle.commonExercises.map((exercise, i) => (
              <span
                key={i}
                className="rounded-xl bg-duo-blue/20 px-3 py-2 text-sm font-bold text-duo-blue"
              >
                {exercise}
              </span>
            ))}
          </div>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.4}>
        <DuoCard variant="yellow" size="default">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            <h3 className="text-lg font-bold text-duo-text">
              Curiosidades Anatômicas
            </h3>
          </div>
          <ul className="space-y-2">
            {muscle.anatomyFacts.map((fact, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-duo-yellow">•</span>
                <span className="text-duo-text">{fact}</span>
              </li>
            ))}
          </ul>
        </DuoCard>
      </SlideIn>
    </div>
  );
}

function ExerciseDetail({
  exercise,
  onBack,
}: {
  exercise: ExerciseInfo;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <FadeIn>
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 font-bold text-duo-green hover:underline"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar
        </button>
      </FadeIn>

      <SlideIn delay={0.1}>
        <SectionCard
          title={exercise.name}
          icon={Dumbbell}
          variant="highlighted"
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-duo-orange/20 px-3 py-1 text-xs font-bold capitalize text-duo-orange">
              {exercise.difficulty}
            </span>
            {exercise.equipment.map((eq, i) => (
              <span
                key={i}
                className="rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-duo-gray-dark"
              >
                {eq}
              </span>
            ))}
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-2 text-xs font-bold text-duo-gray-dark">
                MÚSCULOS PRIMÁRIOS
              </div>
              <div className="flex flex-wrap gap-2">
                {exercise.primaryMuscles.map((m, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-duo-green/20 px-2 py-1 text-xs font-bold capitalize text-duo-green"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
            {exercise.secondaryMuscles.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-bold text-duo-gray-dark">
                  SECUNDÁRIOS
                </div>
                <div className="flex flex-wrap gap-2">
                  {exercise.secondaryMuscles.map((m, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-duo-blue/20 px-2 py-1 text-xs font-bold capitalize text-duo-blue"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.2}>
        <SectionCard title="Como Executar" icon={Dumbbell}>
          <ol className="space-y-3">
            {exercise.instructions.map((instruction, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-duo-blue text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="pt-1 text-duo-text">{instruction}</span>
              </li>
            ))}
          </ol>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.3}>
        <DuoCard variant="highlighted" size="default">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xl">✓</span>
            <h3 className="text-lg font-bold text-duo-text">
              Dicas Importantes
            </h3>
          </div>
          <ul className="space-y-2">
            {exercise.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-duo-green">•</span>
                <span className="text-duo-text">{tip}</span>
              </li>
            ))}
          </ul>
        </DuoCard>
      </SlideIn>

      <SlideIn delay={0.4}>
        <DuoCard
          variant="default"
          size="default"
          className="border-duo-red bg-duo-red/10"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <h3 className="text-lg font-bold text-duo-text">Erros Comuns</h3>
          </div>
          <ul className="space-y-2">
            {exercise.commonMistakes.map((mistake, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-duo-red">×</span>
                <span className="text-duo-text">{mistake}</span>
              </li>
            ))}
          </ul>
        </DuoCard>
      </SlideIn>

      <SlideIn delay={0.5}>
        <DuoCard variant="yellow" size="default">
          <h3 className="mb-3 text-lg font-bold text-duo-text">Benefícios</h3>
          <ul className="space-y-2">
            {exercise.benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-duo-yellow">+</span>
                <span className="text-duo-text">{benefit}</span>
              </li>
            ))}
          </ul>
        </DuoCard>
      </SlideIn>

      {exercise.scientificEvidence && (
        <SlideIn delay={0.6}>
          <DuoCard variant="blue" size="default">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">🔬</span>
              <h3 className="text-lg font-bold text-duo-text">
                Evidência Científica
              </h3>
            </div>
            <p className="leading-relaxed text-duo-text">
              {exercise.scientificEvidence}
            </p>
          </DuoCard>
        </SlideIn>
      )}
    </div>
  );
}
