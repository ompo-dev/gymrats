/**
 * Store Unificado para Student
 *
 * Este store consolida todos os dados do student em um único lugar,
 * substituindo múltiplos stores fragmentados.
 *
 * Uso: Prefira usar o hook useStudent() em vez de acessar o store diretamente
 */

import { create } from "zustand";

import { actionClient as apiClient } from "@/lib/actions/client";
import { log } from "@/lib/observability/logger";
import type {
  DailyNutrition,
  DifficultyLevel,
  MuscleGroup,
  NutritionPlanData,
  PersonalRecord,
  Unit,
  UserProgress,
  WeeklyPlanData,
  WorkoutExercise,
  WorkoutSession,
  WorkoutType,
} from "@/lib/types";
import type {
  StudentData,
  StudentDataSection,
  StudentJoinGymResult,
  StudentPaymentPlanOption,
  StudentPixPaymentPayload,
  StudentReferralApplyResult,
  WorkoutCompletionData,
} from "@/lib/types/student-unified";
import { initialStudentData } from "@/lib/types/student-unified";
import {
  hydrateStudentBootstrapData,
  loadAllDataIncremental,
  loadSection,
  loadSectionsIncremental,
} from "./student/load-helpers";
import {
  createAuthSlice,
  createFinancialSlice,
  createNutritionSlice,
  createProfileSlice,
  createProgressSlice,
  createSocialSlice,
  createSyncSlice,
} from "./student/slices";

// ============================================
// INTERFACE DO STORE
// ============================================

export interface StudentUnifiedState {
  // === DADOS ===
  data: StudentData;

  // === ACTIONS - CARREGAR DADOS ===
  loadAll: () => Promise<void>;
  // Carregamento prioritizado (carrega prioridades primeiro, depois resto)
  loadAllPrioritized: (
    priorities: StudentDataSection[],
    onlyPriorities?: boolean,
  ) => Promise<void>;
  // Carregamento incremental (melhor performance)
  loadEssential: () => Promise<void>; // User + Progress básico
  loadStudentCore: () => Promise<void>; // Profile + Weight
  loadWorkouts: (force?: boolean) => Promise<void>; // Units (legado)
  loadWeeklyPlan: (force?: boolean) => Promise<void>; // Plano semanal 7 slots
  loadActiveNutritionPlan: () => Promise<void>;
  loadNutritionLibraryPlans: () => Promise<void>;
  createWeeklyPlan: () => Promise<void>;
  updateWeeklyPlan: (payload: {
    title?: string;
    description?: string;
  }) => Promise<void>;
  resetWeeklyPlan: () => Promise<void>;
  addWeeklyPlanWorkout: (payload: {
    planSlotId: string;
    title: string;
    description?: string;
    muscleGroup?: string;
    difficulty?: string;
    estimatedTime?: number;
    type?: string;
  }) => Promise<string>;
  loadNutrition: () => Promise<void>; // Nutrition
  loadFinancial: () => Promise<void>; // Subscription + Payments
  // Métodos individuais (mantidos para compatibilidade)
  loadUser: () => Promise<void>;
  loadProgress: () => Promise<void>;
  loadProfile: () => Promise<void>;
  loadWeightHistory: () => Promise<void>;
  loadWorkoutHistory: () => Promise<void>;
  loadPersonalRecords: () => Promise<void>;
  loadSubscription: () => Promise<void>;
  loadMemberships: () => Promise<void>;
  loadPayments: () => Promise<void>;
  loadPaymentMethods: () => Promise<void>;
  loadReferral: () => Promise<void>;
  loadDayPasses: () => Promise<void>;
  loadFriends: () => Promise<void>;
  loadGymLocations: () => Promise<void>;
  loadGymLocationsWithPosition: (lat: number, lng: number) => Promise<void>;
  loadFoodDatabase: () => Promise<void>;

  // === ACTIONS - ATUALIZAR DADOS ===
  hydrateInitial: (data: Partial<StudentData>) => void;
  updateProgress: (progress: Partial<UserProgress>) => Promise<void>;
  updateProfile: (profile: Partial<StudentData["profile"]>) => Promise<void>;
  addWeight: (weight: number, date?: Date, notes?: string) => Promise<void>;
  completeWorkout: (data: WorkoutCompletionData) => Promise<void>;
  addPersonalRecord: (record: PersonalRecord) => void;
  updateNutrition: (nutrition: Partial<DailyNutrition>) => Promise<void>;
  updateSubscription: (
    subscription: Partial<StudentData["subscription"]> | null,
  ) => Promise<void>;
  createNutritionLibraryPlan: (data: {
    title?: string;
    description?: string | null;
    meals?: import("@/lib/types").Meal[];
  }) => Promise<string>;
  updateNutritionLibraryPlan: (
    planId: string,
    data: {
      title?: string;
      description?: string | null;
      meals?: import("@/lib/types").Meal[];
    },
  ) => Promise<void>;
  deleteNutritionLibraryPlan: (planId: string) => Promise<void>;
  activateNutritionLibraryPlan: (planId: string) => Promise<void>;
  updateReferralPixKey: (payload: {
    pixKey: string;
    pixKeyType: string;
  }) => Promise<void>;
  requestReferralWithdraw: (amountCents: number) => Promise<void>;
  addDayPass: (dayPass: StudentData["dayPasses"][0]) => void;
  joinGym: (payload: {
    gymId: string;
    planId: string;
    couponId?: string | null;
  }) => Promise<StudentJoinGymResult>;
  loadGymPlans: (gymId: string) => Promise<StudentPaymentPlanOption[]>;
  changeMembershipPlan: (payload: {
    membershipId: string;
    planId: string;
  }) => Promise<StudentPixPaymentPayload>;
  cancelMembership: (membershipId: string) => Promise<void>;
  cancelPersonalAssignment: (assignmentId: string) => Promise<void>;
  subscribeToPersonal: (payload: {
    personalId: string;
    planId: string;
    couponId?: string | null;
  }) => Promise<StudentPixPaymentPayload>;
  payStudentPayment: (paymentId: string) => Promise<StudentPixPaymentPayload>;
  cancelStudentPayment: (paymentId: string) => Promise<void>;
  getStudentPaymentStatus: (paymentId: string) => Promise<string>;
  getPersonalPaymentStatus: (paymentId: string) => Promise<string>;
  applyReferralToSubscription: (
    referralCode: string,
  ) => Promise<StudentReferralApplyResult>;

