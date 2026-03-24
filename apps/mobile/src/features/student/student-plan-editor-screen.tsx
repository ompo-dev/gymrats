import { Ionicons, MaterialIcons } from "@expo/vector-icons";
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
import { colors, radius, spacing, typography } from "../../theme";
import type { WeeklyPlanData, WorkoutExercise, WorkoutSession } from "./types";

type PlanEditorKind = "weekly" | "library";

type WorkoutDraft = {
  title: string;
  description: string;
  muscleGroup: string;
  difficulty: string;
  estimatedTime: string;
};

type ExerciseDraft = {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
};

type StudentPlanEditorScreenProps = {
  activeSourcePlanId?: string | null;
  kind: PlanEditorKind;
  plan: WeeklyPlanData | null;
  planId?: string | null;
  onActivateLibraryPlan?: (libraryPlanId: string) => Promise<void>;
  onBack: () => void;
  onCreateWeeklyPlan?: () => Promise<void>;
  onCreateWorkout: (payload: {
    planSlotId: string;
    title: string;
    description?: string;
    type?: string;
    muscleGroup?: string;
    difficulty?: string;
    estimatedTime?: number;
  }) => Promise<string | null>;
  onCreateWorkoutExercise: (payload: {
    workoutId: string;
    name: string;
    sets?: number;
    reps?: string;
    rest?: number;
    notes?: string;
  }) => Promise<void>;
  onDeleteLibraryPlan?: (planId: string) => Promise<void>;
  onDeleteWorkout: (workoutId: string) => Promise<void>;
  onDeleteWorkoutExercise: (exerciseId: string) => Promise<void>;
  onFetchLibraryPlan?: (planId: string) => Promise<WeeklyPlanData | null>;
  onRefreshParent: () => Promise<void>;
  onResetWeeklyPlan?: () => Promise<void>;
  onUpdateLibraryPlan?: (payload: {
    planId: string;
    title?: string;
    description?: string | null;
  }) => Promise<void>;
  onUpdateWeeklyPlan?: (payload: {
    title?: string;
    description?: string | null;
  }) => Promise<void>;
  onUpdateWorkout: (payload: {
    workoutId: string;
    title?: string;
    description?: string;
    type?: string;
    muscleGroup?: string;
    difficulty?: string;
    estimatedTime?: number;
  }) => Promise<void>;
  onUpdateWorkoutExercise: (payload: {
    exerciseId: string;
    name?: string;
    sets?: number;
    reps?: string;
    rest?: number;
    notes?: string;
  }) => Promise<void>;
};

const DAY_NAMES = [
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
  "Domingo",
];

const DIFFICULTIES = ["iniciante", "intermediario", "avancado"];
const MUSCLE_GROUPS = [
  "full-body",
  "peito",
  "costas",
  "pernas",
  "ombros",
  "bracos",
  "core",
  "gluteos",
  "cardio",
  "funcional",
];

function toWorkoutDraft(workout: WorkoutSession | null): WorkoutDraft {
  return {
    title: workout?.title ?? "",
    description: workout?.description ?? "",
    muscleGroup: workout?.muscleGroup ?? "full-body",
    difficulty: workout?.difficulty ?? "iniciante",
    estimatedTime:
      typeof workout?.estimatedTime === "number"
        ? String(workout.estimatedTime)
        : "45",
  };
}

function toExerciseDraft(exercise: WorkoutExercise): ExerciseDraft {
  return {
    name: exercise.name,
    sets: String(exercise.sets ?? 3),
    reps: exercise.reps ?? "12",
    rest: String(exercise.rest ?? 60),
    notes: exercise.notes ?? "",
  };
}

