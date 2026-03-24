import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PrimaryButton, SecondaryButton } from "../../components/buttons";
import { DuoCard } from "../../components/duo-card";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import type {
  StudentHomeData,
  StudentWorkoutProgress,
  StudentWorkoutProgressLog,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSetLog,
} from "./types";

type Props = {
  workoutId: string;
  data: StudentHomeData;
  onBack: () => void;
  onComplete: (payload: {
    workoutId: string;
    exerciseLogs: StudentWorkoutProgress["exerciseLogs"];
    duration: number;
    totalVolume: number;
    startTime: string | null;
  }) => Promise<void>;
  onLoadProgress: (workoutId: string) => Promise<{
    progress: StudentWorkoutProgress | null;
  }>;
  onSaveProgress: (payload: {
    workoutId: string;
    currentExerciseIndex: number;
    exerciseLogs: StudentWorkoutProgress["exerciseLogs"];
    skippedExercises: string[];
    selectedAlternatives: Record<string, string>;
    totalVolume: number;
    completionPercentage: number;
    startTime: string | null;
  }) => Promise<void>;
};

function parseReps(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function createDefaultLog(workoutId: string, exercise: WorkoutExercise): StudentWorkoutProgressLog {
  const defaultReps = parseReps(exercise.reps);
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    difficulty: "medio",
    notes: exercise.notes ?? null,
    sets: Array.from({ length: Math.max(exercise.sets || 1, 1) }, () => ({
      completed: false,
      reps: defaultReps,
      weight: null,
    })),
  };
}

function mapLogs(logs: StudentWorkoutProgress["exerciseLogs"]) {
  return logs.reduce<Record<string, StudentWorkoutProgressLog>>((accumulator, log) => {
    accumulator[log.exerciseId] = log;
    return accumulator;
  }, {});
}

