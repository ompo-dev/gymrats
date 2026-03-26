"use client";

import { useEffect, useMemo, useState } from "react";
import {
  StudentMuscleExplorerScreen,
  type StudentMuscleExplorerView,
} from "@/components/screens/student";
import { exerciseDatabase } from "@/lib/educational-data/exercises";
import { muscleDatabase } from "@/lib/educational-data/muscles";
import type { ExerciseInfo, MuscleGroup, MuscleInfo } from "@/lib/types";
import { ExerciseDetail } from "./components/muscle/exercise-detail";
import { ExerciseList } from "./components/muscle/exercise-list";
import { MuscleDetail } from "./components/muscle/muscle-detail";
import { MuscleList } from "./components/muscle/muscle-list";
import { SearchBar } from "./components/muscle/search-bar";

export interface MuscleExplorerProps {
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
  bracos: "BraÃ§os",
  core: "Core",
  gluteos: "GlÃºteos",
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

function MuscleExplorerSimple({
  muscleId,
  exerciseId,
  onMuscleSelect,
  onExerciseSelect,
  onBack,
}: MuscleExplorerProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleInfo | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseInfo | null>(
    null,
  );
  const [view, setView] = useState<StudentMuscleExplorerView>("muscles");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (muscleId) {
      const muscle = muscleDatabase.find((item) => item.id === muscleId);
      if (muscle) setSelectedMuscle(muscle);
      return;
    }

    setSelectedMuscle(null);
  }, [muscleId]);

  useEffect(() => {
    if (exerciseId) {
      const exercise = exerciseDatabase.find((item) => item.id === exerciseId);
      if (exercise) {
        setSelectedExercise(exercise);
        setView("exercises");
      }
      return;
    }

    setSelectedExercise(null);
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

  const filteredMuscles = useMemo(() => {
    if (!searchQuery.trim()) return muscleDatabase;

    const query = searchQuery.toLowerCase();
    return muscleDatabase.filter(
      (muscle) =>
        muscle.name.toLowerCase().includes(query) ||
        muscle.scientificName.toLowerCase().includes(query) ||
        muscle.description.toLowerCase().includes(query) ||
        muscle.group.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exerciseDatabase;

    const query = searchQuery.toLowerCase();
    return exerciseDatabase.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.primaryMuscles.some((muscle) =>
          muscle.toLowerCase().includes(query),
        ) ||
        exercise.secondaryMuscles.some((muscle) =>
          muscle.toLowerCase().includes(query),
        ) ||
        exercise.equipment.some((equipment) =>
          equipment.toLowerCase().includes(query),
        ),
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

    return Object.entries(grouped).filter(([, muscles]) => muscles.length > 0);
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
      .sort((left, right) => {
        const order: MuscleGroup[] = [
          "peito",
          "costas",
          "pernas",
          "ombros",
          "bracos",
          "core",
          "gluteos",
        ];

        return order.indexOf(left.muscleGroup) - order.indexOf(right.muscleGroup);
      });
  }, [filteredExercises]);

  if (selectedMuscle) {
    return <MuscleDetail muscle={selectedMuscle} onBack={handleBack} />;
  }

  if (selectedExercise) {
    return (
      <ExerciseDetail
        exercise={selectedExercise}
        getDifficultyClasses={getDifficultyClasses}
        muscleGroupLabels={muscleGroupLabels}
        onBack={handleBack}
      />
    );
  }

  return (
    <StudentMuscleExplorerScreen
      contentSlot={
        view === "muscles" ? (
          <MuscleList
            muscleGroupLabels={muscleGroupLabels}
            muscles={filteredMuscles}
            musclesByGroup={musclesByGroup}
            onMuscleSelect={handleMuscleSelect}
            searchQuery={searchQuery}
          />
        ) : (
          <ExerciseList
            exercises={filteredExercises}
            exercisesByPrimaryMuscle={exercisesByPrimaryMuscle}
            getDifficultyClasses={getDifficultyClasses}
            muscleGroupLabels={muscleGroupLabels}
            onExerciseSelect={handleExerciseSelect}
            searchQuery={searchQuery}
          />
        )
      }
      onViewChange={setView}
      searchSlot={
        <SearchBar
          onChange={setSearchQuery}
          placeholder={
            view === "muscles" ? "Buscar mÃºsculos..." : "Buscar exercÃ­cios..."
          }
          value={searchQuery}
        />
      }
      view={view}
    />
  );
}

export const MuscleExplorer = {
  Simple: MuscleExplorerSimple,
};
