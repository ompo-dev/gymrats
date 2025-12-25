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
import type {
  UserProgress,
  PersonalRecord,
  DailyNutrition,
  WeightHistoryItem,
} from "@/lib/types";
import { apiClient } from "@/lib/api/client";

// ============================================
// INTERFACE DO STORE
// ============================================

interface StudentUnifiedState {
  // === DADOS ===
  data: StudentData;

  // === ACTIONS - CARREGAR DADOS ===
  loadAll: () => Promise<void>;
  loadUser: () => Promise<void>;
  loadProgress: () => Promise<void>;
  loadProfile: () => Promise<void>;
  loadWeightHistory: () => Promise<void>;
  loadWorkouts: () => Promise<void>;
  loadWorkoutHistory: () => Promise<void>;
  loadPersonalRecords: () => Promise<void>;
  loadNutrition: () => Promise<void>;
  loadSubscription: () => Promise<void>;
  loadMemberships: () => Promise<void>;
  loadPayments: () => Promise<void>;
  loadPaymentMethods: () => Promise<void>;
  loadDayPasses: () => Promise<void>;
  loadFriends: () => Promise<void>;
  loadGymLocations: () => Promise<void>;

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
  updateActiveWorkout: (
    updates: Partial<StudentData["activeWorkout"]>
  ) => void;
  saveWorkoutProgress: (workoutId: string) => void;
  clearActiveWorkout: () => void;

  // === ACTIONS - SYNC ===
  syncAll: () => Promise<void>;
  syncProgress: () => Promise<void>;
  syncNutrition: () => Promise<void>;

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
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.warn(`Timeout ao carregar ${section}. Continuando com dados existentes.`);
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
    return transformStudentData(response.data);
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
            workoutHistory:
              section.workoutHistory || state.data.workoutHistory,
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
          if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
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
            paymentMethods:
              section.paymentMethods || state.data.paymentMethods,
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

      // === ACTIONS - ATUALIZAR DADOS ===
      updateProgress: async (updates) => {
        // Optimistic update - atualiza UI imediatamente
        const previousProgress = get().data.progress;
        set((state) => ({
          data: {
            ...state.data,
            progress: { ...state.data.progress, ...updates },
          },
        }));

        // Sync with backend em background usando axios
        try {
          await apiClient.put("/api/students/progress", updates);
        } catch (error: any) {
          // Reverter em caso de erro
          console.error("Erro ao atualizar progresso:", error);
          set((state) => ({
            data: {
              ...state.data,
              progress: previousProgress,
            },
          }));
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

        // Sync with backend em background
        try {
          await apiClient.post("/api/students/profile", updates);
        } catch (error: any) {
          // Reverter em caso de erro
          console.error("Erro ao atualizar perfil:", error);
          set((state) => ({
            data: {
              ...state.data,
              profile: previousProfile,
            },
          }));
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

        // Sync with backend em background
        try {
          await apiClient.post("/api/students/weight", {
            weight,
            date: date.toISOString(),
            notes,
          });

          // Recarregar weightHistory para obter dados atualizados (incluindo weightGain)
          await get().loadWeightHistory();
        } catch (error: any) {
          // Reverter em caso de erro
          console.error("Erro ao adicionar peso:", error);
          set((state) => ({
            data: {
              ...state.data,
              weightHistory: previousWeightHistory,
              profile: previousProfile,
            },
          }));
        }
      },

      completeWorkout: async (data) => {
        // Esta action será implementada quando integrarmos com a API de workouts
        // Por enquanto, apenas atualiza o store local
        console.log("Completar workout:", data);
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
          updatedNutrition = {
            ...state.data.dailyNutrition,
            ...updates,
          };
          return {
            data: {
              ...state.data,
              dailyNutrition: updatedNutrition,
            },
          };
        });

        // Sync with backend em background usando axios
        try {
          // Formatar dados para API (formato esperado: { date, meals, waterIntake })
          const apiPayload = {
            date: updatedNutrition.date || new Date().toISOString().split("T")[0],
            meals: (updatedNutrition.meals || []).map((meal: any, index: number) => ({
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
            })),
            waterIntake: updatedNutrition.waterIntake || 0,
          };

          await apiClient.post("/api/nutrition/daily", apiPayload);
        } catch (error: any) {
          // Se a migration não foi aplicada, não mostrar erro
          if (error.response?.data?.code === "MIGRATION_REQUIRED") {
            console.log(
              "⚠️ Tabela de nutrição não existe. Execute: node scripts/apply-nutrition-migration.js"
            );
            return; // Não tentar sincronizar se a migration não foi aplicada
          }
          console.error("Erro ao atualizar nutrição:", error);
          // Reverter mudança otimista em caso de erro
          set((state) => ({
            data: {
              ...state.data,
              dailyNutrition: previousNutrition,
            },
          }));
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
      partialize: (state) => ({
        data: {
          ...state.data,
          metadata: {
            ...state.data.metadata,
            isLoading: false, // Não persistir loading state
          },
        },
      }),
    }
  )
);