export function StudentWorkoutScreen({
  data,
  onBack,
  onComplete,
  onLoadProgress,
  onSaveProgress,
  workoutId,
}: Props) {
  const workout = useMemo(() => {
    const unitMatch = data.units
      .flatMap((unit) => unit.workouts)
      .find((item) => item.id === workoutId);

    if (unitMatch) {
      return unitMatch as WorkoutSession;
    }

    return (
      data.weeklyPlan?.slots.find((slot) => slot.type === "workout" && slot.workout?.id === workoutId)
        ?.workout || null
    ) as WorkoutSession | null;
  }, [data.units, data.weeklyPlan?.slots, workoutId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [logs, setLogs] = useState<Record<string, StudentWorkoutProgressLog>>({});
  const [selectedAlternatives, setSelectedAlternatives] = useState<Record<string, string>>({});
  const [skippedExercises, setSkippedExercises] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string | null>(new Date().toISOString());
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workout) {
      setLoadingProgress(false);
      return;
    }

    void onLoadProgress(workout.id)
      .then((response) => {
        if (response.progress) {
          setCurrentIndex(response.progress.currentExerciseIndex);
          setLogs(mapLogs(response.progress.exerciseLogs));
          setSelectedAlternatives(response.progress.selectedAlternatives || {});
          setSkippedExercises(response.progress.skippedExercises || []);
          setStartTime(response.progress.startTime || new Date().toISOString());
        } else {
          const initialLogs = workout.exercises?.reduce<Record<string, StudentWorkoutProgressLog>>(
            (accumulator, exercise) => {
              accumulator[exercise.id] = createDefaultLog(workout.id, exercise);
              return accumulator;
            },
            {},
          );
          setLogs(initialLogs || {});
        }
      })
      .catch((error) => {
        Alert.alert(
          "Nao foi possivel carregar o progresso",
          error instanceof Error ? error.message : "Erro inesperado.",
        );
      })
      .finally(() => setLoadingProgress(false));
  }, [onLoadProgress, workout]);

  const exercises = workout?.exercises ?? [];
  const currentExercise = exercises[currentIndex];
  const currentLog = currentExercise ? logs[currentExercise.id] : undefined;

  const totalVolume = useMemo(() => {
    return Object.values(logs).reduce((sum, log) => {
      return (
        sum +
        (log.sets || []).reduce((setSum, set) => {
          if (!set.completed || !set.weight || !set.reps) {
            return setSum;
          }

          return setSum + set.weight * set.reps;
        }, 0)
      );
    }, 0);
  }, [logs]);

  const completedCount = useMemo(() => {
    return exercises.filter((exercise) => {
      const log = logs[exercise.id];
      return Boolean(log?.sets?.length && log.sets.every((set) => set.completed));
    }).length;
  }, [exercises, logs]);

  const completionPercentage = exercises.length
    ? Math.min(
        100,
        Math.round(((completedCount + skippedExercises.length) / exercises.length) * 100),
      )
    : 0;

  const persistProgress = useCallback(
    async (nextIndex: number) => {
      if (!workout) {
        return;
      }

      await onSaveProgress({
        workoutId: workout.id,
        currentExerciseIndex: nextIndex,
        exerciseLogs: Object.values(logs),
        skippedExercises,
        selectedAlternatives,
        totalVolume,
        completionPercentage,
        startTime,
      });
    },
    [
      completionPercentage,
      logs,
      onSaveProgress,
      selectedAlternatives,
      skippedExercises,
      startTime,
      totalVolume,
      workout,
    ],
  );

  const updateSet = (setIndex: number, patch: Partial<WorkoutSetLog>) => {
    if (!currentExercise || !currentLog) {
      return;
    }

    setLogs((state) => ({
      ...state,
      [currentExercise.id]: {
        ...currentLog,
        sets: (currentLog.sets || []).map((set, index) =>
          index === setIndex ? { ...set, ...patch } : set,
        ),
      },
    }));
  };

  const selectAlternative = (alternativeId?: string) => {
    if (!currentExercise) {
      return;
    }

    setSelectedAlternatives((state) => {
      const next = { ...state };

      if (!alternativeId) {
        delete next[currentExercise.id];
        return next;
      }

      next[currentExercise.id] = alternativeId;
      return next;
    });
  };

  const handleNext = async () => {
    if (!workout) {
      return;
    }

    setSaving(true);

    try {
      if (currentIndex >= exercises.length - 1) {
        const duration = startTime
          ? Math.max(
              1,
              Math.round((Date.now() - new Date(startTime).getTime()) / 60000),
            )
          : workout.estimatedTime || 1;

        await onComplete({
          workoutId: workout.id,
          exerciseLogs: Object.values(logs),
          duration,
          totalVolume,
          startTime,
        });

        Alert.alert("Treino concluido", "Seu treino foi salvo com sucesso.");
        onBack();
        return;
      }

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      await persistProgress(nextIndex);
    } catch (error) {
      Alert.alert(
        "Nao foi possivel salvar o treino",
        error instanceof Error ? error.message : "Erro inesperado.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!currentExercise) {
      return;
    }

    const nextSkipped = Array.from(new Set([...skippedExercises, currentExercise.id]));
    setSkippedExercises(nextSkipped);

    const nextIndex = Math.min(currentIndex + 1, Math.max(exercises.length - 1, 0));
    setCurrentIndex(nextIndex);

    try {
      await onSaveProgress({
        workoutId,
        currentExerciseIndex: nextIndex,
        exerciseLogs: Object.values(logs),
        skippedExercises: nextSkipped,
        selectedAlternatives,
        totalVolume,
        completionPercentage,
        startTime,
      });
    } catch (error) {
      Alert.alert(
        "Nao foi possivel pular o exercicio",
        error instanceof Error ? error.message : "Erro inesperado.",
      );
    }
  };

  if (!workout) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.centerTitle}>Treino nao encontrado</Text>
        <Text style={styles.centerText}>
          O plano foi atualizado e este treino nao esta mais disponivel.
        </Text>
        <SecondaryButton onPress={onBack} title="Voltar" />
      </View>
    );
  }

  if (loadingProgress || !currentExercise || !currentLog) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.centerTitle}>Preparando treino...</Text>
        <Text style={styles.centerText}>
          Carregando exercicios e progresso salvo.
        </Text>
      </View>
    );
  }

  const selectedAlternativeId = selectedAlternatives[currentExercise.id];
  const selectedAlternative = currentExercise.alternatives?.find(
    (item) => item.id === selectedAlternativeId,
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable
        onPress={() => {
          void persistProgress(currentIndex).finally(onBack);
        }}
        style={styles.backButton}
      >
        <Ionicons color={colors.blue} name="arrow-back" size={16} />
        <Text style={styles.backButtonText}>Voltar para treinos</Text>
      </Pressable>

      <DuoCard>
        <Text style={styles.heroTitle}>{workout.title}</Text>
        <Text style={styles.heroSubtitle}>
          {workout.muscleGroup || "Treino"} • {workout.difficulty || "intermediario"} •{" "}
          {workout.estimatedTime || 0} min
        </Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            Exercicio {currentIndex + 1} de {exercises.length}
          </Text>
          <Text style={styles.progressText}>{completionPercentage}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
        </View>
      </DuoCard>

      <DuoCard>
        <View style={styles.cardHeader}>
          <View style={styles.listBody}>
            <Text style={styles.exerciseTitle}>
              {selectedAlternative?.name || currentExercise.name}
            </Text>
            <Text style={styles.exerciseMeta}>
              {currentExercise.sets} series • {currentExercise.reps} • descanso {currentExercise.rest}s
            </Text>
          </View>
          {skippedExercises.includes(currentExercise.id) ? (
            <Text style={styles.skippedBadge}>Pulado</Text>
          ) : null}
        </View>

        {currentExercise.notes ? (
          <Text style={styles.noteText}>{currentExercise.notes}</Text>
        ) : null}

        <View style={styles.stack}>
          {(currentLog.sets || []).map((set, setIndex) => (
            <View key={`${currentExercise.id}-set-${setIndex}`} style={styles.setCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.setTitle}>Serie {setIndex + 1}</Text>
                <Pressable
                  onPress={() => updateSet(setIndex, { completed: !set.completed })}
                  style={[
                    styles.completeBadge,
                    set.completed && styles.completeBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.completeBadgeText,
                      set.completed && styles.completeBadgeTextActive,
                    ]}
                  >
                    {set.completed ? "Feita" : "Pendente"}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.inputsRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Peso (kg)</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={(value) =>
                      updateSet(setIndex, {
                        weight: value ? Number(value.replace(",", ".")) : null,
                      })
                    }
                    style={styles.input}
                    value={set.weight != null ? String(set.weight) : ""}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(value) =>
                      updateSet(setIndex, {
                        reps: value ? Number(value) : null,
                      })
                    }
                    style={styles.input}
                    value={set.reps != null ? String(set.reps) : ""}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </DuoCard>

      {currentExercise.alternatives?.length ? (
        <DuoCard>
          <Text style={styles.cardTitle}>Alternativas</Text>
          <View style={styles.filterWrap}>
            <Pressable
              onPress={() => selectAlternative(undefined)}
              style={[
                styles.altPill,
                !selectedAlternativeId && styles.altPillActive,
              ]}
            >
              <Text
                style={[
                  styles.altPillText,
                  !selectedAlternativeId && styles.altPillTextActive,
                ]}
              >
                Exercicio original
              </Text>
            </Pressable>
            {currentExercise.alternatives.map((alternative) => {
              const active = alternative.id === selectedAlternativeId;

              return (
                <Pressable
                  key={alternative.id}
                  onPress={() => selectAlternative(alternative.id)}
                  style={[styles.altPill, active && styles.altPillActive]}
                >
                  <Text style={[styles.altPillText, active && styles.altPillTextActive]}>
                    {alternative.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </DuoCard>
      ) : null}

      {currentExercise.instructions?.length ? (
        <DuoCard>
          <Text style={styles.cardTitle}>Instrucoes</Text>
          {currentExercise.instructions.map((item) => (
            <Text key={item} style={styles.detailText}>
              • {item}
            </Text>
          ))}
        </DuoCard>
      ) : null}

      {currentExercise.tips?.length ? (
        <DuoCard>
          <Text style={styles.cardTitle}>Dicas</Text>
          {currentExercise.tips.map((item) => (
            <Text key={item} style={styles.detailText}>
              • {item}
            </Text>
          ))}
        </DuoCard>
      ) : null}

      <DuoCard>
        <Text style={styles.cardTitle}>Resumo da sessao</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Exercicios completos</Text>
          <Text style={styles.summaryValue}>{completedCount}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Volume total</Text>
          <Text style={styles.summaryValue}>{Math.round(totalVolume)} kg</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Exercicios pulados</Text>
          <Text style={styles.summaryValue}>{skippedExercises.length}</Text>
        </View>
      </DuoCard>

      <View style={styles.actionStack}>
        <PrimaryButton
          disabled={saving}
          onPress={() => void handleNext()}
          title={
            saving
              ? "Salvando..."
              : currentIndex >= exercises.length - 1
                ? "Concluir treino"
                : "Salvar e avancar"
          }
        />
        <SecondaryButton onPress={() => void handleSkip()} title="Pular exercicio" />
        {currentIndex > 0 ? (
          <SecondaryButton
            onPress={() => {
              const previousIndex = Math.max(currentIndex - 1, 0);
              setCurrentIndex(previousIndex);
              void persistProgress(previousIndex);
            }}
            title="Exercicio anterior"
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.lg,
  },
  centerTitle: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  centerText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  backButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: "900",
  },
  heroTitle: {
    color: colors.foreground,
    fontSize: 26,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    color: colors.foregroundMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  progressTrack: {
    backgroundColor: colors.border,
    borderRadius: radius.round,
    height: 12,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: "100%",
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  listBody: {
    flex: 1,
    gap: 4,
  },
  exerciseTitle: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: "900",
  },
  exerciseMeta: {
    color: colors.foregroundMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  skippedBadge: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "900",
  },
  noteText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  stack: {
    gap: spacing.sm,
  },
  setCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  setTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "900",
  },
  completeBadge: {
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  completeBadgeActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  completeBadgeText: {
    color: colors.foregroundMuted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  completeBadgeTextActive: {
    color: colors.primaryDark,
  },
  inputsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inputGroup: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    color: colors.foregroundMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "800",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cardTitle: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "900",
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  altPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  altPillActive: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
  },
  altPillText: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: "800",
  },
  altPillTextActive: {
    color: colors.blue,
  },
  detailText: {
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 20,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: colors.foregroundMuted,
    fontSize: 12,
  },
  summaryValue: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "900",
  },
  actionStack: {
    gap: spacing.sm,
  },
});
