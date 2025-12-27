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
import type { UserProgress, PersonalRecord, DailyNutrition } from "@/lib/types";
import type { WeightHistoryItem } from "@/lib/types/student-unified";
import { apiClient } from "@/lib/api/client";
import {
  syncManager,
  generateIdempotencyKey,
} from "@/lib/offline/sync-manager";
import {
  createIndexedDBStorage,
  migrateFromLocalStorage,
} from "@/lib/offline/indexeddb-storage";
import {
  addPendingAction,
  removePendingActionByQueueId,
} from "@/lib/offline/pending-actions";
import {
  createCommand,
  commandToSyncManager,
} from "@/lib/offline/command-pattern";
import { logCommand } from "@/lib/offline/command-logger";
import { migrateCommand } from "@/lib/offline/command-migrations";

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
    onlyPriorities?: boolean
  ) => Promise<void>;
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
/**
 * Mapeamento de seções para rotas específicas
 * Usa rotas dedicadas ao invés de /api/students/all?sections=...
 * Se não tiver rota específica, usa null e será carregado via /api/students/all?sections=...
 */
const SECTION_ROUTES: Partial<Record<StudentDataSection, string>> = {
  // TODAS as rotas específicas - NÃO usar mais /api/students/all
  user: "/api/auth/session", // User vem da sessão
  student: "/api/students/student", // Informações básicas do student
  progress: "/api/students/progress", // Progresso (XP, streaks, achievements)
  profile: "/api/students/profile",
  weightHistory: "/api/students/weight",
  units: "/api/workouts/units",
  workoutHistory: "/api/workouts/history",
  personalRecords: "/api/students/personal-records",
  subscription: "/api/subscriptions/current",
  memberships: "/api/memberships",
  payments: "/api/payments",
  paymentMethods: "/api/payment-methods",
  dayPasses: "/api/students/day-passes",
  friends: "/api/students/friends",
  gymLocations: "/api/gyms/locations",
  dailyNutrition: "/api/nutrition/daily",

  // NOTA: Todas as seções agora têm rotas específicas!
  // O /api/students/all ainda existe para compatibilidade, mas não é mais usado
};

/**
 * Rastreamento de seções sendo carregadas no momento
 * Evita carregar a mesma seção múltiplas vezes simultaneamente
 */
const loadingSections = new Set<StudentDataSection>();
const loadingPromises = new Map<
  StudentDataSection,
  Promise<Partial<StudentData>>
>();

/**
 * Carrega uma seção específica dos dados
 * TODAS as seções agora têm rotas específicas - não usa mais /api/students/all
 *
 * IMPORTANTE: Evita carregamentos duplicados - se a seção já está sendo carregada,
 * retorna a promise existente em vez de fazer nova requisição
 */
async function loadSection(
  section: StudentDataSection
): Promise<Partial<StudentData>> {
  // Se já está sendo carregada, retornar a promise existente
  if (loadingSections.has(section) && loadingPromises.has(section)) {
    const existingPromise = loadingPromises.get(section);
    if (existingPromise) {
      console.log(
        `[loadSection] Seção ${section} já está sendo carregada, reutilizando promise`
      );
      return existingPromise;
    }
  }

  // Marcar como carregando e criar promise
  loadingSections.add(section);
  const loadPromise = (async () => {
    try {
      const route = SECTION_ROUTES[section];

      if (!route) {
        console.warn(`⚠️ Seção ${section} não tem rota específica mapeada`);
        return {};
      }

      // Usar rota específica (mais rápida e eficiente)
      const response = await apiClient.get<any>(route, {
        timeout: 30000, // 30 segundos para rotas específicas
      });

      // Transformar resposta da rota específica para formato do store
      return transformSectionResponse(section, response.data);
    } catch (error: any) {
      // Tratamento específico para timeout
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        console.warn(
          `⏱️ Timeout ao carregar ${section}. Continuando com dados existentes.`
        );
        return {};
      }
      console.error(`❌ Erro ao carregar ${section}:`, error);
      return {};
    } finally {
      // Remover do tracking quando terminar (sucesso ou erro)
      loadingSections.delete(section);
      loadingPromises.delete(section);
    }
  })();

  // Armazenar promise para reutilização
  loadingPromises.set(section, loadPromise);

  return loadPromise;
}