  // === ACTIONS - LIBRARY ===
  loadLibraryPlans: (force?: boolean) => Promise<void>;
  getLibraryPlanDetail: (planId: string) => Promise<WeeklyPlanData | null>;
  createLibraryPlan: (data: LibraryPlanPayload) => Promise<string>;
  updateLibraryPlan: (
    planId: string,
    data: LibraryPlanPayload,
  ) => Promise<void>;
  deleteLibraryPlan: (planId: string) => Promise<void>;
  activateLibraryPlan: (planId: string) => Promise<void>;
  getNutritionLibraryPlanDetail: (
    planId: string,
  ) => Promise<NutritionPlanData | null>;

  // === ACTIONS - WORKOUT MANAGEMENT ===
  createUnit: (data: { title: string; description?: string }) => Promise<void>;
  updateUnit: (
    unitId: string,
    data: { title?: string; description?: string },
  ) => Promise<void>;
  deleteUnit: (unitId: string) => Promise<void>;
  createWorkout: (data: {
    unitId: string;
    title: string;
    description?: string;
    muscleGroup?: string;
    difficulty?: string;
    estimatedTime?: number;
    type?: string;
  }) => Promise<string>; // Retorna o ID do workout criado
  updateWorkout: (
    workoutId: string,
    data: Partial<
      Pick<
        WorkoutSession,
        "title" | "description" | "muscleGroup" | "difficulty"
      >
    >,
  ) => Promise<void>;
  deleteWorkout: (workoutId: string) => Promise<void>;
  addWorkoutExercise: (
    workoutId: string,
    data: Partial<WorkoutExercise>,
  ) => Promise<void>;
  updateWorkoutExercise: (
    exerciseId: string,
    data: Partial<import("@/lib/types").WorkoutExercise>,
  ) => Promise<void>;
  deleteWorkoutExercise: (exerciseId: string) => Promise<void>;

  // === ACTIONS - WORKOUT PROGRESS ===
  setActiveWorkout: (workoutId: string | null) => void;
  updateActiveWorkout: (updates: Partial<StudentData["activeWorkout"]>) => void;
  saveWorkoutProgress: (workoutId: string) => void;
  clearActiveWorkout: () => void;

  // === ACTIONS - SYNC ===
  syncAll: () => Promise<void>;
  syncProgress: () => Promise<void>;
  syncNutrition: () => Promise<void>;
  syncPendingActions: () => Promise<void>;

  // === ACTIONS - RESET ===
  reset: () => void;
  clearCache: () => void;
}

type LibraryPlanPayload = Record<string, unknown>;

// ============================================
// STORE
// ============================================

