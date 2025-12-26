/**
 * Store Unificado para Student
 *
 * Este store consolida todos os dados do student em um único lugar,
 * substituindo múltiplos stores fragmentados.
 *
 * Uso: Prefira usar o hook useStudent() em vez de acessar o store diretamente
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  StudentData,
  StudentDataSection,
  WorkoutCompletionData,
} from "@/lib/types/student-unified";
import { initialStudentData } from "@/lib/types/student-unified";
import { transformStudentData } from "@/lib/utils/student-transformers";
import type { UserProgress, PersonalRecord, DailyNutrition } from "@/lib/types";
import type { WeightHistoryItem } from "@/lib/types/student-unified";
import { apiClient } from "@/lib/api/client";
import { salvadorOff } from "@/lib/offline/salvador-off";
import { createIndexedDBStorage, migrateFromLocalStorage } from "@/lib/offline/indexeddb-storage";
import {
  addPendingAction,
  removePendingActionByQueueId,
} from "@/lib/offline/pending-actions";
import { createCommand, commandToSalvadorOff } from "@/lib/offline/command-pattern";

// ============================================
// INTERFACE DO STORE
// ============================================

export interface StudentUnifiedState {
  // === DADOS ===
  data: StudentData;

  // === ACTIONS - CARREGAR DADOS ===
  loadAll: () => Promise<void>;
  // Carregamento incremental (melhor performance)
  loadEssential: () => Promise<void>; // User + Progress básico
  loadStudentCore: () => Promise<void>; // Profile + Weight
  loadWorkouts: () => Promise<void>; // Workouts + History
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
  loadDayPasses: () => Promise<void>;
  loadFriends: () => Promise<void>;
  loadGymLocations: () => Promise<void>;
  loadFoodDatabase: () => Promise<void>;

  // === ACTIONS - ATUALIZAR DADOS ===
  updateProgress: (progress: Partial<UserProgress>) => Promise<void>;
  updateProfile: (profile: Partial<StudentData["profile"]>) => Promise<void>;
  addWeight: (weight: number, date?: Date, notes?: string) => Promise<void>;
  completeWorkout: (data: WorkoutCompletionData) => Promise<void>;
  addPersonalRecord: (record: PersonalRecord) => void;
  updateNutrition: (nutrition: Partial<DailyNutrition>) => Promise<void>;
  updateSubscription: (
    subscription: Partial<StudentData["subscription"]>
  ) => Promise<void>;
  addDayPass: (dayPass: StudentData["dayPasses"][0]) => void;

  // === ACTIONS - WORKOUT PROGRESS ===
  setActiveWorkout: (workoutId: string | null) => void;
  updateActiveWorkout: (updates: Partial<StudentData["activeWorkout"]>) => void;
  saveWorkoutProgress: (workoutId: string) => void;
  clearActiveWorkout: () => void;

  // === ACTIONS - SYNC ===
  syncAll: () => Promise<void>;
  syncProgress: () => Promise<void>;
  syncNutrition: () => Promise<void>;
  syncPendingActions: () => Promise<void>; // Sincroniza ações pendentes

  // === ACTIONS - RESET ===
  reset: () => void;
  clearCache: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// transformStudentData é importado de student-transformers.ts

/**
 * Carrega uma seção específica dos dados
 */
async function loadSection(
  section: StudentDataSection
): Promise<Partial<StudentData>> {
  try {
    const response = await apiClient.get<Partial<StudentData>>(
      `/api/students/all?sections=${section}`,
      {
        timeout: 30000, // 30 segundos para requisições de seções
      }
    );
    return { [section]: response.data[section] || null };
  } catch (error: any) {
    // Tratamento específico para timeout
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      console.warn(
        `Timeout ao carregar ${section}. Continuando com dados existentes.`
      );
      return {};
    }
    console.error(`Erro ao carregar ${section}:`, error);
    return {};
  }
}

/**
 * Carrega todos os dados de uma vez
 */