/**
 * Transforma resposta da rota específica para formato do store
 */
function transformSectionResponse(
  section: StudentDataSection,
  data: any
): Partial<StudentData> {
  switch (section) {
    case "user":
      // User vem de /api/auth/session como { user: {...}, session: {...} }
      // Extrair apenas os dados do user
      if (data.user) {
        return { user: data.user };
      }
      // Se vier direto do /api/students/all
      return { user: data };

    case "student":
      // Student vem direto da rota /api/students/student
      return { student: data };

    case "profile":
      // Profile vem de /api/students/profile como { success: true, hasProfile: true, profile: {...}, student: {...} }
      // ou pode vir como objeto direto do /api/students/all
      if (data.profile) {
        return { profile: data.profile };
      }
      // Se vier direto (sem wrapper)
      return { profile: data };

    case "progress":
      // Progress vem direto da rota /api/students/progress
      return { progress: data };

    case "weightHistory":
      // Weight history vem de /api/students/weight como { history: [...], total: number }
      // ou pode vir como array direto
      if (Array.isArray(data)) {
        return { weightHistory: data };
      }
      if (data.history && Array.isArray(data.history)) {
        return { weightHistory: data.history };
      }
      return { weightHistory: data.weightHistory || [] };

    case "units":
      // Units vem como array
      return { units: Array.isArray(data) ? data : data.units || [] };

    case "workoutHistory":
      // Workout history vem de /api/workouts/history como { history: [...], total: number }
      // ou pode vir como array direto
      if (Array.isArray(data)) {
        return { workoutHistory: data };
      }
      if (data.history && Array.isArray(data.history)) {
        return { workoutHistory: data.history };
      }
      return { workoutHistory: data.workoutHistory || [] };

    case "personalRecords":
      // Personal records vem como { records: [...], total: number }
      return { personalRecords: data.records || data.personalRecords || [] };

    case "subscription":
      // Subscription pode ser null
      return { subscription: data.subscription || data || null };

    case "memberships":
      // Memberships vem como array
      return {
        memberships: Array.isArray(data) ? data : data.memberships || [],
      };

    case "payments":
      // Payments vem como array
      return { payments: Array.isArray(data) ? data : data.payments || [] };

    case "paymentMethods":
      // Payment methods vem como array
      return {
        paymentMethods: Array.isArray(data) ? data : data.paymentMethods || [],
      };

    case "dayPasses":
      // Day passes vem como { dayPasses: [...], total: number }
      return { dayPasses: data.dayPasses || [] };

    case "friends":
      // Friends vem como { count: number, list: [...] }
      return { friends: data };

    case "gymLocations":
      // Gym locations vem como array
      return {
        gymLocations: Array.isArray(data) ? data : data.gymLocations || [],
      };

    default:
      return { [section]: data };
  }
}

/**
 * Remove refeições duplicadas baseado em ID ou combinação de campos únicos
 */
function deduplicateMeals(meals: any[]): any[] {
  if (!meals || meals.length === 0) return [];

  const seen = new Set<string>();
  const uniqueMeals: any[] = [];

  for (const meal of meals) {
    // Criar chave única baseada em ID ou combinação de campos
    let key: string;
    if (meal.id) {
      key = `id:${meal.id}`;
    } else {
      // Se não tem ID, usar combinação de name + type + time como chave
      const timeStr = meal.time ? new Date(meal.time).toISOString() : "";
      key = `${meal.name || ""}:${meal.type || ""}:${timeStr}`;
    }

    if (!seen.has(key)) {
      seen.add(key);
      uniqueMeals.push(meal);
    } else {
      console.warn("[deduplicateMeals] ⚠️ Refeição duplicada removida:", {
        name: meal.name,
        type: meal.type,
        id: meal.id,
      });
    }
  }

  return uniqueMeals;
}

/**
 * Calcula weightGain baseado no weightHistory
 * Ganho/perda no último mês
 */