function ActionChip({
  danger = false,
  label,
  onPress,
  selected = false,
}: {
  danger?: boolean;
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionChip,
        selected && styles.actionChipSelected,
        danger && styles.actionChipDanger,
      ]}
    >
      <Text
        style={[
          styles.actionChipText,
          selected && styles.actionChipTextSelected,
          danger && styles.actionChipTextDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function InputField({
  keyboardType,
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?:
    | "default"
    | "number-pad"
    | "decimal-pad"
    | "email-address"
    | "phone-pad";
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.foregroundMuted}
        style={[styles.input, multiline && styles.multilineInput]}
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
    </View>
  );
}

export function StudentPlanEditorScreen({
  activeSourcePlanId,
  kind,
  plan,
  planId,
  onActivateLibraryPlan,
  onBack,
  onCreateWeeklyPlan,
  onCreateWorkout,
  onCreateWorkoutExercise,
  onDeleteLibraryPlan,
  onDeleteWorkout,
  onDeleteWorkoutExercise,
  onFetchLibraryPlan,
  onRefreshParent,
  onResetWeeklyPlan,
  onUpdateLibraryPlan,
  onUpdateWeeklyPlan,
  onUpdateWorkout,
  onUpdateWorkoutExercise,
}: StudentPlanEditorScreenProps) {
  const isLibrary = kind === "library";
  const [currentPlan, setCurrentPlan] = useState<WeeklyPlanData | null>(
    isLibrary ? null : plan,
  );
  const [title, setTitle] = useState(plan?.title ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [loading, setLoading] = useState(isLibrary);
  const [savingMeta, setSavingMeta] = useState(false);
  const [creatingWeeklyPlan, setCreatingWeeklyPlan] = useState(false);
  const [activatingLibrary, setActivatingLibrary] = useState(false);
  const [resettingWeek, setResettingWeek] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [workoutDraft, setWorkoutDraft] = useState<WorkoutDraft>(
    toWorkoutDraft(null),
  );
  const [exerciseDrafts, setExerciseDrafts] = useState<
    Record<string, ExerciseDraft>
  >({});
  const [newExerciseDraft, setNewExerciseDraft] = useState<ExerciseDraft>({
    name: "",
    sets: "3",
    reps: "12",
    rest: "60",
    notes: "",
  });

  const selectedWorkout = useMemo(() => {
    if (!currentPlan || !selectedWorkoutId) {
      return null;
    }

    for (const slot of currentPlan.slots) {
      if (slot.type === "workout" && slot.workout?.id === selectedWorkoutId) {
        return slot.workout;
      }
    }

    return null;
  }, [currentPlan, selectedWorkoutId]);

  const refreshEditor = useCallback(
    async (preferredWorkoutId?: string | null) => {
      await onRefreshParent();

      if (isLibrary && planId && onFetchLibraryPlan) {
        const nextPlan = await onFetchLibraryPlan(planId);
        setCurrentPlan(nextPlan);
        setTitle(nextPlan?.title ?? "");
        setDescription(nextPlan?.description ?? "");
      }

      if (preferredWorkoutId !== undefined) {
        setSelectedWorkoutId(preferredWorkoutId);
      }
    },
    [description, isLibrary, onFetchLibraryPlan, onRefreshParent, planId],
  );

  useEffect(() => {
    if (!isLibrary) {
      setCurrentPlan(plan);
      setTitle(plan?.title ?? "");
      setDescription(plan?.description ?? "");
      return;
    }

    if (!planId || !onFetchLibraryPlan) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);

      try {
        const payload = await onFetchLibraryPlan(planId);
        if (cancelled) {
          return;
        }
        setCurrentPlan(payload);
        setTitle(payload?.title ?? "");
        setDescription(payload?.description ?? "");
      } catch (error) {
        if (!cancelled) {
          Alert.alert(
            "Nao foi possivel abrir o plano",
            error instanceof Error ? error.message : "Erro inesperado.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isLibrary, onFetchLibraryPlan, plan, planId]);

  useEffect(() => {
    if (!selectedWorkout) {
      setWorkoutDraft(toWorkoutDraft(null));
      setExerciseDrafts({});
      setNewExerciseDraft({
        name: "",
        sets: "3",
        reps: "12",
        rest: "60",
        notes: "",
      });
      return;
    }

    setWorkoutDraft(toWorkoutDraft(selectedWorkout));
    setExerciseDrafts(
      (selectedWorkout.exercises ?? []).reduce<Record<string, ExerciseDraft>>(
        (accumulator, exercise) => {
          accumulator[exercise.id] = toExerciseDraft(exercise);
          return accumulator;
        },
        {},
      ),
    );
  }, [selectedWorkout]);

  if (loading) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.centerTitle}>Carregando plano...</Text>
        <Text style={styles.centerText}>Sincronizando workout, slots e exercicios.</Text>
      </View>
    );
  }

  if (!currentPlan) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.centerTitle}>Plano nao encontrado</Text>
        <Text style={styles.centerText}>
          {isLibrary
            ? "Este template nao esta mais disponivel."
            : "Crie um plano semanal para comecar a edicao manual."}
        </Text>
        {!isLibrary && onCreateWeeklyPlan ? (
          <PrimaryButton
            disabled={creatingWeeklyPlan}
            onPress={() => {
              void (async () => {
                setCreatingWeeklyPlan(true);
                try {
                  await onCreateWeeklyPlan();
                  await onRefreshParent();
                } catch (error) {
                  Alert.alert(
                    "Nao foi possivel criar o plano",
                    error instanceof Error ? error.message : "Erro inesperado.",
                  );
                } finally {
                  setCreatingWeeklyPlan(false);
                }
              })();
            }}
            title={creatingWeeklyPlan ? "Criando..." : "Criar plano semanal"}
          />
        ) : (
          <SecondaryButton onPress={onBack} title="Voltar" />
        )}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.blue} name="arrow-back" size={16} />
        <Text style={styles.backButtonText}>Voltar para treinos</Text>
      </Pressable>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          {isLibrary ? "Editor da Biblioteca" : "Editor do Plano Semanal"}
        </Text>
        <Text style={styles.heroSubtitle}>
          {isLibrary
            ? "Gerencie templates e ative o treino certo."
            : "Edite a semana, workouts e exercicios nativamente."}
        </Text>
      </View>

      <DuoCard>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <MaterialIcons
              color={isLibrary ? colors.warning : colors.secondary}
              name={isLibrary ? "library-books" : "edit-calendar"}
              size={20}
            />
            <Text style={styles.cardTitle}>Cabecalho do plano</Text>
          </View>
          {isLibrary &&
          currentPlan.id &&
          activeSourcePlanId &&
          currentPlan.id === activeSourcePlanId ? (
            <Text style={styles.activeBadge}>Em uso</Text>
          ) : null}
        </View>

        <InputField
          label="Titulo"
          onChangeText={setTitle}
          placeholder="Meu Plano Semanal"
          value={title}
        />
        <InputField
          label="Descricao"
          multiline
          onChangeText={setDescription}
          placeholder="Ex: 7 dias de treino e descanso"
          value={description}
        />
        <PrimaryButton
          disabled={savingMeta}
          onPress={() => {
            void (async () => {
              if (!title.trim()) {
                Alert.alert("Titulo obrigatorio", "Informe um nome para o plano.");
                return;
              }

              setSavingMeta(true);
              try {
                if (isLibrary) {
                  if (!onUpdateLibraryPlan) {
                    return;
                  }

                  await onUpdateLibraryPlan({
                    planId: currentPlan.id,
                    title: title.trim(),
                    description: description.trim() || null,
                  });
                } else {
                  if (!onUpdateWeeklyPlan) {
                    return;
                  }

                  await onUpdateWeeklyPlan({
                    title: title.trim(),
                    description: description.trim() || null,
                  });
                }

                await refreshEditor(selectedWorkoutId);
              } catch (error) {
                Alert.alert(
                  "Nao foi possivel salvar o plano",
                  error instanceof Error ? error.message : "Erro inesperado.",
                );
              } finally {
                setSavingMeta(false);
              }
            })();
          }}
          title={savingMeta ? "Salvando..." : "Salvar cabecalho"}
        />

        {isLibrary && onActivateLibraryPlan ? (
          <SecondaryButton
            disabled={activatingLibrary}
            onPress={() => {
              void (async () => {
                setActivatingLibrary(true);
                try {
                  await onActivateLibraryPlan(currentPlan.id);
                  await onRefreshParent();
                } catch (error) {
                  Alert.alert(
                    "Nao foi possivel ativar o plano",
                    error instanceof Error ? error.message : "Erro inesperado.",
                  );
                } finally {
                  setActivatingLibrary(false);
                }
              })();
            }}
            title={activatingLibrary ? "Ativando..." : "Ativar no plano semanal"}
          />
        ) : null}

        {!isLibrary && onResetWeeklyPlan ? (
          <SecondaryButton
            disabled={resettingWeek}
            onPress={() => {
              void (async () => {
                setResettingWeek(true);
                try {
                  await onResetWeeklyPlan();
                  await onRefreshParent();
                } catch (error) {
                  Alert.alert(
                    "Nao foi possivel resetar a semana",
                    error instanceof Error ? error.message : "Erro inesperado.",
                  );
                } finally {
                  setResettingWeek(false);
                }
              })();
            }}
            title={resettingWeek ? "Resetando..." : "Resetar semana"}
          />
        ) : null}

        {isLibrary && onDeleteLibraryPlan ? (
          <SecondaryButton
            onPress={() => {
              Alert.alert(
                "Excluir plano da biblioteca?",
                "Essa acao nao pode ser desfeita.",
                [
                  { style: "cancel", text: "Cancelar" },
                  {
                    style: "destructive",
                    text: "Excluir",
                    onPress: () => {
                      void (async () => {
                        try {
                          await onDeleteLibraryPlan(currentPlan.id);
                          await onRefreshParent();
                          onBack();
                        } catch (error) {
                          Alert.alert(
                            "Nao foi possivel excluir",
                            error instanceof Error
                              ? error.message
                              : "Erro inesperado.",
                          );
                        }
                      })();
                    },
                  },
                ],
              );
            }}
            title="Excluir da biblioteca"
          />
        ) : null}
      </DuoCard>

      <DuoCard>
        <View style={styles.cardHeaderLeft}>
          <Ionicons color={colors.secondary} name="calendar-outline" size={20} />
          <Text style={styles.cardTitle}>Dias da semana</Text>
        </View>
        <View style={styles.dayStack}>
          {currentPlan.slots
            .slice()
            .sort((left, right) => left.dayOfWeek - right.dayOfWeek)
            .map((slot) => {
              const workout =
                slot.type === "workout" ? slot.workout ?? null : null;
              const selected = workout?.id === selectedWorkoutId;

              return (
                <View key={slot.id} style={styles.dayCard}>
                  <Text style={styles.dayTitle}>
                    {DAY_NAMES[slot.dayOfWeek] || `Dia ${slot.dayOfWeek + 1}`}
                  </Text>
                  <Text style={styles.dayMeta}>
                    {workout
                      ? `${workout.title} • ${workout.exercises?.length ?? 0} exercicios`
                      : "Descanso"}
                  </Text>
                  {workout ? (
                    <View style={styles.inlineActions}>
                      <ActionChip
                        label={selected ? "Editando" : "Editar"}
                        onPress={() => setSelectedWorkoutId(workout.id)}
                        selected={selected}
                      />
                      <ActionChip
                        danger
                        label="Remover"
                        onPress={() => {
                          Alert.alert(
                            "Remover treino?",
                            "O dia volta a ser descanso.",
                            [
                              { style: "cancel", text: "Cancelar" },
                              {
                                style: "destructive",
                                text: "Remover",
                                onPress: () => {
                                  void (async () => {
                                    try {
                                      await onDeleteWorkout(workout.id);
                                      await refreshEditor(
                                        selectedWorkoutId === workout.id
                                          ? null
                                          : selectedWorkoutId,
                                      );
                                    } catch (error) {
                                      Alert.alert(
                                        "Nao foi possivel remover",
                                        error instanceof Error
                                          ? error.message
                                          : "Erro inesperado.",
                                      );
                                    }
                                  })();
                                },
                              },
                            ],
                          );
                        }}
                      />
                    </View>
                  ) : (
                    <ActionChip
                      label={
                        selectedWorkoutId === slot.id
                          ? "Criando..."
                          : "Adicionar treino"
                      }
                      onPress={() => {
                        void (async () => {
                          try {
                            const workoutId = await onCreateWorkout({
                              planSlotId: slot.id,
                              title: `Treino ${DAY_NAMES[slot.dayOfWeek]}`,
                              description: "",
                              difficulty: "iniciante",
                              estimatedTime: 45,
                              muscleGroup: "full-body",
                              type: "strength",
                            });
                            await refreshEditor(workoutId);
                          } catch (error) {
                            Alert.alert(
                              "Nao foi possivel criar o treino",
                              error instanceof Error
                                ? error.message
                                : "Erro inesperado.",
                            );
                          }
                        })();
                      }}
                    />
                  )}
                </View>
              );
            })}
        </View>
      </DuoCard>

      {selectedWorkout ? (
        <DuoCard>
          <View style={styles.cardHeaderLeft}>
            <Ionicons color={colors.blue} name="barbell-outline" size={20} />
            <Text style={styles.cardTitle}>Workout selecionado</Text>
          </View>

          <InputField
            label="Nome do treino"
            onChangeText={(value) =>
              setWorkoutDraft((state) => ({ ...state, title: value }))
            }
            placeholder="Treino de peito"
            value={workoutDraft.title}
          />
          <InputField
            label="Descricao"
            multiline
            onChangeText={(value) =>
              setWorkoutDraft((state) => ({ ...state, description: value }))
            }
            placeholder="Objetivo e observacoes"
            value={workoutDraft.description}
          />
          <InputField
            keyboardType="number-pad"
            label="Tempo estimado"
            onChangeText={(value) =>
              setWorkoutDraft((state) => ({
                ...state,
                estimatedTime: value.replace(/[^0-9]/g, ""),
              }))
            }
            placeholder="45"
            value={workoutDraft.estimatedTime}
          />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Grupo muscular</Text>
            <View style={styles.inlineActions}>
              {MUSCLE_GROUPS.map((group) => (
                <ActionChip
                  key={group}
                  label={group}
                  onPress={() =>
                    setWorkoutDraft((state) => ({ ...state, muscleGroup: group }))
                  }
                  selected={workoutDraft.muscleGroup === group}
                />
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Dificuldade</Text>
            <View style={styles.inlineActions}>
              {DIFFICULTIES.map((difficulty) => (
                <ActionChip
                  key={difficulty}
                  label={difficulty}
                  onPress={() =>
                    setWorkoutDraft((state) => ({ ...state, difficulty }))
                  }
                  selected={workoutDraft.difficulty === difficulty}
                />
              ))}
            </View>
          </View>
          <PrimaryButton
            onPress={() => {
              void (async () => {
                try {
                  await onUpdateWorkout({
                    workoutId: selectedWorkout.id,
                    title: workoutDraft.title.trim(),
                    description: workoutDraft.description.trim(),
                    difficulty: workoutDraft.difficulty,
                    estimatedTime: Number(workoutDraft.estimatedTime || "0") || 0,
                    muscleGroup: workoutDraft.muscleGroup,
                    type: "strength",
                  });
                  await refreshEditor(selectedWorkout.id);
                } catch (error) {
                  Alert.alert(
                    "Nao foi possivel salvar o treino",
                    error instanceof Error ? error.message : "Erro inesperado.",
                  );
                }
              })();
            }}
            title="Salvar treino"
          />

          <View style={styles.exerciseStack}>
            {(selectedWorkout.exercises ?? []).map((exercise) => {
              const draft =
                exerciseDrafts[exercise.id] ?? toExerciseDraft(exercise);

              return (
                <View key={exercise.id} style={styles.exerciseCard}>
                  <InputField
                    label="Nome"
                    onChangeText={(value) =>
                      setExerciseDrafts((state) => ({
                        ...state,
                        [exercise.id]: { ...draft, name: value },
                      }))
                    }
                    placeholder="Supino reto"
                    value={draft.name}
                  />
                  <View style={styles.row}>
                    <View style={styles.rowItem}>
                      <InputField
                        keyboardType="number-pad"
                        label="Series"
                        onChangeText={(value) =>
                          setExerciseDrafts((state) => ({
                            ...state,
                            [exercise.id]: {
                              ...draft,
                              sets: value.replace(/[^0-9]/g, ""),
                            },
                          }))
                        }
                        placeholder="3"
                        value={draft.sets}
                      />
                    </View>
                    <View style={styles.rowItem}>
                      <InputField
                        keyboardType="number-pad"
                        label="Reps"
                        onChangeText={(value) =>
                          setExerciseDrafts((state) => ({
                            ...state,
                            [exercise.id]: { ...draft, reps: value },
                          }))
                        }
                        placeholder="12"
                        value={draft.reps}
                      />
                    </View>
                    <View style={styles.rowItem}>
                      <InputField
                        keyboardType="number-pad"
                        label="Descanso"
                        onChangeText={(value) =>
                          setExerciseDrafts((state) => ({
                            ...state,
                            [exercise.id]: {
                              ...draft,
                              rest: value.replace(/[^0-9]/g, ""),
                            },
                          }))
                        }
                        placeholder="60"
                        value={draft.rest}
                      />
                    </View>
                  </View>
                  <InputField
                    label="Observacoes"
                    multiline
                    onChangeText={(value) =>
                      setExerciseDrafts((state) => ({
                        ...state,
                        [exercise.id]: { ...draft, notes: value },
                      }))
                    }
                    placeholder="Cadencia, tecnica e amplitude"
                    value={draft.notes}
                  />
                  <View style={styles.inlineActions}>
                    <ActionChip
                      label="Salvar"
                      onPress={() => {
                        void (async () => {
                          try {
                            await onUpdateWorkoutExercise({
                              exerciseId: exercise.id,
                              name: draft.name.trim(),
                              notes: draft.notes.trim(),
                              reps: draft.reps.trim() || "12",
                              rest: Number(draft.rest || "0") || 0,
                              sets: Number(draft.sets || "0") || 3,
                            });
                            await refreshEditor(selectedWorkout.id);
                          } catch (error) {
                            Alert.alert(
                              "Nao foi possivel salvar o exercicio",
                              error instanceof Error
                                ? error.message
                                : "Erro inesperado.",
                            );
                          }
                        })();
                      }}
                    />
                    <ActionChip
                      danger
                      label="Excluir"
                      onPress={() => {
                        Alert.alert(
                          "Excluir exercicio?",
                          "Essa acao remove o exercicio do treino.",
                          [
                            { style: "cancel", text: "Cancelar" },
                            {
                              style: "destructive",
                              text: "Excluir",
                              onPress: () => {
                                void (async () => {
                                  try {
                                    await onDeleteWorkoutExercise(exercise.id);
                                    await refreshEditor(selectedWorkout.id);
                                  } catch (error) {
                                    Alert.alert(
                                      "Nao foi possivel excluir",
                                      error instanceof Error
                                        ? error.message
                                        : "Erro inesperado.",
                                    );
                                  }
                                })();
                              },
                            },
                          ],
                        );
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.exerciseCard}>
            <Text style={styles.cardTitle}>Novo exercicio</Text>
            <InputField
              label="Nome"
              onChangeText={(value) =>
                setNewExerciseDraft((state) => ({ ...state, name: value }))
              }
              placeholder="Ex: Agachamento livre"
              value={newExerciseDraft.name}
            />
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <InputField
                  keyboardType="number-pad"
                  label="Series"
                  onChangeText={(value) =>
                    setNewExerciseDraft((state) => ({
                      ...state,
                      sets: value.replace(/[^0-9]/g, ""),
                    }))
                  }
                  placeholder="3"
                  value={newExerciseDraft.sets}
                />
              </View>
              <View style={styles.rowItem}>
                <InputField
                  keyboardType="number-pad"
                  label="Reps"
                  onChangeText={(value) =>
                    setNewExerciseDraft((state) => ({ ...state, reps: value }))
                  }
                  placeholder="12"
                  value={newExerciseDraft.reps}
                />
              </View>
              <View style={styles.rowItem}>
                <InputField
                  keyboardType="number-pad"
                  label="Descanso"
                  onChangeText={(value) =>
                    setNewExerciseDraft((state) => ({
                      ...state,
                      rest: value.replace(/[^0-9]/g, ""),
                    }))
                  }
                  placeholder="60"
                  value={newExerciseDraft.rest}
                />
              </View>
            </View>
            <InputField
              label="Observacoes"
              multiline
              onChangeText={(value) =>
                setNewExerciseDraft((state) => ({ ...state, notes: value }))
              }
              placeholder="Instrucoes curtas"
              value={newExerciseDraft.notes}
            />
            <PrimaryButton
              onPress={() => {
                void (async () => {
                  if (!newExerciseDraft.name.trim()) {
                    Alert.alert(
                      "Nome obrigatorio",
                      "Informe o nome do exercicio.",
                    );
                    return;
                  }

                  try {
                    await onCreateWorkoutExercise({
                      workoutId: selectedWorkout.id,
                      name: newExerciseDraft.name.trim(),
                      notes: newExerciseDraft.notes.trim() || undefined,
                      reps: newExerciseDraft.reps.trim() || "12",
                      rest: Number(newExerciseDraft.rest || "0") || 0,
                      sets: Number(newExerciseDraft.sets || "0") || 3,
                    });
                    await refreshEditor(selectedWorkout.id);
                    setNewExerciseDraft({
                      name: "",
                      sets: "3",
                      reps: "12",
                      rest: "60",
                      notes: "",
                    });
                  } catch (error) {
                    Alert.alert(
                      "Nao foi possivel adicionar o exercicio",
                      error instanceof Error ? error.message : "Erro inesperado.",
                    );
                  }
                })();
              }}
              title="Adicionar exercicio"
            />
          </View>
        </DuoCard>
      ) : (
        <DuoCard>
          <Text style={styles.emptyInlineText}>
            Selecione um workout em um dos dias para editar titulo, dificuldade
            e exercicios.
          </Text>
        </DuoCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
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
  hero: {
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  heroTitle: {
    color: colors.foreground,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  heroSubtitle: {
    color: colors.foregroundMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardHeaderLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  cardTitle: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "900",
  },
  activeBadge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  actionChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionChipDanger: {
    backgroundColor: "#fde7e9",
    borderColor: colors.danger,
  },
  actionChipSelected: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
  },
  actionChipText: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: "800",
  },
  actionChipTextDanger: {
    color: colors.danger,
  },
  actionChipTextSelected: {
    color: colors.blue,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.foregroundMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multilineInput: {
    minHeight: 96,
  },
  dayStack: {
    gap: spacing.sm,
  },
  dayCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  dayTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "900",
  },
  dayMeta: {
    color: colors.foregroundMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  exerciseStack: {
    gap: spacing.sm,
  },
  exerciseCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  emptyInlineText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