export const useStudentUnifiedStore = create<StudentUnifiedState>()(
  (set, get) => {
    const authSlice = createAuthSlice(set, get);
    const profileSlice = createProfileSlice(set, get);
    const progressSlice = createProgressSlice(set, get);
    const socialSlice = createSocialSlice(set, get);
    const financialSlice = createFinancialSlice(set, get);
    const nutritionSlice = createNutritionSlice(set, get);
    const syncSlice = createSyncSlice(set, get);

    return {
      // === DADOS INICIAIS ===
      data: initialStudentData,

      hydrateInitial: (sectionData) => {
        hydrateStudentBootstrapData(set, sectionData);
      },

      // === SLICES ===
      ...authSlice,
      ...profileSlice,
      ...progressSlice,
      ...socialSlice,
      ...financialSlice,
      ...nutritionSlice,
      ...syncSlice,

      // === ACTIONS - CARREGAR DADOS (orquestração) ===
      loadAll: async () => {
        const currentState = get();
        if (currentState.data.metadata.isLoading) {
          return; // Já está carregando
        }

        set((state) => ({
          data: {
            ...state.data,
            metadata: {
              ...state.data.metadata,
              isLoading: true,
              errors: {},
            },
          },
        }));

        try {
          // Carregar dados incrementalmente (atualiza store conforme cada seção carrega)
          await loadAllDataIncremental(set);

          // Marcar como concluído após todas as seções carregarem
          set((state) => ({
            data: {
              ...state.data,
              metadata: {
                ...state.data.metadata,
                isLoading: false,
                isInitialized: true,
                lastSync: new Date(),
                errors: {},
              },
            },
          }));
        } catch (error) {
          log.error("[loadAll] Erro ao carregar dados", { error });
          set((state) => ({
            data: {
              ...state.data,
              metadata: {
                ...state.data.metadata,
                isLoading: false,
                errors: {
                  loadAll:
                    error instanceof Error
                      ? error.message
                      : "Erro ao carregar dados",
                },
              },
            },
          }));
        }
      },

      // === CARREGAMENTO PRIORITIZADO ===
      loadAllPrioritized: async (
        priorities: StudentDataSection[],
        onlyPriorities: boolean = false,
      ) => {
        const currentState = get();

        // Evitar múltiplas chamadas simultâneas se já está carregando tudo
        // Mas permitir se for apenas prioridades específicas
        if (currentState.data.metadata.isLoading && !onlyPriorities) {
          log.debug("[loadAllPrioritized] Ja esta carregando, aguardando");
          return;
        }

        try {
          // FASE 1: Carregar seções prioritárias (em paralelo)
          // Atualiza store incrementalmente conforme cada uma carrega
          await loadSectionsIncremental(set, priorities);

          // Se onlyPriorities for true (padrão), só carrega as prioridades
          // Isso evita recarregar tudo quando navegar entre páginas
          if (onlyPriorities) {
            return;
          }

          // FASE 2: Carregar resto das seções em background (apenas se onlyPriorities = false)
          // Isso só acontece quando explicitamente solicitado
          const allSections: StudentDataSection[] = [
            "user",
            "student",
            "progress",
            "units",
            "activeNutritionPlan",
            "nutritionLibraryPlans",
            "profile",
            "weightHistory",
            "workoutHistory",
            "personalRecords",
            "subscription",
            "memberships",
            "payments",
            "paymentMethods",
            "referral",
            "dayPasses",
            "friends",
            "gymLocations",
            "dailyNutrition",
          ];

          const remainingSections = allSections.filter(
            (section) => !priorities.includes(section),
          );

          if (remainingSections.length > 0) {
            // Carregar em background sem bloquear (não aguardar)
            loadSectionsIncremental(set, remainingSections).catch((error) => {
              log.error(
                "[loadAllPrioritized] Erro ao carregar secoes restantes",
                { error, remainingSections },
              );
            });
          }
        } catch (error) {
          log.error("[loadAllPrioritized] Erro ao carregar prioridades", {
            error,
            priorities,
            onlyPriorities,
          });
          // Não propagar erro - já atualizamos o que conseguimos
        }
      },

      // === CARREGAMENTO INCREMENTAL (Melhor Performance) ===
      loadEssential: async () => {
        // Carrega dados essenciais primeiro (User + Progress básico)
        try {
          set((state) => ({
            data: {
              ...state.data,
              metadata: {
                ...state.data.metadata,
                isLoading: true,
              },
            },
          }));

          await Promise.all([get().loadUser(), get().loadProgress()]);

          set((state) => ({
            data: {
              ...state.data,
              metadata: {
                ...state.data.metadata,
                isLoading: false,
                isInitialized: true,
                lastSync: new Date(),
              },
            },
          }));
        } catch (error) {
          log.error("[loadEssential] Erro", { error });
          set((state) => ({
            data: {
              ...state.data,
              metadata: {
                ...state.data.metadata,
                isLoading: false,
                errors: {
                  ...state.data.metadata.errors,
                  loadEssential:
                    error instanceof Error
                      ? error.message
                      : "Erro ao carregar dados essenciais",
                },
              },
            },
          }));
        }
      },

      loadStudentCore: async () => {
        // Carrega dados do student (Profile + Weight)
        try {
          await Promise.all([get().loadProfile(), get().loadWeightHistory()]);
        } catch (error) {
          log.error("[loadStudentCore] Erro", { error });
        }
      },

      loadFinancial: async () => {
        // Carrega dados financeiros por seções para evitar encadear loaders legados.
        try {
          await loadSectionsIncremental(set, [
            "subscription",
            "payments",
            "memberships",
            "paymentMethods",
            "referral",
            "dayPasses",
          ]);
        } catch (error) {
          log.error("[loadFinancial] Erro", { error });
        }
      },

      // === MÉTODOS INDIVIDUAIS (loadUser, loadProgress, loadProfile, loadWeightHistory em slices) ===
      loadWorkouts: async (force = false) => {
        const currentState = get();

        if (!force && currentState.data.metadata.isLoading) {
          return;
        }

        const section = await loadSection("units", force);
        set((state) => ({
          data: {
            ...state.data,
            units: section.units || state.data.units,
          },
        }));
      },

      loadWeeklyPlan: async (force = false) => {
        const currentState = get();

        if (!force && currentState.data.metadata.isLoading) {
          return;
        }

        // force=true: limpa o dedupe local antes de recarregar pelas tags do cache
        const section = await loadSection("weeklyPlan", force);
        set((state) => ({
          data: {
            ...state.data,
            weeklyPlan: section.weeklyPlan ?? state.data.weeklyPlan,
          },
        }));
      },

      createWeeklyPlan: async () => {
        await apiClient.post("/api/workouts/weekly-plan", {});
        await get().loadWeeklyPlan(true);
      },

      updateWeeklyPlan: async (payload) => {
        const previousWeeklyPlan = get().data.weeklyPlan;

        set((state) => ({
          data: {
            ...state.data,
            weeklyPlan: state.data.weeklyPlan
              ? {
                  ...state.data.weeklyPlan,
                  ...payload,
                }
              : state.data.weeklyPlan,
          },
        }));

        try {
          await apiClient.patch("/api/workouts/weekly-plan", payload);
          await get().loadWeeklyPlan(true);
        } catch (error) {
          set((state) => ({
            data: {
              ...state.data,
              weeklyPlan: previousWeeklyPlan,
            },
          }));
          throw error;
        }
      },

      resetWeeklyPlan: async () => {
        const previousWeeklyPlan = get().data.weeklyPlan;

        set((state) => ({
          data: {
            ...state.data,
            weeklyPlan: state.data.weeklyPlan
              ? {
                  ...state.data.weeklyPlan,
                  slots: state.data.weeklyPlan.slots.map((slot) => ({
                    ...slot,
                    locked: false,
                    completed: slot.type === "rest",
                    completedAt:
                      slot.type === "rest" ? slot.completedAt : undefined,
                  })),
                }
              : state.data.weeklyPlan,
          },
        }));

        try {
          await apiClient.patch("/api/students/week-reset");
          await get().loadWeeklyPlan(true);
        } catch (error) {
          set((state) => ({
            data: {
              ...state.data,
              weeklyPlan: previousWeeklyPlan,
            },
          }));
          throw error;
        }
      },

      addWeeklyPlanWorkout: async (payload) => {
        const previousWeeklyPlan = get().data.weeklyPlan;
        const targetSlot = previousWeeklyPlan?.slots.find(
          (slot) => slot.id === payload.planSlotId,
        );

        if (!previousWeeklyPlan || !targetSlot) {
          throw new Error("Dia do plano semanal nao encontrado.");
        }

        const tempId = `temp-weekly-workout-${Date.now()}`;
        const optimisticWorkout: WorkoutSession = {
          id: tempId,
          title: payload.title,
          description: payload.description || "",
          type: (payload.type as WorkoutType) || "strength",
          muscleGroup: (payload.muscleGroup as MuscleGroup) || "peito",
          difficulty: (payload.difficulty as DifficultyLevel) || "iniciante",
          exercises: [],
          xpReward: 50,
          estimatedTime: payload.estimatedTime || 0,
          locked: false,
          completed: false,
        };

        set((state) => ({
          data: {
            ...state.data,
            weeklyPlan: state.data.weeklyPlan
              ? {
                  ...state.data.weeklyPlan,
                  slots: state.data.weeklyPlan.slots.map((slot) =>
                    slot.id === payload.planSlotId
                      ? {
                          ...slot,
                          type: "workout",
                          workout: optimisticWorkout,
                          locked: false,
                          completed: false,
                          completedAt: undefined,
                        }
                      : slot,
                  ),
                }
              : state.data.weeklyPlan,
          },
        }));

        try {
          const response = await apiClient.post(
            "/api/workouts/manage",
            payload as Record<string, unknown>,
          );
          const workoutData = (
            response as { data?: { data?: { id?: string }; id?: string } }
          ).data;
          const realId = workoutData?.data?.id ?? workoutData?.id ?? tempId;

          set((state) => ({
            data: {
              ...state.data,
              weeklyPlan: state.data.weeklyPlan
                ? {
                    ...state.data.weeklyPlan,
                    slots: state.data.weeklyPlan.slots.map((slot) =>
                      slot.id === payload.planSlotId &&
                      slot.type === "workout" &&
                      slot.workout?.id === tempId
                        ? {
                            ...slot,
                            workout: {
                              ...slot.workout,
                              id: realId,
                            },
                          }
                        : slot,
                    ),
                  }
                : state.data.weeklyPlan,
            },
          }));

          await get().loadWeeklyPlan(true);
          return realId;
        } catch (error) {
          set((state) => ({
            data: {
              ...state.data,
              weeklyPlan: previousWeeklyPlan,
            },
          }));
          throw error;
        }
      },

      // === ACTIONS - LIBRARY ===
      loadLibraryPlans: async (force = false) => {
        const section = await loadSection("libraryPlans", force);
        set((state) => ({
          data: {
            ...state.data,
            libraryPlans: section.libraryPlans || state.data.libraryPlans,
          },
        }));
      },

      getLibraryPlanDetail: async (planId: string) => {
        const response = await apiClient.get<{
          data?: WeeklyPlanData | null;
        }>(`/api/workouts/library/${planId}`);
        return response.data.data ?? null;
      },

      createLibraryPlan: async (data: LibraryPlanPayload) => {
        const response = await apiClient.post<{
          data?: { id?: string };
        }>("/api/workouts/library", data);
        await get().loadLibraryPlans(true);
        const apiData = response.data.data;
        return apiData?.id || "";
      },

      updateLibraryPlan: async (planId: string, data: LibraryPlanPayload) => {
        await apiClient.put(`/api/workouts/library/${planId}`, data);
        await get().loadLibraryPlans(true);
      },

      deleteLibraryPlan: async (planId: string) => {
        await apiClient.delete(`/api/workouts/library/${planId}`);
        await get().loadLibraryPlans(true);
      },

      activateLibraryPlan: async (planId: string) => {
        const state = get();
        const previousWeeklyPlan = state.data.weeklyPlan;
        const libraryPlan = state.data.libraryPlans?.find(
          (p) => p.id === planId,
        );

        if (libraryPlan) {
          const optimisticSlots = (libraryPlan.slots ?? []).map((slot) => ({
            ...slot,
            locked: false,
            completed: slot.type === "rest",
          }));
          set((s) => ({
            data: {
              ...s.data,
              weeklyPlan: {
                id: libraryPlan.id,
                title: libraryPlan.title,
                description: libraryPlan.description,
                slots: optimisticSlots,
                sourceLibraryPlanId: planId,
              },
            },
          }));
        }

        try {
          await apiClient.post("/api/workouts/weekly-plan/activate", {
            libraryPlanId: planId,
          });
          await get().loadWeeklyPlan(true);
        } catch (error) {
          set((s) => ({
            data: {
              ...s.data,
              weeklyPlan: previousWeeklyPlan,
            },
          }));
          throw error;
        }
      },

      // === ACTIONS - ATUALIZAR DADOS ===
      getNutritionLibraryPlanDetail: async (planId: string) => {
        const response = await apiClient.get<{
          data?: NutritionPlanData | null;
        }>(`/api/nutrition/library/${planId}`);
        return response.data.data ?? null;
      },

      updateProgress: async (updates) => {
        // Optimistic update - atualiza UI imediatamente
        const previousProgress = get().data.progress;
        set((state) => ({
          data: {
            ...state.data,
            progress: { ...state.data.progress, ...updates },
          },
        }));

        try {
          await apiClient.put("/api/students/progress", updates);
        } catch (error) {
          log.error("Erro ao atualizar progresso", { error });
          // Reverter para o estado anterior em caso de erro
          set((state) => ({
            data: {
              ...state.data,
              progress: previousProgress,
              metadata: {
                ...state.data.metadata,
                errors: {
                  ...state.data.metadata.errors,
                  updateProgress:
                    error instanceof Error
                      ? error.message
                      : "Erro ao atualizar progresso",
                },
              },
            },
          }));
        }
      },

      completeWorkout: async (data) => {
        // O workout já foi salvo no backend pelo workout-modal
        // O handler completeWorkoutHandler já atualiza o progresso automaticamente
        // Aqui apenas atualizamos o store local otimisticamente e recarregamos do backend

        // Optimistic update local (atualiza UI imediatamente)
        if (data.xpEarned && data.xpEarned > 0) {
          const currentProgress = get().data.progress;
          const xpEarned = data.xpEarned;
          set((state) => ({
            data: {
              ...state.data,
              progress: {
                ...state.data.progress,
                totalXP: currentProgress.totalXP + xpEarned,
                todayXP: currentProgress.todayXP + xpEarned,
                workoutsCompleted: currentProgress.workoutsCompleted + 1,
              },
            },
          }));
        }

        // Recarregar progresso do backend para garantir sincronização
        await get().loadProgress();

        // Recarregar plano semanal para atualizar status completed/locked nos slots
        // (loadWorkouts carrega units/legado; weekly plan é o que o LearningPath usa)
        await get().loadWeeklyPlan(true);

        // Recarregar workouts (units) para compatibilidade
        await get().loadWorkouts();

        // Disparar evento para WorkoutNode e LearningPath reagirem imediatamente
        if (typeof window !== "undefined" && data.workoutId) {
          window.dispatchEvent(
            new CustomEvent("workoutCompleted", {
              detail: { workoutId: data.workoutId },
            }),
          );
        }
      },

      createUnit: async (data) => {
        const currentState = get();
        const previousUnits = currentState.data.units;
        const tempId = `temp-unit-${Date.now()}`;

        const newUnit: Unit = {
          id: tempId,
          title: data.title,
          description: data.description || "",
          color: "#58CC02",
          icon: "💪",
          studentId: currentState.data.student?.id,
          workouts: [],
        };

        set((state) => ({
          data: {
            ...state.data,
            units: [...state.data.units, newUnit],
          },
        }));

        try {
          const response = await apiClient.post("/api/workouts/units", data);
          const apiData =
            (response as { data?: { id?: string } }).data ?? undefined;
          if (apiData?.id) {
            const realId = apiData.id;
            set((state) => ({
              data: {
                ...state.data,
                units: state.data.units.map((u) =>
                  u.id === tempId ? { ...u, id: realId } : u,
                ),
              },
            }));
          } else {
            await get().loadWorkouts(true);
          }
        } catch (error) {
          log.error("Erro ao criar unit", { error, data });
          set((state) => ({
            data: {
              ...state.data,
              units: previousUnits,
            },
          }));
        }
      },

      updateUnit: async (unitId, data) => {
        const previousUnits = get().data.units;
        set((state) => ({
          data: {
            ...state.data,
            units: state.data.units.map((unit) =>
              unit.id === unitId
                ? {
                    ...unit,
                    ...data,
                    description: data.description ?? unit.description,
                  }
                : unit,
            ),
          },
        }));

        try {
          await apiClient.put(`/api/workouts/units/${unitId}`, data);
        } catch (error) {
          log.error("Erro ao atualizar unit", { error, unitId, data });
          set((state) => ({
            data: {
              ...state.data,
              units: previousUnits,
            },
          }));
        }
      },

      deleteUnit: async (unitId) => {
        const previousUnits = get().data.units;

        set((state) => ({
          data: {
            ...state.data,
            units: state.data.units.filter((unit) => unit.id !== unitId),
          },
        }));

        try {
          await apiClient.delete(`/api/workouts/units/${unitId}`);
        } catch (error) {
          log.error("Erro ao deletar unit", { error, unitId });
          set((state) => ({
            data: {
              ...state.data,
              units: previousUnits,
            },
          }));
        }
      },

      createWorkout: async (data) => {
        const tempId = `temp-workout-${Date.now()}`;
        const currentState = get();
        const unit = currentState.data.units.find((u) => u.id === data.unitId);
        if (!unit) {
          throw new Error("Unit não encontrada");
        }

        const newWorkout: WorkoutSession = {
          id: tempId,
          title: data.title,
          description: data.description || "",
          type: (data.type as WorkoutType) || "strength",
          muscleGroup: (data.muscleGroup as MuscleGroup) || "peito",
          difficulty: (data.difficulty as DifficultyLevel) || "iniciante",
          exercises: [],
          xpReward: 50,
          estimatedTime: data.estimatedTime || 45,
          locked: false,
          completed: false,
        };

        // Optimistic update imediato
        set((state) => ({
          data: {
            ...state.data,
            units: state.data.units.map((u) =>
              u.id === data.unitId
                ? { ...u, workouts: [...u.workouts, newWorkout] }
                : u,
            ),
          },
        }));

        try {
          const response = await apiClient.post("/api/workouts/manage", data);
          const workoutData = (
            response as { data?: { data?: { id?: string }; id?: string } }
          ).data;
          const realId = workoutData?.data?.id ?? workoutData?.id;

          if (realId) {
            // Atualizar ID temporário com ID real
            set((state) => ({
              data: {
                ...state.data,
                units: state.data.units.map((u) =>
                  u.id === data.unitId
                    ? {
                        ...u,
                        workouts: u.workouts.map((w) =>
                          w.id === tempId ? { ...w, id: realId } : w,
                        ),
                      }
                    : u,
                ),
              },
            }));
            return realId;
          }

          return tempId;
        } catch (error) {
          log.error("Erro ao criar workout", { error, data });
          // Reverter optimistic update em caso de erro
          set((state) => ({
            data: {
              ...state.data,
              units: state.data.units.map((u) =>
                u.id === data.unitId
                  ? {
                      ...u,
                      workouts: u.workouts.filter((w) => w.id !== tempId),
                    }
                  : u,
              ),
            },
          }));
          throw error;
        }
      },

      updateWorkout: async (workoutId, data) => {
        const previousUnits = get().data.units;
        const previousWeeklyPlan = get().data.weeklyPlan;
        set((state) => ({
          data: {
            ...state.data,
            units: state.data.units.map((unit) => ({
              ...unit,
              workouts: unit.workouts.map((workout) =>
                workout.id === workoutId ? { ...workout, ...data } : workout,
              ),
            })),
            weeklyPlan: state.data.weeklyPlan?.slots
              ? {
                  ...state.data.weeklyPlan,
                  slots: state.data.weeklyPlan.slots.map((slot) => {
                    if (
                      slot.type !== "workout" ||
                      !slot.workout ||
                      slot.workout.id !== workoutId
                    ) {
                      return slot;
                    }

                    return {
                      ...slot,
                      workout: {
                        ...slot.workout,
                        ...data,
                      },
                    };
                  }),
                }
              : state.data.weeklyPlan,
          },
        }));

        try {
          await apiClient.put(`/api/workouts/manage/${workoutId}`, data);
        } catch (error) {
          log.error("Erro ao atualizar workout", { error, workoutId, data });
          set((state) => ({
            data: {
              ...state.data,
              units: previousUnits,
              weeklyPlan: previousWeeklyPlan,
            },
          }));
        }
      },

      deleteWorkout: async (workoutId) => {
        const previousUnits = get().data.units;
        const previousWeeklyPlan = get().data.weeklyPlan;
        let workoutToDelete: WorkoutSession | null = null;
        let unitId: string | undefined;

        // Encontrar workout e unit antes de remover
        for (const unit of previousUnits) {
          const workout = unit.workouts.find((w) => w.id === workoutId);
          if (workout) {
            workoutToDelete = workout;
            unitId = unit.id;
            break;
          }
        }

        set((state) => ({
          data: {
            ...state.data,
            units: state.data.units.map((unit) => ({
              ...unit,
              workouts: unit.workouts.filter((w) => w.id !== workoutId),
            })),
            weeklyPlan: state.data.weeklyPlan?.slots
              ? {
                  ...state.data.weeklyPlan,
                  slots: state.data.weeklyPlan.slots.map((slot) => {
                    if (
                      slot.type !== "workout" ||
                      !slot.workout ||
                      slot.workout.id !== workoutId
                    ) {
                      return slot;
                    }

                    return {
                      ...slot,
                      type: "rest",
                      workout: undefined,
                      completed: false,
                      completedAt: undefined,
                    };
                  }),
                }
              : state.data.weeklyPlan,
          },
        }));

        try {
          await apiClient.delete(`/api/workouts/manage/${workoutId}`);
        } catch (error) {
          log.error("Erro ao deletar workout", { error, workoutId });
          // Reverter optimistic update
          set((state) => ({
            data: {
              ...state.data,
              units:
                workoutToDelete && unitId
                  ? state.data.units.map((unit) =>
                      unit.id === unitId
                        ? {
                            ...unit,
                            workouts: [...unit.workouts, workoutToDelete!],
                          }
                        : unit,
                    )
                  : previousUnits,
              weeklyPlan: previousWeeklyPlan,
            },
          }));
        }
      },

      addWorkoutExercise: async (workoutId, data) => {
        const tempId = `temp-exercise-${Date.now()}`;
        let found = false;

        const newExercise: WorkoutExercise = {
          id: tempId,
          name: data.name ?? "Novo Exercício",
          sets: data.sets ?? 3,
          reps: data.reps ?? "12",
          rest: data.rest ?? 60,
          notes: data.notes,
          videoUrl: data.videoUrl,
          educationalId: data.educationalId,
          primaryMuscles: data.primaryMuscles,
          secondaryMuscles: data.secondaryMuscles,
          difficulty: data.difficulty,
          equipment: data.equipment,
          instructions: data.instructions,
          tips: data.tips,
          commonMistakes: data.commonMistakes,
          benefits: data.benefits,
          scientificEvidence: data.scientificEvidence,
          order: 0,
        };

        // Optimistic update imediato — não espera nada!
        set((state) => {
          // 1. Tentar em units
          const updatedUnits = state.data.units.map((unit) => {
            const workout = unit.workouts.find((w) => w.id === workoutId);
            if (workout) {
              found = true;
              const lastExercise =
                workout.exercises[workout.exercises.length - 1];
              const newOrder = lastExercise ? (lastExercise.order || 0) + 1 : 0;

              return {
                ...unit,
                workouts: unit.workouts.map((w) =>
                  w.id === workoutId
                    ? {
                        ...w,
                        exercises: [
                          ...w.exercises,
                          { ...newExercise, order: newOrder },
                        ],
                      }
                    : w,
                ),
              };
            }
            return unit;
          });

          // 2. Se não encontrou em units, tentar em weeklyPlan.slots
          let updatedWeeklyPlan = state.data.weeklyPlan;
          if (!found && state.data.weeklyPlan?.slots) {
            updatedWeeklyPlan = {
              ...state.data.weeklyPlan,
              slots: state.data.weeklyPlan.slots.map((slot) => {
                if (
                  slot.type !== "workout" ||
                  !slot.workout ||
                  slot.workout.id !== workoutId
                ) {
                  return slot;
                }
                found = true;
                const workout = slot.workout;
                const lastExercise =
                  workout.exercises[workout.exercises.length - 1];
                const newOrder = lastExercise
                  ? (lastExercise.order || 0) + 1
                  : 0;

                return {
                  ...slot,
                  workout: {
                    ...workout,
                    exercises: [
                      ...(workout.exercises || []),
                      { ...newExercise, order: newOrder },
                    ],
                  },
                };
              }),
            };
          }

          return {
            data: {
              ...state.data,
              units: updatedUnits,
              weeklyPlan: updatedWeeklyPlan ?? state.data.weeklyPlan,
            },
          };
        });

        void found;

        try {
          const response = await apiClient.post("/api/workouts/exercises", {
            workoutId,
            ...data,
          } as Record<string, unknown>);

          const rawExerciseData =
            (response as { data?: Record<string, unknown> })?.data?.data ??
            (response as { data?: Record<string, unknown> })?.data;
          const exerciseData =
            typeof rawExerciseData === "object" &&
            rawExerciseData !== null &&
            !Array.isArray(rawExerciseData)
              ? (rawExerciseData as Record<string, unknown>)
              : undefined;
          const exerciseId =
            exerciseData && typeof exerciseData.id === "string"
              ? exerciseData.id
              : undefined;

          if (exerciseData && exerciseId) {
            const safeParse = (value: unknown): string[] | undefined => {
              if (!value) return undefined;
              if (Array.isArray(value)) return value.map(String);
              if (typeof value === "string") {
                try {
                  const parsed = JSON.parse(value);
                  return Array.isArray(parsed) ? parsed.map(String) : [value];
                } catch {
                  return [value];
                }
              }
              return undefined;
            };

            // Atualizar exercício com dados reais da API
            set((state) => ({
              data: {
                ...state.data,
                units: state.data.units.map((unit) => ({
                  ...unit,
                  workouts: unit.workouts.map((workout) => {
                    const workoutMatches =
                      workout.id === workoutId ||
                      workout.exercises.some((e) => e.id === tempId);

                    if (workoutMatches) {
                      return {
                        ...workout,
                        exercises: workout.exercises.map((exercise) =>
                          exercise.id === tempId
                            ? {
                                ...exercise,
                                id: exerciseId,
                                name:
                                  (exerciseData.name as string) ??
                                  exercise.name,
                                sets:
                                  typeof exerciseData.sets === "number"
                                    ? exerciseData.sets
                                    : exercise.sets,
                                reps:
                                  typeof exerciseData.reps === "string"
                                    ? exerciseData.reps
                                    : exercise.reps,
                                rest:
                                  typeof exerciseData.rest === "number"
                                    ? exerciseData.rest
                                    : exercise.rest,
                                notes:
                                  (exerciseData.notes as string | undefined) ??
                                  exercise.notes,
                                videoUrl:
                                  (exerciseData.videoUrl as
                                    | string
                                    | undefined) ?? exercise.videoUrl,
                                educationalId:
                                  (exerciseData.educationalId as
                                    | string
                                    | undefined) ?? exercise.educationalId,
                                primaryMuscles:
                                  safeParse(exerciseData.primaryMuscles) ??
                                  exercise.primaryMuscles,
                                secondaryMuscles:
                                  safeParse(exerciseData.secondaryMuscles) ??
                                  exercise.secondaryMuscles,
                                equipment:
                                  safeParse(exerciseData.equipment) ??
                                  exercise.equipment,
                                instructions:
                                  safeParse(exerciseData.instructions) ??
                                  exercise.instructions,
                                tips:
                                  safeParse(exerciseData.tips) ?? exercise.tips,
                                commonMistakes:
                                  safeParse(exerciseData.commonMistakes) ??
                                  exercise.commonMistakes,
                                benefits:
                                  safeParse(exerciseData.benefits) ??
                                  exercise.benefits,
                                difficulty:
                                  (exerciseData.difficulty as WorkoutExercise["difficulty"]) ??
                                  exercise.difficulty,
                                scientificEvidence:
                                  (exerciseData.scientificEvidence as
                                    | string
                                    | undefined) ?? exercise.scientificEvidence,
                                alternatives: Array.isArray(
                                  exerciseData.alternatives,
                                )
                                  ? (exerciseData.alternatives as WorkoutExercise["alternatives"])
                                  : (exercise.alternatives ?? []),
                              }
                            : exercise,
                        ),
                      };
                    }
                    return workout;
                  }),
                })),
                weeklyPlan: state.data.weeklyPlan?.slots
                  ? {
                      ...state.data.weeklyPlan,
                      slots: state.data.weeklyPlan.slots.map((slot) => {
                        if (
                          slot.type !== "workout" ||
                          !slot.workout ||
                          slot.workout.id !== workoutId
                        ) {
                          return slot;
                        }

                        return {
                          ...slot,
                          workout: {
                            ...slot.workout,
                            exercises: slot.workout.exercises.map((exercise) =>
                              exercise.id === tempId
                                ? {
                                    ...exercise,
                                    id: exerciseId,
                                    name:
                                      (exerciseData.name as string) ??
                                      exercise.name,
                                    sets:
                                      typeof exerciseData.sets === "number"
                                        ? exerciseData.sets
                                        : exercise.sets,
                                    reps:
                                      typeof exerciseData.reps === "string"
                                        ? exerciseData.reps
                                        : exercise.reps,
                                    rest:
                                      typeof exerciseData.rest === "number"
                                        ? exerciseData.rest
                                        : exercise.rest,
                                    notes:
                                      (exerciseData.notes as
                                        | string
                                        | undefined) ?? exercise.notes,
                                    videoUrl:
                                      (exerciseData.videoUrl as
                                        | string
                                        | undefined) ?? exercise.videoUrl,
                                    educationalId:
                                      (exerciseData.educationalId as
                                        | string
                                        | undefined) ?? exercise.educationalId,
                                    primaryMuscles:
                                      safeParse(exerciseData.primaryMuscles) ??
                                      exercise.primaryMuscles,
                                    secondaryMuscles:
                                      safeParse(
                                        exerciseData.secondaryMuscles,
                                      ) ?? exercise.secondaryMuscles,
                                    equipment:
                                      safeParse(exerciseData.equipment) ??
                                      exercise.equipment,
                                    instructions:
                                      safeParse(exerciseData.instructions) ??
                                      exercise.instructions,
                                    tips:
                                      safeParse(exerciseData.tips) ??
                                      exercise.tips,
                                    commonMistakes:
                                      safeParse(exerciseData.commonMistakes) ??
                                      exercise.commonMistakes,
                                    benefits:
                                      safeParse(exerciseData.benefits) ??
                                      exercise.benefits,
                                    difficulty:
                                      (exerciseData.difficulty as WorkoutExercise["difficulty"]) ??
                                      exercise.difficulty,
                                    scientificEvidence:
                                      (exerciseData.scientificEvidence as
                                        | string
                                        | undefined) ??
                                      exercise.scientificEvidence,
                                    alternatives: Array.isArray(
                                      exerciseData.alternatives,
                                    )
                                      ? (exerciseData.alternatives as WorkoutExercise["alternatives"])
                                      : (exercise.alternatives ?? []),
                                  }
                                : exercise,
                            ),
                          },
                        };
                      }),
                    }
                  : state.data.weeklyPlan,
              },
            }));
          }

          await Promise.allSettled([
            get().loadWorkouts(true),
            get().loadWeeklyPlan(true),
          ]);
        } catch (error) {
          log.error("Erro ao adicionar exercicio", { error, workoutId, data });
          // Reverter optimistic update
          set((state) => ({
            data: {
              ...state.data,
              units: state.data.units.map((unit) => ({
                ...unit,
                workouts: unit.workouts.map((w) =>
                  w.id === workoutId
                    ? {
                        ...w,
                        exercises: w.exercises.filter((e) => e.id !== tempId),
                      }
                    : w,
                ),
              })),
              weeklyPlan: state.data.weeklyPlan?.slots
                ? {
                    ...state.data.weeklyPlan,
                    slots: state.data.weeklyPlan.slots.map((slot) => {
                      if (
                        slot.type !== "workout" ||
                        !slot.workout ||
                        slot.workout.id !== workoutId
                      ) {
                        return slot;
                      }

                      return {
                        ...slot,
                        workout: {
                          ...slot.workout,
                          exercises: slot.workout.exercises.filter(
                            (e) => e.id !== tempId,
                          ),
                        },
                      };
                    }),
                  }
                : state.data.weeklyPlan,
            },
          }));
        }
      },

      updateWorkoutExercise: async (exerciseId, data) => {
        const previousUnits = get().data.units;
        set((state) => ({
          data: {
            ...state.data,
            units: state.data.units.map((unit) => ({
              ...unit,
              workouts: unit.workouts.map((workout) => ({
                ...workout,
                exercises: workout.exercises.map((exercise) =>
                  exercise.id === exerciseId
                    ? { ...exercise, ...data }
                    : exercise,
                ),
              })),
            })),
          },
        }));

        try {
          await apiClient.put(`/api/workouts/exercises/${exerciseId}`, data);
        } catch (error) {
          log.error("Erro ao atualizar exercicio", { error, exerciseId, data });
          set((state) => ({
            data: {
              ...state.data,
              units: previousUnits,
            },
          }));
        }
      },

      deleteWorkoutExercise: async (exerciseId) => {
        // Guardar exercício para possível revert em caso de erro
        let exerciseToDelete: WorkoutExercise | null = null;
        let workoutId: string | undefined;
        for (const unit of get().data.units) {
          for (const workout of unit.workouts) {
            const ex = workout.exercises.find((e) => e.id === exerciseId);
            if (ex) {
              exerciseToDelete = ex;
              workoutId = workout.id;
              break;
            }
          }
          if (exerciseToDelete) break;
        }
        // Também verificar weeklyPlan
        const wp = get().data.weeklyPlan;
        if (!exerciseToDelete && wp?.slots) {
          for (const slot of wp.slots) {
            if (slot.type === "workout" && slot.workout) {
              const ex = slot.workout.exercises.find(
                (e) => e.id === exerciseId,
              );
              if (ex) {
                exerciseToDelete = ex;
                workoutId = slot.workout.id;
                break;
              }
            }
          }
        }

        // 1. Optimistic update - remove da UI imediatamente (units + weeklyPlan)
        set((state) => {
          const updatedUnits = state.data.units.map((unit) => ({
            ...unit,
            workouts: unit.workouts.map((workout) => ({
              ...workout,
              exercises: workout.exercises.filter((e) => e.id !== exerciseId),
            })),
          }));

          let updatedWeeklyPlan = state.data.weeklyPlan;
          if (state.data.weeklyPlan?.slots) {
            updatedWeeklyPlan = {
              ...state.data.weeklyPlan,
              slots: state.data.weeklyPlan.slots.map((slot) => {
                if (slot.type !== "workout" || !slot.workout) return slot;
                return {
                  ...slot,
                  workout: {
                    ...slot.workout,
                    exercises: slot.workout.exercises.filter(
                      (e) => e.id !== exerciseId,
                    ),
                  },
                };
              }),
            };
          }

          return {
            data: {
              ...state.data,
              units: updatedUnits,
              weeklyPlan: updatedWeeklyPlan ?? state.data.weeklyPlan,
            },
          };
        });

        try {
          await apiClient.delete(`/api/workouts/exercises/${exerciseId}`);
        } catch (error) {
          log.error("Erro ao deletar exercicio", { error, exerciseId });
          // Reverter optimistic update
          if (exerciseToDelete && workoutId) {
            set((state) => {
              const inUnit = state.data.units.some((u) =>
                u.workouts.some((w) => w.id === workoutId),
              );
              if (inUnit) {
                return {
                  data: {
                    ...state.data,
                    units: state.data.units.map((unit) => ({
                      ...unit,
                      workouts: unit.workouts.map((workout) =>
                        workout.id === workoutId
                          ? {
                              ...workout,
                              exercises: [
                                ...workout.exercises,
                                exerciseToDelete!,
                              ].sort((a, b) => (a.order || 0) - (b.order || 0)),
                            }
                          : workout,
                      ),
                    })),
                  },
                };
              }
              // Reverter em weeklyPlan
              if (state.data.weeklyPlan?.slots) {
                return {
                  data: {
                    ...state.data,
                    weeklyPlan: {
                      ...state.data.weeklyPlan,
                      slots: state.data.weeklyPlan.slots.map((slot) => {
                        if (
                          slot.type !== "workout" ||
                          !slot.workout ||
                          slot.workout.id !== workoutId
                        )
                          return slot;
                        return {
                          ...slot,
                          workout: {
                            ...slot.workout,
                            exercises: [
                              ...slot.workout.exercises,
                              exerciseToDelete,
                            ].sort((a, b) => (a.order || 0) - (b.order || 0)),
                          },
                        };
                      }),
                    },
                  },
                };
              }
              return {};
            });
          }
        }
      },

      // === ACTIONS - WORKOUT PROGRESS ===
      setActiveWorkout: (workoutId) => {
        set((state) => ({
          data: {
            ...state.data,
            activeWorkout: workoutId
              ? {
                  workoutId,
                  currentExerciseIndex: 0,
                  exerciseLogs: [],
                  skippedExercises: [],
                  selectedAlternatives: {},
                  xpEarned: 0,
                  totalVolume: 0,
                  completionPercentage: 0,
                  startTime: new Date(),
                  lastUpdated: new Date(),
                }
              : null,
          },
        }));
      },

      updateActiveWorkout: (updates) => {
        set((state) => {
          if (!state.data.activeWorkout) return state;
          return {
            data: {
              ...state.data,
              activeWorkout: {
                ...state.data.activeWorkout,
                ...updates,
                lastUpdated: new Date(),
              },
            },
          };
        });
      },

      saveWorkoutProgress: (workoutId) => {
        // Salva progresso do workout atual
        const state = get();
        if (state.data.activeWorkout?.workoutId === workoutId) {
          // TODO: Salvar no backend
        }
      },

      clearActiveWorkout: () => {
        set((state) => ({
          data: {
            ...state.data,
            activeWorkout: null,
          },
        }));
      },
    };
  },
);