function calculateWeightGain(
  weightHistory: WeightHistoryItem[]
): number | null {
  if (!weightHistory || weightHistory.length === 0) {
    return null;
  }

  const currentWeight = weightHistory[0].weight;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Encontrar peso mais próximo de 1 mês atrás
  const weightOneMonthAgo = weightHistory.find((wh) => {
    const whDate = new Date(wh.date);
    return whDate <= oneMonthAgo;
  });

  if (weightOneMonthAgo) {
    return currentWeight - weightOneMonthAgo.weight;
  }

  return null;
}

/**
 * Função auxiliar para atualizar o store incrementalmente com uma seção
 * Esta função é chamada pelo loadAll para atualizar o store assim que cada seção carrega
 * sectionData já vem transformado de loadSection (via transformSectionResponse)
 */
function updateStoreWithSection(
  set: any,
  section: StudentDataSection,
  sectionData: Partial<StudentData>
): void {
  set((state: StudentUnifiedState) => {
    const newState = { ...state.data };

    // Mesclar dados da seção no estado atual
    // sectionData já vem transformado de loadSection
    if (sectionData.user) {
      newState.user = { ...newState.user, ...sectionData.user };
    }
    if (sectionData.student) {
      newState.student = { ...newState.student, ...sectionData.student };
    }
    if (sectionData.progress) {
      newState.progress = { ...newState.progress, ...sectionData.progress };
    }
    if (sectionData.profile) {
      newState.profile = { ...newState.profile, ...sectionData.profile };
    }
    if (sectionData.weightHistory) {
      newState.weightHistory = sectionData.weightHistory;
      // Calcular weightGain
      if (sectionData.weightHistory.length > 0) {
        newState.weightGain = calculateWeightGain(sectionData.weightHistory);
        // Atualizar currentWeight no profile se não existir
        if (!newState.profile?.weight && sectionData.weightHistory[0]) {
          newState.profile = {
            ...newState.profile,
            weight: sectionData.weightHistory[0].weight,
          };
        }
      }
    }
    if (sectionData.units !== undefined) {
      newState.units = sectionData.units;
    }
    if (sectionData.workoutHistory !== undefined) {
      newState.workoutHistory = sectionData.workoutHistory;
    }
    if (sectionData.personalRecords !== undefined) {
      newState.personalRecords = sectionData.personalRecords;
    }
    if (sectionData.subscription !== undefined) {
      newState.subscription = sectionData.subscription;
    }
    if (sectionData.memberships !== undefined) {
      newState.memberships = sectionData.memberships;
    }
    if (sectionData.payments !== undefined) {
      newState.payments = sectionData.payments;
    }
    if (sectionData.paymentMethods !== undefined) {
      newState.paymentMethods = sectionData.paymentMethods;
    }
    if (sectionData.dayPasses !== undefined) {
      newState.dayPasses = sectionData.dayPasses;
    }
    if (sectionData.friends !== undefined) {
      newState.friends = sectionData.friends;
    }
    if (sectionData.gymLocations !== undefined) {
      newState.gymLocations = sectionData.gymLocations;
    }
    if (sectionData.dailyNutrition !== undefined) {
      newState.dailyNutrition = sectionData.dailyNutrition;
    }

    return {
      data: newState,
    };
  });
}

/**
 * Carrega seções específicas e atualiza store incrementalmente
 * Usado por loadAllPrioritized para carregar apenas seções necessárias
 */
