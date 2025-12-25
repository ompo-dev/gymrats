"use client";

import { useState, useEffect, useMemo } from "react";
import { muscleDatabase, exerciseDatabase } from "@/lib/educational-data";
import type { MuscleInfo, ExerciseInfo, MuscleGroup } from "@/lib/types";
import { Book } from "lucide-react";
import { OptionSelector } from "@/components/molecules/selectors/option-selector";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { MuscleDetail } from "@/components/organisms/education/components/muscle/muscle-detail";
import { ExerciseDetail } from "@/components/organisms/education/components/muscle/exercise-detail";
import { MuscleList } from "@/components/organisms/education/components/muscle/muscle-list";
import { ExerciseList } from "@/components/organisms/education/components/muscle/exercise-list";
import { SearchBar } from "@/components/organisms/education/components/muscle/search-bar";

interface MuscleExplorerProps {
  muscleId?: string | null;
  exerciseId?: string | null;
  onMuscleSelect?: (id: string) => void;
  onExerciseSelect?: (id: string) => void;
  onBack?: () => void;
}

const muscleGroupLabels: Record<MuscleGroup, string> = {
  peito: "Peito",
  costas: "Costas",
  pernas: "Pernas",
  ombros: "Ombros",
  bracos: "Braços",
  core: "Core",
  gluteos: "Glúteos",
  cardio: "Cardio",
  funcional: "Funcional",
};

const difficultyColors = {
  iniciante: {
    bg: "bg-duo-green/20",
    text: "text-duo-green",
  },
  intermediario: {
    bg: "bg-duo-orange/20",
    text: "text-duo-orange",
  },
  avancado: {
    bg: "bg-duo-red/20",
    text: "text-duo-red",
  },
} as const;

const getDifficultyClasses = (difficulty: string) => {
  const normalized = difficulty.toLowerCase() as keyof typeof difficultyColors;
  const colors = difficultyColors[normalized] || difficultyColors.intermediario;
  return `${colors.bg} ${colors.text}`;
};

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
  const [searchQuery, setSearchQuery] = useState("");

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
      if (exercise) {
        setSelectedExercise(exercise);
        setView("exercises"); // Mudar para a view de exercícios
      }
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

  const filteredMuscles = useMemo(() => {
    if (!searchQuery.trim()) return muscleDatabase;

    const query = searchQuery.toLowerCase();
    return muscleDatabase.filter(
      (muscle) =>
        muscle.name.toLowerCase().includes(query) ||
        muscle.scientificName.toLowerCase().includes(query) ||
        muscle.description.toLowerCase().includes(query) ||
        muscle.group.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exerciseDatabase;

    const query = searchQuery.toLowerCase();
    return exerciseDatabase.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.primaryMuscles.some((m) => m.toLowerCase().includes(query)) ||
        exercise.secondaryMuscles.some((m) =>
          m.toLowerCase().includes(query)
        ) ||
        exercise.equipment.some((e) => e.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const musclesByGroup = useMemo(() => {
    const grouped: Record<MuscleGroup, MuscleInfo[]> = {
      peito: [],
      costas: [],
      pernas: [],
      ombros: [],
      bracos: [],
      core: [],
      gluteos: [],
      cardio: [],
      funcional: [],
    };

    filteredMuscles.forEach((muscle) => {
      grouped[muscle.group].push(muscle);
    });

    return Object.entries(grouped).filter(([_, muscles]) => muscles.length > 0);
  }, [filteredMuscles]);

  const exercisesByPrimaryMuscle = useMemo(() => {
    const grouped: Record<string, ExerciseInfo[]> = {};

    filteredExercises.forEach((exercise) => {
      exercise.primaryMuscles.forEach((muscle) => {
        if (!grouped[muscle]) {
          grouped[muscle] = [];
        }
        grouped[muscle].push(exercise);
      });
    });

    return Object.entries(grouped)
      .map(([muscle, exercises]) => ({
        muscleGroup: muscle as MuscleGroup,
        exercises,
      }))
      .sort((a, b) => {
        const order: MuscleGroup[] = [
          "peito",
          "costas",
          "pernas",
          "ombros",
          "bracos",
          "core",
          "gluteos",
        ];
        return order.indexOf(a.muscleGroup) - order.indexOf(b.muscleGroup);
      });
  }, [filteredExercises]);

  if (selectedMuscle) {
    return <MuscleDetail muscle={selectedMuscle} onBack={handleBack} />;
  }

  if (selectedExercise) {
    return (
      <ExerciseDetail
        exercise={selectedExercise}
        onBack={handleBack}
        muscleGroupLabels={muscleGroupLabels}
        getDifficultyClasses={getDifficultyClasses}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
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

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={
          view === "muscles" ? "Buscar músculos..." : "Buscar exercícios..."
        }
      />

      {view === "muscles" && (
        <MuscleList
          muscles={filteredMuscles}
          musclesByGroup={musclesByGroup}
          searchQuery={searchQuery}
          onMuscleSelect={handleMuscleSelect}
          muscleGroupLabels={muscleGroupLabels}
        />
      )}

      {view === "exercises" && (
        <ExerciseList
          exercises={filteredExercises}
          exercisesByPrimaryMuscle={exercisesByPrimaryMuscle}
          searchQuery={searchQuery}
          onExerciseSelect={handleExerciseSelect}
          muscleGroupLabels={muscleGroupLabels}
          getDifficultyClasses={getDifficultyClasses}
        />
      )}
    </div>
  );
}