async function loadAllData(): Promise<StudentData> {
  try {
    const response = await apiClient.get<StudentData>("/api/students/all");
    const transformedData = transformStudentData(response.data);
    // Mesclar com initialStudentData para garantir que todos os campos estejam presentes
    return {
      ...initialStudentData,
      ...transformedData,
    } as StudentData;
  } catch (error) {
    console.error("Erro ao carregar todos os dados:", error);
    return initialStudentData;
  }
}

// ============================================
// STORE
// ============================================

export const useStudentUnifiedStore = create<StudentUnifiedState>()(
  persist(
    (set, get) => ({
      // === DADOS INICIAIS ===
      data: initialStudentData,

      // === ACTIONS - CARREGAR DADOS ===
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
          const apiData = await loadAllData();
          const transformedData = transformStudentData(apiData);
          set({
            data: {
              ...initialStudentData,
              ...transformedData,
              metadata: {
                ...initialStudentData.metadata,
                ...transformedData.metadata,
                isLoading: false,
                isInitialized: true,
                lastSync: new Date(),
                errors: {},
              },
            },
          });
        } catch (error: any) {
          set((state) => ({
            data: {
              ...state.data,
              metadata: {
                ...state.data.metadata,
                isLoading: false,
                errors: {
                  loadAll: error.message || "Erro ao carregar dados",
                },
              },
            },
          }));
        }
      },

      loadUser: async () => {
        const section = await loadSection("user");
        set((state) => ({
          data: {
            ...state.data,
            user: { ...state.data.user, ...section.user },
          },
        }));
      },

      loadProgress: async () => {
        const section = await loadSection("progress");
        set((state) => ({
          data: {
            ...state.data,
            progress: { ...state.data.progress, ...section.progress },
          },
        }));
      },

      loadProfile: async () => {
        const section = await loadSection("profile");
        set((state) => ({
          data: {
            ...state.data,
            profile: { ...state.data.profile, ...section.profile },
          },
        }));
      },

      loadWeightHistory: async () => {
        const section = await loadSection("weightHistory");
        set((state) => ({
          data: {
            ...state.data,
            weightHistory: section.weightHistory || state.data.weightHistory,
          },
        }));
      },

      loadWorkouts: async () => {
        const section = await loadSection("units");
        set((state) => ({
          data: {
            ...state.data,
            units: section.units || state.data.units,
          },
        }));
      },

      loadWorkoutHistory: async () => {
        const section = await loadSection("workoutHistory");
        set((state) => ({
          data: {
            ...state.data,
            workoutHistory: section.workoutHistory || state.data.workoutHistory,
          },
        }));
      },

      loadPersonalRecords: async () => {
        const section = await loadSection("personalRecords");
        set((state) => ({
          data: {
            ...state.data,
            personalRecords:
              section.personalRecords || state.data.personalRecords,
          },
        }));
      },

      loadNutrition: async () => {
        try {
          // Carregar nutrição diretamente da API específica usando axios
          // Usar timeout maior para esta chamada (30 segundos) pois pode demorar mais
          const response = await apiClient.get<{
            date: string;
            meals: any[];
            totalCalories: number;
            totalProtein: number;
            totalCarbs: number;
            totalFats: number;
            waterIntake: number;
            targetCalories: number;
            targetProtein: number;
            targetCarbs: number;
            targetFats: number;
            targetWater: number;
          }>("/api/nutrition/daily", {
            timeout: 30000, // 30 segundos
          });

          const data = response.data;

          // Transformar dados para o formato do store
          set((state) => ({
            data: {
              ...state.data,
              dailyNutrition: {
                date: data.date || new Date().toISOString().split("T")[0],
                meals: data.meals || [],
                totalCalories: data.totalCalories || 0,
                totalProtein: data.totalProtein || 0,
                totalCarbs: data.totalCarbs || 0,
                totalFats: data.totalFats || 0,
                waterIntake: data.waterIntake || 0,
                targetCalories: data.targetCalories || 2000,
                targetProtein: data.targetProtein || 150,
                targetCarbs: data.targetCarbs || 250,
                targetFats: data.targetFats || 65,
                targetWater: data.targetWater || 3000,
              },
            },
          }));
        } catch (error: any) {
          // Tratar timeout especificamente
          if (
            error.code === "ECONNABORTED" ||
            error.message?.includes("timeout")
          ) {
            console.warn(
              "⚠️ Timeout ao carregar nutrição. Continuando com dados atuais do store."
            );
            return; // Manter dados atuais do store
          }

          // Se a migration não foi aplicada, não mostrar erro
          if (error.response?.data?.code === "MIGRATION_REQUIRED") {
            console.log(
              "⚠️ Tabela de nutrição não existe. Execute: node scripts/apply-nutrition-migration.js"
            );
            return; // Manter dados atuais do store
          }

          console.error("Erro ao carregar nutrição:", error);
          // Manter dados atuais do store em caso de erro
        }
      },

      loadSubscription: async () => {
        const section = await loadSection("subscription");
        set((state) => ({
          data: {
            ...state.data,
            subscription: section.subscription ?? state.data.subscription,
          },
        }));
      },

      loadMemberships: async () => {
        const section = await loadSection("memberships");
        set((state) => ({
          data: {
            ...state.data,
            memberships: section.memberships || state.data.memberships,
          },
        }));
      },

      loadPayments: async () => {
        const section = await loadSection("payments");
        set((state) => ({
          data: {
            ...state.data,
            payments: section.payments || state.data.payments,
          },
        }));
      },

      loadPaymentMethods: async () => {
        const section = await loadSection("paymentMethods");
        set((state) => ({
          data: {
            ...state.data,
            paymentMethods: section.paymentMethods || state.data.paymentMethods,
          },
        }));
      },

      loadDayPasses: async () => {
        const section = await loadSection("dayPasses");
        set((state) => ({
          data: {
            ...state.data,
            dayPasses: section.dayPasses || state.data.dayPasses,
          },
        }));
      },

      loadFriends: async () => {
        const section = await loadSection("friends");
        set((state) => ({
          data: {
            ...state.data,
            friends: section.friends || state.data.friends,
          },
        }));
      },

      loadGymLocations: async () => {
        const section = await loadSection("gymLocations");
        set((state) => ({
          data: {
            ...state.data,
            gymLocations: section.gymLocations || state.data.gymLocations,
          },
        }));
      },

      loadFoodDatabase: async () => {
        try {
          // Buscar todos os alimentos da API (sem query para pegar todos)
          const response = await apiClient.get<{ foods: any[] }>(
            "/api/foods/search?limit=1000",
            {
              timeout: 30000, // 30 segundos
            }
          );

          const foods = response.data.foods || [];

          // Armazenar no store
          set((state) => ({
            data: {
              ...state.data,
              foodDatabase: foods,
            },
          }));
        } catch (error: any) {
          // Tratamento específico para timeout
          if (
            error.code === "ECONNABORTED" ||
            error.message?.includes("timeout")
          ) {
            console.warn(
              "⚠️ Timeout ao carregar alimentos. Continuando com dados existentes."
            );
            return;
          }

          // Se a tabela não existir, não mostrar erro
          if (
            error.response?.status === 500 ||
            error.message?.includes("does not exist")
          ) {
            console.log(
              "⚠️ Tabela de alimentos não existe. Execute: node scripts/apply-nutrition-migration.js"
            );
            return;
          }

          console.error("Erro ao carregar alimentos:", error);
          // Manter dados atuais do store em caso de erro
        }
      },

      // === ACTIONS - ATUALIZAR DADOS ===
      updateProgress: async (updates) => {
        // Optimistic update - atualiza UI imediatamente
        set((state) => ({
          data: {
            ...state.data,
            progress: { ...state.data.progress, ...updates },
          },
        }));

        // Criar command explícito
        const command = createCommand("UPDATE_PROGRESS", updates, {
          optimistic: true,
        });

        // Sync with backend usando salvadorOff (gerencia offline/online automaticamente)
        try {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("auth_token")
              : null;

          const options = commandToSalvadorOff(
            command,
            "/api/students/progress",
            "PUT",
            token ? { Authorization: `Bearer ${token}` } : {}
          );

          const result = await salvadorOff({
            ...options,
            priority: "high",
          });

          if (!result.success && result.error) {
            throw result.error;
          }

          // Se foi enfileirado, marcar como pendente (NÃO reverter UI)
          if (result.queued && result.queueId) {
            set((state) => ({
              data: {
                ...state.data,
                metadata: {
                  ...state.data.metadata,
                  pendingActions: addPendingAction(
                    state.data.metadata.pendingActions,
                    {
                      type: "UPDATE_PROGRESS",
                      queueId: result.queueId,
                      retries: 0,
                    }
                  ),
                },
              },
            }));
            console.log(
              "✅ Progresso salvo offline. Sincronizará quando online."
            );
            return;
          }

          // Se sincronizado com sucesso, remover de pendentes se existir
          if (result.success && !result.queued) {
            set((state) => ({
              data: {
                ...state.data,
                metadata: {
                  ...state.data.metadata,
                  pendingActions: state.data.metadata.pendingActions.filter(
                    (action) => action.type !== "UPDATE_PROGRESS" || action.id !== command.id
                  ),
                },
              },
            }));
          }
        } catch (error: any) {
          // NÃO reverter UI - marcar como pendente se for erro de rede
          const isNetworkError =
            error.code === "ECONNABORTED" ||
            error.message?.includes("Network Error") ||
            !navigator.onLine;

          if (isNetworkError) {
            // Marcar como pendente sem reverter UI
            set((state) => ({
              data: {
                ...state.data,
                metadata: {
                  ...state.data.metadata,
                  pendingActions: addPendingAction(
                    state.data.metadata.pendingActions,
                    {
                      type: "UPDATE_PROGRESS",
                      retries: 0,
                    }
                  ),
                },
              },
            }));
            console.log(
              "📡 Offline - Progresso será sincronizado quando voltar online"
            );
          } else {
            // Erro não é de rede - pode ser validação, etc. Ainda não reverte
            console.error("Erro ao atualizar progresso:", error);
            // Marcar erro no metadata
            set((state) => ({
              data: {
                ...state.data,
                metadata: {
                  ...state.data.metadata,
                  errors: {
                    ...state.data.metadata.errors,
                    updateProgress: error.message || "Erro ao atualizar progresso",
                  },
                },
              },
            }));
          }
        }
      },

      updateProfile: async (updates) => {
        // Optimistic update
        const previousProfile = get().data.profile;
        set((state) => ({
          data: {
            ...state.data,
            profile: { ...state.data.profile, ...updates },
          },
        }));

        // Sync with backend usando salvadorOff
        try {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("auth_token")
              : null;

          const result = await salvadorOff({
            url: "/api/students/profile",
            method: "POST",
            body: updates,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            priority: "normal",
          });

          if (!result.success && result.error) {
            throw result.error;
          }

          if (result.queued) {
            console.log("✅ Perfil salvo offline. Sincronizará quando online.");
            return;
          }
        } catch (error: any) {
          const isNetworkError =
            error.code === "ECONNABORTED" ||
            error.message?.includes("Network Error") ||
            !navigator.onLine;

          if (!isNetworkError) {
            console.error("Erro ao atualizar perfil:", error);
            set((state) => ({
              data: {
                ...state.data,
                profile: previousProfile,
              },
            }));
          }
        }
      },

      addWeight: async (weight, date = new Date(), notes) => {
        const newEntry: WeightHistoryItem = {
          date,
          weight,
          notes,
        };

        // Optimistic update - atualiza UI imediatamente
        const previousWeightHistory = get().data.weightHistory;
        const previousProfile = get().data.profile;
        set((state) => ({
          data: {
            ...state.data,
            weightHistory: [newEntry, ...state.data.weightHistory],
            profile: {
              ...state.data.profile,
              weight,
            },
          },
        }));

        // Sync with backend usando salvadorOff
        try {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("auth_token")
              : null;

          const result = await salvadorOff({
            url: "/api/students/weight",
            method: "POST",
            body: {
              weight,
              date: date.toISOString(),
              notes,
            },
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            priority: "high",
          });

          if (!result.success && result.error) {
            throw result.error;
          }

          if (result.queued) {
            console.log("✅ Peso salvo offline. Sincronizará quando online.");
            return;
          }

          // Se online e sucesso, recarregar weightHistory
          await get().loadWeightHistory();
        } catch (error: any) {
          const isNetworkError =
            error.code === "ECONNABORTED" ||
            error.message?.includes("Network Error") ||
            !navigator.onLine;

          if (!isNetworkError) {
            console.error("Erro ao adicionar peso:", error);
            set((state) => ({
              data: {
                ...state.data,
                weightHistory: previousWeightHistory,
                profile: previousProfile,
              },
            }));
          }
        }
      },

      completeWorkout: async (data) => {
        // O workout já foi salvo no backend pelo workout-modal
        // Aqui apenas atualizamos o store local para refletir a conclusão

        // Atualizar progresso (XP, streak, etc) se fornecido
        if (data.xpEarned) {
          const currentProgress = get().data.progress;
          await get().updateProgress({
            totalXP: currentProgress.totalXP + data.xpEarned,
            todayXP: currentProgress.todayXP + data.xpEarned,
            workoutsCompleted: currentProgress.workoutsCompleted + 1,
          });
        }

        // Recarregar workouts para atualizar status de locked/completed
        await get().loadWorkouts();
      },

      addPersonalRecord: (record) => {
        set((state) => ({
          data: {
            ...state.data,
            personalRecords: [record, ...state.data.personalRecords],
          },
        }));
      },

      addDayPass: (dayPass) => {
        set((state) => ({
          data: {
            ...state.data,
            dayPasses: [...state.data.dayPasses, dayPass],
          },
        }));
      },

      updateNutrition: async (updates) => {
        // Optimistic update - atualiza UI imediatamente
        const previousNutrition = get().data.dailyNutrition;
        let updatedNutrition: any;
        set((state) => {
          const currentNutrition = state.data.dailyNutrition;
          const updatedMeals =
            updates.meals !== undefined
              ? updates.meals
              : currentNutrition.meals;

          // Recalcular totais automaticamente se meals foram atualizados
          let calculatedTotals = {};
          if (updates.meals !== undefined) {
            const totalCalories = updatedMeals.reduce(
              (sum: number, meal: any) => sum + (meal.calories || 0),
              0
            );
            const totalProtein = updatedMeals.reduce(
              (sum: number, meal: any) => sum + (meal.protein || 0),
              0
            );
            const totalCarbs = updatedMeals.reduce(
              (sum: number, meal: any) => sum + (meal.carbs || 0),
              0
            );
            const totalFats = updatedMeals.reduce(
              (sum: number, meal: any) => sum + (meal.fats || 0),
              0
            );

            calculatedTotals = {
              totalCalories,
              totalProtein,
              totalCarbs,
              totalFats,
            };
          }

          updatedNutrition = {
            ...currentNutrition,
            ...updates,
            ...calculatedTotals, // Sobrescrever totais calculados se meals foram atualizados
          };

          return {
            data: {
              ...state.data,
              dailyNutrition: updatedNutrition,
            },
          };
        });

        // Sync with backend usando salvadorOff
        try {
          // Formatar dados para API (formato esperado: { date, meals, waterIntake })
          const apiPayload = {
            date:
              updatedNutrition.date || new Date().toISOString().split("T")[0],
            meals: (updatedNutrition.meals || []).map(
              (meal: any, index: number) => ({
                name: meal.name,
                type: meal.type,
                calories: meal.calories || 0,
                protein: meal.protein || 0,
                carbs: meal.carbs || 0,
                fats: meal.fats || 0,
                time: meal.time || null,
                completed: meal.completed || false,
                order: index,
                foods: (meal.foods || []).map((food: any) => ({
                  foodId: food.foodId || null,
                  foodName: food.foodName,
                  servings: food.servings || 1,
                  calories: food.calories || 0,
                  protein: food.protein || 0,
                  carbs: food.carbs || 0,
                  fats: food.fats || 0,
                  servingSize: food.servingSize || "100g",
                })),
              })
            ),
            waterIntake: updatedNutrition.waterIntake || 0,
          };

          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("auth_token")
              : null;

          const result = await salvadorOff({
            url: "/api/nutrition/daily",
            method: "POST",
            body: apiPayload,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            priority: "normal",
          });

          if (!result.success && result.error) {
            throw result.error;
          }

          if (result.queued) {
            console.log(
              "✅ Nutrição salva offline. Sincronizará quando online."
            );
            return;
          }
        } catch (error: any) {
          // Se a migration não foi aplicada, não mostrar erro
          if (error.response?.data?.code === "MIGRATION_REQUIRED") {
            console.log(
              "⚠️ Tabela de nutrição não existe. Execute: node scripts/apply-nutrition-migration.js"
            );
            return;
          }

          const isNetworkError =
            error.code === "ECONNABORTED" ||
            error.message?.includes("Network Error") ||
            !navigator.onLine;

          if (!isNetworkError) {
            console.error("Erro ao atualizar nutrição:", error);
            // Reverter mudança otimista em caso de erro
            set((state) => ({
              data: {
                ...state.data,
                dailyNutrition: previousNutrition,
              },
            }));
          }
        }
      },

      updateSubscription: async (updates) => {
        set((state) => ({
          data: {
            ...state.data,
            subscription: state.data.subscription
              ? { ...state.data.subscription, ...updates }
              : null,
          },
        }));

        // Sync com backend se necessário
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
          console.log("Salvar progresso do workout:", workoutId);
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

      // === ACTIONS - SYNC ===
      syncAll: async () => {
        await get().loadAll();
      },

      syncProgress: async () => {
        await get().loadProgress();
      },

      syncNutrition: async () => {
        await get().loadNutrition();
      },

      syncPendingActions: async () => {
        // Sincroniza ações pendentes quando volta online
        const { pendingActions } = get().data.metadata;
        
        if (pendingActions.length === 0) {
          return;
        }

        // Verificar se está online
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.log("📡 Ainda offline - ações pendentes serão sincronizadas quando voltar online");
          return;
        }

        console.log(`🔄 Sincronizando ${pendingActions.length} ação(ões) pendente(s)...`);

        // Tentar sincronizar cada ação pendente
        // Nota: A sincronização real acontece automaticamente via salvadorOff
        // quando a fila offline é processada. Esta função apenas marca como sincronizadas
        // após verificar que não há mais ações na fila.
        
        // Por enquanto, apenas limpa ações antigas (mais de 1 hora)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        set((state) => ({
          data: {
            ...state.data,
            metadata: {
              ...state.data.metadata,
              pendingActions: state.data.metadata.pendingActions.filter(
                (action) => action.createdAt > oneHourAgo
              ),
            },
          },
        }));
      },

      // === ACTIONS - RESET ===
      reset: () => {
        set({ data: initialStudentData });
      },

      clearCache: () => {
        // Limpa cache local (localStorage)
        localStorage.removeItem("student-unified-storage");
        set({ data: initialStudentData });
      },
    }),
    {
      name: "student-unified-storage",
      storage: createIndexedDBStorage(), // Usa IndexedDB ao invés de localStorage (suporta dados grandes)
      partialize: (state) => ({
        data: {
          ...state.data,
          metadata: {
            ...state.data.metadata,
            isLoading: false, // Não persistir loading state
          },
        },
      }),
      // Migra dados do localStorage para IndexedDB na primeira vez
      onRehydrateStorage: () => {
        return async (state) => {
          if (typeof window !== 'undefined' && state) {
            await migrateFromLocalStorage('student-unified-storage');
          }
        };
      },
    }
  )
);