async function loadSectionsIncremental(
  set: any,
  sections: StudentDataSection[],
  skipNutrition: boolean = false
): Promise<void> {
  // Carregar todas as seções em paralelo, mas atualizar store incrementalmente
  const sectionPromises = sections.map(async (section) => {
    try {
      const sectionData = await loadSection(section);

      // Atualizar store imediatamente quando esta seção carregar
      if (sectionData && Object.keys(sectionData).length > 0) {
        updateStoreWithSection(set, section, sectionData);
      }

      return sectionData;
    } catch (error) {
      console.warn(
        `[loadSectionsIncremental] Erro ao carregar seção ${section}:`,
        error
      );
      return {};
    }
  });

  // Aguardar todas as requisições (mas store já foi atualizado incrementalmente)
  await Promise.all(sectionPromises);

  // Se dailyNutrition está nas seções e não devemos pular, carregar separadamente
  if (!skipNutrition && sections.includes("dailyNutrition")) {
    try {
      const nutritionResponse = await apiClient.get<{
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
        timeout: 30000,
      });

      const nutritionResponseData = nutritionResponse.data;

      // Normalizar data para formato YYYY-MM-DD
      let normalizedDate: string;
      if (nutritionResponseData.date) {
        if (
          typeof nutritionResponseData.date === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(nutritionResponseData.date)
        ) {
          normalizedDate = nutritionResponseData.date;
        } else {
          const dateObj = new Date(nutritionResponseData.date);
          normalizedDate = dateObj.toISOString().split("T")[0];
        }
      } else {
        normalizedDate = new Date().toISOString().split("T")[0];
      }

      // Remover duplicatas antes de salvar
      const uniqueMeals = deduplicateMeals(nutritionResponseData.meals || []);

      const nutritionData: Partial<StudentData> = {
        dailyNutrition: {
          date: normalizedDate,
          meals: uniqueMeals,
          totalCalories: nutritionResponseData.totalCalories ?? 0,
          totalProtein: nutritionResponseData.totalProtein ?? 0,
          totalCarbs: nutritionResponseData.totalCarbs ?? 0,
          totalFats: nutritionResponseData.totalFats ?? 0,
          waterIntake: nutritionResponseData.waterIntake ?? 0,
          targetCalories: nutritionResponseData.targetCalories ?? 2000,
          targetProtein: nutritionResponseData.targetProtein ?? 150,
          targetCarbs: nutritionResponseData.targetCarbs ?? 250,
          targetFats: nutritionResponseData.targetFats ?? 65,
          targetWater: nutritionResponseData.targetWater ?? 3000,
        },
      };

      // Atualizar store com nutrição
      updateStoreWithSection(set, "dailyNutrition", nutritionData);
    } catch (error) {
      console.warn(
        "[loadSectionsIncremental] Erro ao carregar nutrição:",
        error
      );
    }
  }
}

/**
 * Carrega todos os dados fazendo múltiplas requisições separadas
 * ATUALIZA O STORE INCREMENTALMENTE conforme cada seção carrega
 * Isso permite que a UI apareça progressivamente, sem esperar tudo terminar
 */
async function loadAllDataIncremental(
  set: any,
  get: () => StudentUnifiedState
): Promise<void> {
  // Seções em ordem de prioridade (mais importantes primeiro)
  // Isso permite que units, progress apareçam primeiro na tela de learn
  const sections: StudentDataSection[] = [
    "user",
    "student",
    "progress", // Importante para tela de learn
    "units", // MAIS IMPORTANTE para tela de learn - prioridade alta
    "profile",
    "weightHistory",
    "workoutHistory",
    "personalRecords",
    "subscription",
    "memberships",
    "payments",
    "paymentMethods",
    "dayPasses",
    "friends",
    "gymLocations",
  ];

  // Usar função auxiliar para carregar todas as seções
  await loadSectionsIncremental(set, sections);
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
          // Carregar dados incrementalmente (atualiza store conforme cada seção carrega)
          await loadAllDataIncremental(set, get);

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
        } catch (error: any) {
          console.error("[loadAll] Erro ao carregar dados:", error);

          // Se for timeout, tentar carregamento incremental como fallback
          if (
            error.code === "ECONNABORTED" ||
            error.message?.includes("timeout")
          ) {
            console.warn(
              "[loadAll] Timeout detectado, tentando carregamento incremental..."
            );

            try {
              // Carregar dados essenciais primeiro
              await get().loadEssential();
              await get().loadStudentCore();

              // Tentar carregar o resto em background
              Promise.all([
                get().loadWorkouts(),
                get().loadWorkoutHistory(),
                get().loadPersonalRecords(),
                get().loadNutrition(),
                get().loadFinancial(),
              ]).catch((err) => {
                console.error(
                  "[loadAll] Erro ao carregar dados adicionais:",
                  err
                );
              });

              set((state) => ({
                data: {
                  ...state.data,
                  metadata: {
                    ...state.data.metadata,
                    isLoading: false,
                    isInitialized: true,
                    lastSync: new Date(),
                    errors: {
                      loadAll: "Timeout - dados carregados incrementalmente",
                    },
                  },
                },
              }));

              return;
            } catch (incrementalError) {
              console.error(
                "[loadAll] Erro no carregamento incremental:",
                incrementalError
              );
            }
          }

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

      // === CARREGAMENTO PRIORITIZADO ===
      loadAllPrioritized: async (
        priorities: StudentDataSection[],
        onlyPriorities: boolean = false
      ) => {
        const currentState = get();

        // Evitar múltiplas chamadas simultâneas se já está carregando tudo
        // Mas permitir se for apenas prioridades específicas
        if (currentState.data.metadata.isLoading && !onlyPriorities) {
          console.log("[loadAllPrioritized] Já está carregando, aguardando...");
          return;
        }

        try {
          // FASE 1: Carregar seções prioritárias (em paralelo)
          // Atualiza store incrementalmente conforme cada uma carrega
          console.log(
            `[loadAllPrioritized] Carregando prioridades: ${priorities.join(
              ", "
            )}`
          );

          await loadSectionsIncremental(set, priorities);

          // Se onlyPriorities for true (padrão), só carrega as prioridades
          // Isso evita recarregar tudo quando navegar entre páginas
          if (onlyPriorities) {
            console.log(
              "[loadAllPrioritized] Apenas prioridades solicitadas, finalizando."
            );
            return;
          }

          // FASE 2: Carregar resto das seções em background (apenas se onlyPriorities = false)
          // Isso só acontece quando explicitamente solicitado
          const allSections: StudentDataSection[] = [
            "user",
            "student",
            "progress",
            "units",
            "profile",
            "weightHistory",
            "workoutHistory",
            "personalRecords",
            "subscription",
            "memberships",
            "payments",
            "paymentMethods",
            "dayPasses",
            "friends",
            "gymLocations",
            "dailyNutrition",
          ];

          const remainingSections = allSections.filter(
            (section) => !priorities.includes(section)
          );

          if (remainingSections.length > 0) {
            console.log(
              `[loadAllPrioritized] FASE 2: Carregando resto em background: ${remainingSections.join(
                ", "
              )}`
            );

            // Carregar em background sem bloquear (não aguardar)
            loadSectionsIncremental(set, remainingSections).catch((error) => {
              console.warn(
                "[loadAllPrioritized] Erro ao carregar seções restantes:",
                error
              );
            });
          }
        } catch (error: any) {
          console.error(
            "[loadAllPrioritized] Erro ao carregar prioridades:",
            error
          );
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
          console.error("[loadEssential] Erro:", error);
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
          console.error("[loadStudentCore] Erro:", error);
        }
      },

      loadFinancial: async () => {
        // Carrega dados financeiros (Subscription + Payments)
        try {
          await Promise.all([
            get().loadSubscription(),
            get().loadPayments(),
            get().loadMemberships(),
            get().loadPaymentMethods(),
            get().loadDayPasses(),
          ]);
        } catch (error) {
          console.error("[loadFinancial] Erro:", error);
        }
      },

      // === MÉTODOS INDIVIDUAIS (Mantidos para compatibilidade) ===
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
        const newWeightHistory = section.weightHistory || [];

        set((state) => {
          // Calcular weightGain
          const weightGain = calculateWeightGain(
            newWeightHistory.length > 0
              ? newWeightHistory
              : state.data.weightHistory
          );

          // Atualizar currentWeight no profile se não existir
          const currentWeight =
            newWeightHistory.length > 0
              ? newWeightHistory[0].weight
              : state.data.profile?.weight;

          return {
            data: {
              ...state.data,
              weightHistory:
                newWeightHistory.length > 0
                  ? newWeightHistory
                  : state.data.weightHistory,
              weightGain: weightGain ?? state.data.weightGain,
              profile: {
                ...state.data.profile,
                weight: currentWeight ?? state.data.profile?.weight,
              },
            },
          };
        });
      },

      loadWorkouts: async () => {
        const currentState = get();

        // Evitar múltiplas chamadas simultâneas
        // Se já está carregando (via loadAll), não fazer nada
        if (currentState.data.metadata.isLoading) {
          return;
        }

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
        // IMPORTANTE: Usar loadSection para aproveitar sistema de deduplicação
        // Isso evita requisições duplicadas quando useLoadPrioritized também está carregando
        const sectionData = await loadSection("dailyNutrition");

        if (sectionData && sectionData.dailyNutrition) {
          // Atualizar store com os dados carregados
          // loadSection já atualiza o store via updateStoreWithSection em loadSectionsIncremental
          // Mas garantimos aqui também para manter compatibilidade
          set((state) => ({
            data: {
              ...state.data,
              dailyNutrition: sectionData.dailyNutrition!,
            },
          }));
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

        // Log comando para observabilidade
        await logCommand(command);

        // Migrar comando se necessário (para versões antigas)
        const migratedCommand = migrateCommand(command);

        // Sync with backend usando syncManager (gerencia offline/online automaticamente)
        try {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("auth_token")
              : null;

          const options = commandToSyncManager(
            migratedCommand,
            "/api/students/progress",
            "PUT",
            token ? { Authorization: `Bearer ${token}` } : {}
          );

          const result = await syncManager({
            ...options,
            priority: "high",
            commandId: migratedCommand.id, // Adicionar commandId para observabilidade
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
                    (action) =>
                      action.type !== "UPDATE_PROGRESS" ||
                      action.id !== command.id
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
                    updateProgress:
                      error.message || "Erro ao atualizar progresso",
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

        // Sync with backend usando syncManager
        try {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("auth_token")
              : null;

          const result = await syncManager({
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
        const newWeightHistory = [newEntry, ...get().data.weightHistory];

        set((state) => {
          // Recalcular weightGain após adicionar novo peso
          const newWeightGain = calculateWeightGain(newWeightHistory);

          return {
            data: {
              ...state.data,
              weightHistory: newWeightHistory,
              weightGain: newWeightGain ?? state.data.weightGain,
              profile: {
                ...state.data.profile,
                weight,
              },
            },
          };
        });

        // Sync with backend usando syncManager
        try {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("auth_token")
              : null;

          const result = await syncManager({
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

          // Se online e sucesso, atualizar weightHistory localmente (já foi feito optimistic update)
          // Não precisa recarregar do servidor, o optimistic update já está correto
          // await get().loadWeightHistory(); // Removido para evitar requisições desnecessárias
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
          // IMPORTANTE: Calcular apenas refeições completadas (completed: true)
          let calculatedTotals = {};
          if (updates.meals !== undefined) {
            const completedMeals = updatedMeals.filter((meal: any) => meal.completed === true);
            const totalCalories = completedMeals.reduce(
              (sum: number, meal: any) => sum + (meal.calories || 0),
              0
            );
            const totalProtein = completedMeals.reduce(
              (sum: number, meal: any) => sum + (meal.protein || 0),
              0
            );
            const totalCarbs = completedMeals.reduce(
              (sum: number, meal: any) => sum + (meal.carbs || 0),
              0
            );
            const totalFats = completedMeals.reduce(
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

          // Remover duplicatas se meals foram atualizados
          const finalMeals =
            updates.meals !== undefined
              ? deduplicateMeals(updatedMeals)
              : currentNutrition.meals;

          updatedNutrition = {
            ...currentNutrition,
            ...updates,
            meals: finalMeals, // Usar meals sem duplicatas
            ...calculatedTotals, // Sobrescrever totais calculados se meals foram atualizados
          };

          return {
            data: {
              ...state.data,
              dailyNutrition: updatedNutrition,
            },
          };
        });

        // Sync with backend usando syncManager
        try {
          // Formatar dados para API (formato esperado: { date, meals?, waterIntake })
          // Normalizar data para formato YYYY-MM-DD (string) ou ISO string
          let normalizedDate: string;
          if (updatedNutrition.date) {
            // Se já é uma string YYYY-MM-DD, usar direto
            if (
              typeof updatedNutrition.date === "string" &&
              /^\d{4}-\d{2}-\d{2}$/.test(updatedNutrition.date)
            ) {
              normalizedDate = updatedNutrition.date;
            } else {
              // Se é ISO string ou Date, converter para YYYY-MM-DD
              const dateObj = new Date(updatedNutrition.date);
              normalizedDate = dateObj.toISOString().split("T")[0];
            }
          } else {
            normalizedDate = new Date().toISOString().split("T")[0];
          }

          // Determinar o que foi atualizado
          const hasMealsUpdate = updates.meals !== undefined;
          const hasWaterIntakeUpdate = updates.waterIntake !== undefined;

          // Construir payload apenas com o que foi atualizado
          const apiPayload: any = {
            date: normalizedDate,
          };

          // Só incluir meals se meals foi explicitamente atualizado
          // Isso evita deletar todas as refeições quando apenas waterIntake é atualizado
          if (hasMealsUpdate) {
            apiPayload.meals = (updatedNutrition.meals || []).map(
              (meal: any, index: number) => ({
                name: meal.name || "Refeição",
                type: meal.type || "snack",
                calories: meal.calories || 0,
                protein: meal.protein || 0,
                carbs: meal.carbs || 0,
                fats: meal.fats || 0,
                time: meal.time || null,
                completed: meal.completed || false,
                order: index,
                foods: (meal.foods || []).map((food: any) => ({
                  foodId: food.foodId || null,
                  foodName: food.foodName || "Alimento",
                  servings: food.servings || 1,
                  calories: food.calories || 0,
                  protein: food.protein || 0,
                  carbs: food.carbs || 0,
                  fats: food.fats || 0,
                  servingSize: food.servingSize || "100g",
                })),
              })
            );
          }

          // Só incluir waterIntake se foi explicitamente atualizado
          if (hasWaterIntakeUpdate) {
            apiPayload.waterIntake = updatedNutrition.waterIntake || 0;
          }

          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("auth_token")
              : null;

          // Gerar idempotencyKey explicitamente para evitar avisos
          const idempotencyKey = generateIdempotencyKey();

          const result = await syncManager({
            url: "/api/nutrition/daily",
            method: "POST",
            body: apiPayload,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            priority: "normal",
            idempotencyKey,
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

          // Se sincronizado com sucesso, recarregar dados do servidor
          // para garantir que o store está sincronizado com o backend
          // (o backend pode ter processado/validado os dados de forma diferente)
          if (result.success && !result.queued) {
            try {
              // Recarregar nutrição do servidor para garantir sincronização
              await get().loadNutrition();
              console.log(
                "[updateNutrition] ✅ Dados recarregados do servidor após atualização"
              );
            } catch (reloadError) {
              console.warn(
                "[updateNutrition] ⚠️ Erro ao recarregar dados após atualização:",
                reloadError
              );
              // Não falhar a operação se o reload falhar - optimistic update já foi aplicado
            }
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
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          console.log(
            "📡 Ainda offline - ações pendentes serão sincronizadas quando voltar online"
          );
          return;
        }

        console.log(
          `🔄 Sincronizando ${pendingActions.length} ação(ões) pendente(s)...`
        );

        // Tentar sincronizar cada ação pendente
        // Nota: A sincronização real acontece automaticamente via syncManager
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
      storage: createIndexedDBStorage() as any, // Usa IndexedDB ao invés de localStorage (suporta dados grandes)
      partialize: (state) =>
        ({
          data: state.data, // Persistir apenas os dados, não as actions
        } as any),
      // Migra dados do localStorage para IndexedDB na primeira vez
      onRehydrateStorage: () => {
        return async (state) => {
          if (typeof window !== "undefined" && state) {
            await migrateFromLocalStorage("student-unified-storage");
          }
        };
      },
    }
  )
);
