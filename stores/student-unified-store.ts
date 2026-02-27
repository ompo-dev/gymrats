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
import { getAuthToken } from "@/lib/auth/token-client";
import { apiClient } from "@/lib/api/client";
import { logCommand } from "@/lib/offline/command-logger";
import { migrateCommand } from "@/lib/offline/command-migrations";
import {
	commandToSyncManager,
	createCommand,
} from "@/lib/offline/command-pattern";
import {
	createIndexedDBStorage,
	migrateFromLocalStorage,
} from "@/lib/offline/indexeddb-storage";
import { addPendingAction } from "@/lib/offline/pending-actions";
import {
	generateIdempotencyKey,
	syncManager,
} from "@/lib/offline/sync-manager";
import type {
	DailyNutrition,
	DifficultyLevel,
	Meal,
	MuscleGroup,
	PersonalRecord,
	Unit,
	UserProgress,
	WorkoutExercise,
	WorkoutSession,
	WorkoutType,
} from "@/lib/types";
import type {
	StudentData,
	StudentDataSection,
	WeightHistoryItem,
	WorkoutCompletionData,
} from "@/lib/types/student-unified";
import { initialStudentData } from "@/lib/types/student-unified";
import { getBrazilNutritionDateKey } from "@/lib/utils/brazil-nutrition-date";
import {
	calculateWeightGain,
	deduplicateMeals,
	loadAllDataIncremental,
	loadSection,
	loadSectionsIncremental,
} from "./student/load-helpers";

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
	loadGymLocationsWithPosition: (lat: number, lng: number) => Promise<void>;
	loadFoodDatabase: () => Promise<void>;

	// === ACTIONS - ATUALIZAR DADOS ===
	updateProgress: (progress: Partial<UserProgress>) => Promise<void>;
	updateProfile: (profile: Partial<StudentData["profile"]>) => Promise<void>;
	addWeight: (weight: number, date?: Date, notes?: string) => Promise<void>;
	completeWorkout: (data: WorkoutCompletionData) => Promise<void>;
	addPersonalRecord: (record: PersonalRecord) => void;
	updateNutrition: (nutrition: Partial<DailyNutrition>) => Promise<void>;
	updateSubscription: (
		subscription: Partial<StudentData["subscription"]> | null,
	) => Promise<void>;
	addDayPass: (dayPass: StudentData["dayPasses"][0]) => void;

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
	}) => Promise<string>; // Retorna o ID do workout criado (temporário ou real)
	updateWorkout: (workoutId: string, data: Partial<{ title?: string; description?: string; muscleGroup?: string; difficulty?: string; [key: string]: string | number | boolean | object | null }>) => Promise<void>;
	deleteWorkout: (workoutId: string) => Promise<void>;
	addWorkoutExercise: (workoutId: string, data: { educationalId?: string; name?: string; [key: string]: string | number | boolean | object | null }) => Promise<void>;
	updateWorkoutExercise: (exerciseId: string, data: Partial<import("@/lib/types").WorkoutExercise>) => Promise<void>;
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
	syncPendingActions: () => Promise<void>; // Sincroniza ações pendentes

	// === ACTIONS - RESET ===
	reset: () => void;
	clearCache: () => void;
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
					console.error("[loadAll] Erro ao carregar dados:", error);
					const err = error as { code?: string; message?: string };
					// Se for timeout, tentar carregamento incremental como fallback
					if (
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("timeout")
					) {
						console.warn(
							"[loadAll] Timeout detectado, tentando carregamento incremental...",
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
									err,
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
								incrementalError,
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
									loadAll: (error instanceof Error ? error.message : "Erro ao carregar dados"),
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
					console.log("[loadAllPrioritized] Já está carregando, aguardando...");
					return;
				}

				try {
					// FASE 1: Carregar seções prioritárias (em paralelo)
					// Atualiza store incrementalmente conforme cada uma carrega
					console.log(
						`[loadAllPrioritized] Carregando prioridades: ${priorities.join(
							", ",
						)}`,
					);

					await loadSectionsIncremental(set, priorities);

					// Se onlyPriorities for true (padrão), só carrega as prioridades
					// Isso evita recarregar tudo quando navegar entre páginas
					if (onlyPriorities) {
						console.log(
							"[loadAllPrioritized] Apenas prioridades solicitadas, finalizando.",
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
						(section) => !priorities.includes(section),
					);

					if (remainingSections.length > 0) {
						console.log(
							`[loadAllPrioritized] FASE 2: Carregando resto em background: ${remainingSections.join(
								", ",
							)}`,
						);

						// Carregar em background sem bloquear (não aguardar)
						loadSectionsIncremental(set, remainingSections).catch((error) => {
							console.warn(
								"[loadAllPrioritized] Erro ao carregar seções restantes:",
								error,
							);
						});
					}
				} catch (error) {
					console.error(
						"[loadAllPrioritized] Erro ao carregar prioridades:",
						error,
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
							: state.data.weightHistory,
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

			loadWorkouts: async (force = false) => {
				const currentState = get();

				if (!force && currentState.data.metadata.isLoading) {
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

			loadWeeklyPlan: async (force = false) => {
				const currentState = get();

				if (!force && currentState.data.metadata.isLoading) {
					return;
				}

				// force=true: bypassa deduplicação para garantir dados frescos (ex: após week-reset)
				const section = await loadSection("weeklyPlan", force);
				set((state) => ({
					data: {
						...state.data,
						weeklyPlan: section.weeklyPlan ?? state.data.weeklyPlan,
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

				if (sectionData?.dailyNutrition) {
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

			loadGymLocationsWithPosition: async (lat: number, lng: number) => {
				try {
					const response = await apiClient.get<{
						gyms?: import("@/lib/types").GymLocation[];
						gymLocations?: import("@/lib/types").GymLocation[];
					}>("/api/gyms/locations", {
						params: { lat: String(lat), lng: String(lng) },
						timeout: 30000,
					});
					const data = response.data;
					const gymLocations = Array.isArray(data)
						? data
						: data.gymLocations || data.gyms || [];
					set((state) => ({
						data: { ...state.data, gymLocations },
					}));
				} catch (error) {
					if (process.env.NODE_ENV === "development") {
						console.warn("[loadGymLocationsWithPosition] Erro:", error);
					}
				}
			},

			loadFoodDatabase: async () => {
				try {
					// Buscar todos os alimentos da API (sem query para pegar todos)
					const response = await apiClient.get<{ foods: import("@/lib/types").FoodItem[] }>(
						"/api/foods/search?limit=1000",
						{
							timeout: 30000, // 30 segundos
						},
					);

					const foods = response.data.foods || [];

					// Armazenar no store
					set((state) => ({
						data: {
							...state.data,
							foodDatabase: foods,
						},
					}));
				} catch (error) {
					// Tratamento específico para timeout
					const err = error as { code?: string; message?: string; response?: { status?: number } };
					if (
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("timeout")
					) {
						console.warn(
							"⚠️ Timeout ao carregar alimentos. Continuando com dados existentes.",
						);
						return;
					}

					// Se a tabela não existir, não mostrar erro
					if (
						err?.response?.status === 500 ||
						err?.message?.includes("does not exist")
					) {
						console.log(
							"⚠️ Tabela de alimentos não existe. Execute: node scripts/apply-nutrition-migration.js",
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
							? getAuthToken()
							: null;

					const options = commandToSyncManager(
						migratedCommand,
						"/api/students/progress",
						"PUT",
						token ? { Authorization: `Bearer ${token}` } : {},
					);

					const result = await syncManager({
						...options,
						priority: "high",
						commandId: migratedCommand.id, // Adicionar commandId para observabilidade
						idempotencyKey:
							options.idempotencyKey || migratedCommand.meta.idempotencyKey,
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
										},
									),
								},
							},
						}));
						console.log(
							"✅ Progresso salvo offline. Sincronizará quando online.",
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
											action.id !== command.id,
									),
								},
							},
						}));
					}
				} catch (error) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const err = error as { code?: string; message?: string };
					const isNetworkError =
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("Network Error") ||
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
										},
									),
								},
							},
						}));
						console.log(
							"📡 Offline - Progresso será sincronizado quando voltar online",
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
											(error instanceof Error ? error.message : "Erro ao atualizar progresso"),
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
							? getAuthToken()
							: null;

					// Gerar idempotencyKey explicitamente para evitar avisos
					const idempotencyKey = generateIdempotencyKey();

					const result = await syncManager({
						url: "/api/students/profile",
						method: "POST",
						body: updates,
						headers: token ? { Authorization: `Bearer ${token}` } : {},
						priority: "normal",
						idempotencyKey,
					});

					if (!result.success && result.error) {
						throw result.error;
					}

					if (result.queued) {
						console.log("✅ Perfil salvo offline. Sincronizará quando online.");
						return;
					}
				} catch (error) {
					const err = error as { code?: string; message?: string };
					const isNetworkError =
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("Network Error") ||
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
							? getAuthToken()
							: null;

					// Gerar idempotencyKey explicitamente para evitar avisos
					const idempotencyKey = generateIdempotencyKey();

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
						idempotencyKey,
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
				} catch (error) {
					const err = error as { code?: string; message?: string };
					const isNetworkError =
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("Network Error") ||
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
						new CustomEvent("workoutCompleted", { detail: { workoutId: data.workoutId } }),
					);
				}
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
				let updatedNutrition: DailyNutrition | undefined;
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
						const completedMeals = updatedMeals.filter(
							(meal: Meal) => meal.completed === true,
						);
						const totalCalories = completedMeals.reduce(
							(sum: number, meal: Meal) => sum + (meal.calories || 0),
							0,
						);
						const totalProtein = completedMeals.reduce(
							(sum: number, meal: Meal) => sum + (meal.protein || 0),
							0,
						);
						const totalCarbs = completedMeals.reduce(
							(sum: number, meal: Meal) => sum + (meal.carbs || 0),
							0,
						);
						const totalFats = completedMeals.reduce(
							(sum: number, meal: Meal) => sum + (meal.fats || 0),
							0,
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
					// Normalizar data para dateKey Brasil (reset às 03:00 BRT)
					let normalizedDate: string;
					try {
						normalizedDate = getBrazilNutritionDateKey(updatedNutrition.date);
					} catch {
						normalizedDate = getBrazilNutritionDateKey();
					}

					// Determinar o que foi atualizado
					const hasMealsUpdate = updates.meals !== undefined;
					const hasWaterIntakeUpdate = updates.waterIntake !== undefined;

					// Construir payload apenas com o que foi atualizado
					const apiPayload: {
						date: string;
						meals?: Array<{
							id?: string;
							name: string;
							calories: number;
							protein: number;
							carbs: number;
							fats: number;
							completed?: boolean;
							type: string;
							foods: Array<{ foodId: string; foodName: string; servings: number; calories: number; protein: number; carbs: number; fats: number; servingSize: string }>;
						}>;
					} = {
						date: normalizedDate,
					};

					// Só incluir meals se meals foi explicitamente atualizado
					// Isso evita deletar todas as refeições quando apenas waterIntake é atualizado
					if (hasMealsUpdate) {
						apiPayload.meals = (updatedNutrition.meals || []).map(
							(meal: Meal, index: number) => ({
								name: meal.name || "Refeição",
								type: meal.type || "snack",
								calories: meal.calories || 0,
								protein: meal.protein || 0,
								carbs: meal.carbs || 0,
								fats: meal.fats || 0,
								time: meal.time || null,
								completed: meal.completed || false,
								order: index,
								foods: (meal.foods || []).map((food: import("@/lib/types").MealFoodItem) => ({
									foodId: food.foodId || null,
									foodName: food.foodName || "Alimento",
									servings: food.servings || 1,
									calories: food.calories || 0,
									protein: food.protein || 0,
									carbs: food.carbs || 0,
									fats: food.fats || 0,
									servingSize: food.servingSize || "100g",
								})),
							}),
						);
					}

					// Só incluir waterIntake se foi explicitamente atualizado
					if (hasWaterIntakeUpdate) {
						apiPayload.waterIntake = updatedNutrition.waterIntake || 0;
					}

					const token =
						typeof window !== "undefined"
							? getAuthToken()
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
							"✅ Nutrição salva offline. Sincronizará quando online.",
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
								"[updateNutrition] ✅ Dados recarregados do servidor após atualização",
							);
						} catch (reloadError) {
							console.warn(
								"[updateNutrition] ⚠️ Erro ao recarregar dados após atualização:",
								reloadError,
							);
							// Não falhar a operação se o reload falhar - optimistic update já foi aplicado
						}
					}
				} catch (error) {
					// Se a migration não foi aplicada, não mostrar erro
					const err = error as {
						response?: { data?: { code?: string } };
						code?: string;
						message?: string;
					};
					if (err?.response?.data?.code === "MIGRATION_REQUIRED") {
						console.log(
							"⚠️ Tabela de nutrição não existe. Execute: node scripts/apply-nutrition-migration.js",
						);
						return;
					}

					const isNetworkError =
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("Network Error") ||
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
						subscription: updates
							? { ...(state.data.subscription || {}), ...updates } as StudentData["subscription"]
							: null,
					},
				}));
			},

			createUnit: async (data) => {
				const command = createCommand("CREATE_UNIT", data);
				await logCommand(command);

				const currentState = get();
				const newUnit: Unit = {
					id: command.id, // Usar command ID como ID temporário
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

				// 2. Criar command explícito
				const migratedCommand = migrateCommand(command);

				// 3. Sync with backend usando syncManager
				try {
					const token =
						typeof window !== "undefined"
							? getAuthToken()
							: null;

					const options = commandToSyncManager(
						migratedCommand,
						"/api/workouts/units",
						"POST",
						token ? { Authorization: `Bearer ${token}` } : {},
					);

					const result = await syncManager({
						...options,
						priority: "high",
						commandId: migratedCommand.id,
						idempotencyKey:
							options.idempotencyKey || migratedCommand.meta.idempotencyKey,
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
											type: "CREATE_UNIT",
											queueId: result.queueId,
											retries: 0,
										},
									),
								},
							},
						}));
						console.log("✅ Unit criada offline. Sincronizará quando online.");
						return;
					}

					// Se sincronizado com sucesso, atualizar ID temporário com ID real da resposta
					if (result.success && !result.queued && result.data?.id) {
						const realId = result.data.id;
						// Atualizar apenas o ID temporário com o ID real (não recarregar tudo!)
						set((state) => ({
							data: {
								...state.data,
								units: state.data.units.map((u) =>
									u.id === command.id ? { ...u, id: realId } : u,
								),
							},
						}));
					}
					// Remover de pendentes se existir
					if (result.success && !result.queued) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: state.data.metadata.pendingActions.filter(
										(action) =>
											action.type !== "CREATE_UNIT" || action.id !== command.id,
									),
								},
							},
						}));
					}
				} catch (error) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const err = error as { code?: string; message?: string };
					const isNetworkError =
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("Network Error") ||
						!navigator.onLine;

					if (isNetworkError) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: addPendingAction(
										state.data.metadata.pendingActions,
										{
											type: "CREATE_UNIT",
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"📡 Offline - Unit será sincronizada quando voltar online",
						);
					} else {
						// Erro não é de rede - pode ser validação, etc
						console.error("Erro ao criar unit:", error);
						// Reverter optimistic update apenas em caso de erro de validação
						set((state) => ({
							data: {
								...state.data,
								units: state.data.units.filter((u) => u.id !== command.id),
							},
						}));
					}
				}
			},

			updateUnit: async (unitId, data) => {
				// 1. Optimistic update - atualiza UI imediatamente
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

				// 2. Criar command explícito
				const command = createCommand("UPDATE_UNIT", { unitId, ...data });
				await logCommand(command);
				const migratedCommand = migrateCommand(command);

				// 3. Sync with backend usando syncManager
				try {
					const token =
						typeof window !== "undefined"
							? getAuthToken()
							: null;

					const options = commandToSyncManager(
						migratedCommand,
						`/api/workouts/units/${unitId}`,
						"PUT",
						token ? { Authorization: `Bearer ${token}` } : {},
					);

					const result = await syncManager({
						...options,
						priority: "high",
						commandId: migratedCommand.id,
						idempotencyKey:
							options.idempotencyKey || migratedCommand.meta.idempotencyKey,
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
											type: "UPDATE_UNIT",
											queueId: result.queueId,
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"✅ Unit atualizada offline. Sincronizará quando online.",
						);
						return;
					}

					// Se sincronizado com sucesso, apenas remover de pendentes (não recarregar!)
					if (result.success && !result.queued) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: state.data.metadata.pendingActions.filter(
										(action) =>
											action.type !== "UPDATE_UNIT" || action.id !== command.id,
									),
								},
							},
						}));
					}
				} catch (error) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const err = error as { code?: string; message?: string };
					const isNetworkError =
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("Network Error") ||
						!navigator.onLine;

					if (isNetworkError) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: addPendingAction(
										state.data.metadata.pendingActions,
										{
											type: "UPDATE_UNIT",
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"📡 Offline - Unit será sincronizada quando voltar online",
						);
					} else {
						// Erro não é de rede - reverter optimistic update
						console.error("Erro ao atualizar unit:", error);
						set((state) => ({
							data: {
								...state.data,
								units: previousUnits,
							},
						}));
					}
				}
			},

			deleteUnit: async (unitId) => {
				// 1. Optimistic update - remove da UI imediatamente
				const previousUnits = get().data.units;
				const unitToDelete = previousUnits.find((u) => u.id === unitId);

				set((state) => ({
					data: {
						...state.data,
						units: state.data.units.filter((unit) => unit.id !== unitId),
					},
				}));

				// 2. Criar command explícito
				const command = createCommand("DELETE_UNIT", { unitId });
				await logCommand(command);
				const migratedCommand = migrateCommand(command);

				// 3. Sync with backend usando syncManager
				try {
					const token =
						typeof window !== "undefined"
							? getAuthToken()
							: null;

					const options = commandToSyncManager(
						migratedCommand,
						`/api/workouts/units/${unitId}`,
						"DELETE",
						token ? { Authorization: `Bearer ${token}` } : {},
					);

					const result = await syncManager({
						...options,
						priority: "high",
						commandId: migratedCommand.id,
						idempotencyKey:
							options.idempotencyKey || migratedCommand.meta.idempotencyKey,
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
											type: "DELETE_UNIT",
											queueId: result.queueId,
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"✅ Unit deletada offline. Sincronizará quando online.",
						);
						return;
					}

					// Se sincronizado com sucesso, apenas remover de pendentes (não recarregar!)
					if (result.success && !result.queued) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: state.data.metadata.pendingActions.filter(
										(action) =>
											action.type !== "DELETE_UNIT" || action.id !== command.id,
									),
								},
							},
						}));
					}
				} catch (error) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const err = error as { code?: string; message?: string };
					const isNetworkError =
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("Network Error") ||
						!navigator.onLine;

					if (isNetworkError) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: addPendingAction(
										state.data.metadata.pendingActions,
										{
											type: "DELETE_UNIT",
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"📡 Offline - Unit será sincronizada quando voltar online",
						);
					} else {
						// Erro não é de rede - reverter optimistic update
						console.error("Erro ao deletar unit:", error);
						if (unitToDelete) {
							set((state) => ({
								data: {
									...state.data,
									units: [...state.data.units, unitToDelete],
								},
							}));
						}
					}
				}
			},

			createWorkout: async (data) => {
				// 1. Criar command primeiro (para ter o ID temporário)
				const command = createCommand("CREATE_WORKOUT", data);

				// 2. Optimistic update PRIMEIRO - atualiza UI imediatamente (antes de qualquer await!)
				const currentState = get();
				const unit = currentState.data.units.find((u) => u.id === data.unitId);
				if (!unit) {
					throw new Error("Unit não encontrada");
				}

				const newWorkout: WorkoutSession = {
					id: command.id, // Usar command ID como ID temporário
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

				// Optimistic update IMEDIATO - não espera nada!
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

				// 3. Log command (para observabilidade)
				await logCommand(command);

				// 4. Migrar command (versionamento)
				const migratedCommand = migrateCommand(command);

				// 5. Sync with backend usando syncManager
				try {
					const token =
						typeof window !== "undefined"
							? getAuthToken()
							: null;

					const options = commandToSyncManager(
						migratedCommand,
						"/api/workouts/manage",
						"POST",
						token ? { Authorization: `Bearer ${token}` } : {},
					);

					const result = await syncManager({
						...options,
						priority: "high",
						commandId: migratedCommand.id,
						idempotencyKey:
							options.idempotencyKey || migratedCommand.meta.idempotencyKey,
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
											type: "CREATE_WORKOUT",
											queueId: result.queueId,
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"✅ Workout criado offline. Sincronizará quando online.",
						);
						return command.id; // Retornar ID temporário
					}

					// Se sincronizado com sucesso, atualizar ID temporário com ID real da resposta
					// A resposta vem como { success: true, data: { data: workout, message: "..." } }
					// ou { success: true, data: workout } dependendo da estrutura
					const workoutData = result.data?.data || result.data;
					if (result.success && !result.queued && workoutData?.id) {
						const realId = workoutData.id;
						// Atualizar apenas o ID temporário com o ID real (não recarregar tudo!)
						set((state) => ({
							data: {
								...state.data,
								units: state.data.units.map((u) =>
									u.id === data.unitId
										? {
												...u,
												workouts: u.workouts.map((w) =>
													w.id === command.id ? { ...w, id: realId } : w,
												),
											}
										: u,
								),
							},
						}));
						// Remover de pendentes se existir
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: state.data.metadata.pendingActions.filter(
										(action) =>
											action.type !== "CREATE_WORKOUT" ||
											action.id !== command.id,
									),
								},
							},
						}));
						return realId; // Retornar ID real
					} else if (result.success && !result.queued) {
						// Se não tem ID na resposta, apenas remover de pendentes
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: state.data.metadata.pendingActions.filter(
										(action) =>
											action.type !== "CREATE_WORKOUT" ||
											action.id !== command.id,
									),
								},
							},
						}));
						return command.id; // Retornar ID temporário se não houver ID real
					}

					return command.id; // Retornar ID temporário por padrão
				} catch (error) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const err = error as { code?: string; message?: string };
					const isNetworkError =
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("Network Error") ||
						!navigator.onLine;

					if (isNetworkError) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: addPendingAction(
										state.data.metadata.pendingActions,
										{
											type: "CREATE_WORKOUT",
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"📡 Offline - Workout será sincronizado quando voltar online",
						);
						return command.id; // Retornar ID temporário mesmo em caso de erro de rede
					} else {
						// Erro não é de rede - reverter optimistic update
						console.error("Erro ao criar workout:", error);
						set((state) => ({
							data: {
								...state.data,
								units: state.data.units.map((u) =>
									u.id === data.unitId
										? {
												...u,
												workouts: u.workouts.filter((w) => w.id !== command.id),
											}
										: u,
								),
							},
						}));
						throw error; // Re-lançar erro para o componente tratar
					}
				}
			},

			updateWorkout: async (workoutId, data) => {
				// 1. Optimistic update - atualiza UI imediatamente
				const previousUnits = get().data.units;
				set((state) => ({
					data: {
						...state.data,
						units: state.data.units.map((unit) => ({
							...unit,
							workouts: unit.workouts.map((workout) =>
								workout.id === workoutId ? { ...workout, ...data } : workout,
							),
						})),
					},
				}));

				// 2. Criar command explícito
				const command = createCommand("UPDATE_WORKOUT", { workoutId, ...data });
				await logCommand(command);
				const migratedCommand = migrateCommand(command);

				// 3. Sync with backend usando syncManager
				try {
					const token =
						typeof window !== "undefined"
							? getAuthToken()
							: null;

					const options = commandToSyncManager(
						migratedCommand,
						`/api/workouts/manage/${workoutId}`,
						"PUT",
						token ? { Authorization: `Bearer ${token}` } : {},
					);

					const result = await syncManager({
						...options,
						priority: "high",
						commandId: migratedCommand.id,
						idempotencyKey:
							options.idempotencyKey || migratedCommand.meta.idempotencyKey,
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
											type: "UPDATE_WORKOUT",
											queueId: result.queueId,
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"✅ Workout atualizado offline. Sincronizará quando online.",
						);
						return;
					}

					// Se sincronizado com sucesso, apenas remover de pendentes (não recarregar!)
					if (result.success && !result.queued) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: state.data.metadata.pendingActions.filter(
										(action) =>
											action.type !== "UPDATE_WORKOUT" ||
											action.id !== command.id,
									),
								},
							},
						}));
					}
				} catch (error) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const err = error as { code?: string; message?: string };
					const isNetworkError =
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("Network Error") ||
						!navigator.onLine;

					if (isNetworkError) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: addPendingAction(
										state.data.metadata.pendingActions,
										{
											type: "UPDATE_WORKOUT",
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"📡 Offline - Workout será sincronizado quando voltar online",
						);
					} else {
						// Erro não é de rede - reverter optimistic update
						console.error("Erro ao atualizar workout:", error);
						set((state) => ({
							data: {
								...state.data,
								units: previousUnits,
							},
						}));
					}
				}
			},

			deleteWorkout: async (workoutId) => {
				// 1. Optimistic update - remove da UI imediatamente
				const previousUnits = get().data.units;
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
					},
				}));

				// 2. Criar command explícito
				const command = createCommand("DELETE_WORKOUT", { workoutId });
				await logCommand(command);
				const migratedCommand = migrateCommand(command);

				// 3. Sync with backend usando syncManager
				try {
					const token =
						typeof window !== "undefined"
							? getAuthToken()
							: null;

					const options = commandToSyncManager(
						migratedCommand,
						`/api/workouts/manage/${workoutId}`,
						"DELETE",
						token ? { Authorization: `Bearer ${token}` } : {},
					);

					const result = await syncManager({
						...options,
						priority: "high",
						commandId: migratedCommand.id,
						idempotencyKey:
							options.idempotencyKey || migratedCommand.meta.idempotencyKey,
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
											type: "DELETE_WORKOUT",
											queueId: result.queueId,
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"✅ Workout deletado offline. Sincronizará quando online.",
						);
						return;
					}

					// Se sincronizado com sucesso, apenas remover de pendentes (não recarregar!)
					if (result.success && !result.queued) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: state.data.metadata.pendingActions.filter(
										(action) =>
											action.type !== "DELETE_WORKOUT" ||
											action.id !== command.id,
									),
								},
							},
						}));
					}
				} catch (error) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const err = error as { code?: string; message?: string };
					const isNetworkError =
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("Network Error") ||
						!navigator.onLine;

					if (isNetworkError) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: addPendingAction(
										state.data.metadata.pendingActions,
										{
											type: "DELETE_WORKOUT",
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"📡 Offline - Workout será sincronizado quando voltar online",
						);
					} else {
						// Erro não é de rede - reverter optimistic update
						console.error("Erro ao deletar workout:", error);
						if (workoutToDelete && unitId) {
							set((state) => ({
								data: {
									...state.data,
									units: state.data.units.map((unit) =>
										unit.id === unitId
											? {
													...unit,
													workouts: [...unit.workouts, workoutToDelete!],
												}
											: unit,
									),
								},
							}));
						}
					}
				}
			},

			addWorkoutExercise: async (workoutId, data) => {
				// 1. Criar command primeiro (para ter o ID temporário)
				const command = createCommand("ADD_WORKOUT_EXERCISE", {
					workoutId, // Pode ser temporário - será atualizado depois automaticamente
					...data,
				});

				// 2. Optimistic update PRIMEIRO - atualiza UI instantaneamente (não espera API!)
				const _currentState = get();
				let found = false;

				const newExercise: WorkoutExercise = {
					id: command.id, // Usar command ID como ID temporário
					name: data.name || "Novo Exercício",
					sets: data.sets || 3,
					reps: data.reps || "12",
					rest: data.rest || 60,
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
					order: 0, // Será calculado
				};

				// Optimistic update IMEDIATO - não espera nada!
				// IMPORTANTE: Este set() é executado ANTES de qualquer await!
				// O Zustand atualiza o store instantaneamente e componentes re-renderizam IMEDIATAMENTE
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
								if (slot.type !== "workout" || !slot.workout || slot.workout.id !== workoutId) {
									return slot;
								}
								found = true;
								const workout = slot.workout;
								const lastExercise = workout.exercises[workout.exercises.length - 1];
								const newOrder = lastExercise ? (lastExercise.order || 0) + 1 : 0;

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

				if (!found) {
					throw new Error("Workout não encontrado");
				}

				// 3. Log command (para observabilidade)
				await logCommand(command);

				// 4. Migrar command (versionamento)
				// IMPORTANTE: Se workoutId for temporário, o syncManager vai enfileirar automaticamente
				// Quando o workout for criado e tiver ID real, o syncManager vai atualizar o payload
				// usando o workflow de dependências ou retry com atualização de ID
				const migratedCommand = migrateCommand(command);

				// 6. Sync with backend usando syncManager
				try {
					const token =
						typeof window !== "undefined"
							? getAuthToken()
							: null;

					const options = commandToSyncManager(
						migratedCommand,
						"/api/workouts/exercises",
						"POST",
						token ? { Authorization: `Bearer ${token}` } : {},
					);

					const result = await syncManager({
						...options,
						priority: "high",
						commandId: migratedCommand.id,
						idempotencyKey:
							options.idempotencyKey || migratedCommand.meta.idempotencyKey,
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
											type: "ADD_WORKOUT_EXERCISE",
											queueId: result.queueId,
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"✅ Exercício adicionado offline. Sincronizará quando online.",
						);
						return;
					}

					// Se sincronizado com sucesso, atualizar exercício com TODOS os dados da resposta
					// A resposta vem como { success: true, data: { data: exercise, message: "..." } }
					// ou { success: true, data: exercise } dependendo da estrutura
					const exerciseData = result.data?.data || result.data;
					if (result.success && !result.queued && exerciseData?.id) {
						// Atualizar exercício com TODOS os dados retornados pela API
						// Isso inclui: primaryMuscles, secondaryMuscles, instructions, tips, benefits,
						// commonMistakes, equipment, difficulty, scientificEvidence, alternatives, etc.
						// IMPORTANTE: workoutId pode ser temporário ou real - buscar workout por qualquer um
						// Quando o workout for atualizado com ID real, o exercício já estará lá
						set((state) => ({
							data: {
								...state.data,
								units: state.data.units.map((unit) => ({
									...unit,
									workouts: unit.workouts.map((workout) => {
										// Buscar workout pelo ID original (pode ser temporário ou real)
										// Se o workout foi atualizado com ID real, ainda terá os exercícios criados com ID temporário
										const workoutMatches =
											workout.id === workoutId ||
											workout.exercises.some((e) => e.id === command.id);

										if (workoutMatches) {
											return {
												...workout,
												exercises: workout.exercises.map((exercise) =>
													exercise.id === command.id
														? (() => {
																// Função helper para parsear JSON com segurança
																const safeParse = (value: string | number | boolean | object | null) => {
																	if (!value) return null;
																	if (Array.isArray(value)) return value;
																	if (typeof value === "string") {
																		try {
																			return JSON.parse(value);
																		} catch {
																			return null;
																		}
																	}
																	return value;
																};

																// Substituir exercício temporário pelo exercício completo da API
																return {
																	...exerciseData,
																	// Garantir que arrays sejam parseados se vierem como JSON strings
																	primaryMuscles: safeParse(
																		exerciseData.primaryMuscles,
																	),
																	secondaryMuscles: safeParse(
																		exerciseData.secondaryMuscles,
																	),
																	equipment: safeParse(exerciseData.equipment),
																	instructions: safeParse(
																		exerciseData.instructions,
																	),
																	tips: safeParse(exerciseData.tips),
																	commonMistakes: safeParse(
																		exerciseData.commonMistakes,
																	),
																	benefits: safeParse(exerciseData.benefits),
																	// Garantir que alternatives seja um array
																	alternatives: exerciseData.alternatives || [],
																};
															})()
														: exercise,
												),
											};
										}
										return workout;
									}),
								})),
							},
						}));
						// Remover de pendentes se existir
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: state.data.metadata.pendingActions.filter(
										(action) =>
											action.type !== "ADD_WORKOUT_EXERCISE" ||
											action.id !== command.id,
									),
								},
							},
						}));
					} else if (result.success && !result.queued) {
						// Se não tem ID na resposta, apenas remover de pendentes
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: state.data.metadata.pendingActions.filter(
										(action) =>
											action.type !== "ADD_WORKOUT_EXERCISE" ||
											action.id !== command.id,
									),
								},
							},
						}));
					}
				} catch (error) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const err = error as { code?: string; message?: string };
					const isNetworkError =
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("Network Error") ||
						!navigator.onLine;

					if (isNetworkError) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: addPendingAction(
										state.data.metadata.pendingActions,
										{
											type: "ADD_WORKOUT_EXERCISE",
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"📡 Offline - Exercício será sincronizado quando voltar online",
						);
					} else {
						// Erro não é de rede - reverter optimistic update
						console.error("Erro ao adicionar exercício:", error);
						set((state) => ({
							data: {
								...state.data,
								units: state.data.units.map((unit) => ({
									...unit,
									workouts: unit.workouts.map((w) =>
										w.id === workoutId
											? {
													...w,
													exercises: w.exercises.filter(
														(e) => e.id !== command.id,
													),
												}
											: w,
									),
								})),
							},
						}));
					}
				}
			},

			updateWorkoutExercise: async (exerciseId, data) => {
				// 1. Optimistic update - atualiza UI imediatamente
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

				// 2. Criar command explícito
				const command = createCommand("UPDATE_WORKOUT_EXERCISE", {
					exerciseId,
					...data,
				});
				await logCommand(command);
				const migratedCommand = migrateCommand(command);

				// 3. Sync with backend usando syncManager
				try {
					const token =
						typeof window !== "undefined"
							? getAuthToken()
							: null;

					const options = commandToSyncManager(
						migratedCommand,
						`/api/workouts/exercises/${exerciseId}`,
						"PUT",
						token ? { Authorization: `Bearer ${token}` } : {},
					);

					const result = await syncManager({
						...options,
						priority: "high",
						commandId: migratedCommand.id,
						idempotencyKey:
							options.idempotencyKey || migratedCommand.meta.idempotencyKey,
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
											type: "UPDATE_WORKOUT_EXERCISE",
											queueId: result.queueId,
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"✅ Exercício atualizado offline. Sincronizará quando online.",
						);
						return;
					}

					// Se sincronizado com sucesso, apenas remover de pendentes (não recarregar!)
					if (result.success && !result.queued) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: state.data.metadata.pendingActions.filter(
										(action) =>
											action.type !== "UPDATE_WORKOUT_EXERCISE" ||
											action.id !== command.id,
									),
								},
							},
						}));
					}
				} catch (error) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const err = error as { code?: string; message?: string };
					const isNetworkError =
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("Network Error") ||
						!navigator.onLine;

					if (isNetworkError) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: addPendingAction(
										state.data.metadata.pendingActions,
										{
											type: "UPDATE_WORKOUT_EXERCISE",
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"📡 Offline - Exercício será sincronizado quando voltar online",
						);
					} else {
						// Erro não é de rede - reverter optimistic update
						console.error("Erro ao atualizar exercício:", error);
						set((state) => ({
							data: {
								...state.data,
								units: previousUnits,
							},
						}));
					}
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
							const ex = slot.workout.exercises.find((e) => e.id === exerciseId);
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
										exercises: slot.workout.exercises.filter((e) => e.id !== exerciseId),
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

				// 2. Criar command explícito
				const command = createCommand("DELETE_WORKOUT_EXERCISE", {
					exerciseId,
				});
				await logCommand(command);
				const migratedCommand = migrateCommand(command);

				// 3. Sync with backend usando syncManager
				try {
					const token =
						typeof window !== "undefined"
							? getAuthToken()
							: null;

					const options = commandToSyncManager(
						migratedCommand,
						`/api/workouts/exercises/${exerciseId}`,
						"DELETE",
						token ? { Authorization: `Bearer ${token}` } : {},
					);

					const result = await syncManager({
						...options,
						priority: "high",
						commandId: migratedCommand.id,
						idempotencyKey:
							options.idempotencyKey || migratedCommand.meta.idempotencyKey,
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
											type: "DELETE_WORKOUT_EXERCISE",
											queueId: result.queueId,
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"✅ Exercício deletado offline. Sincronizará quando online.",
						);
						return;
					}

					// Se sincronizado com sucesso, apenas remover de pendentes (não recarregar!)
					if (result.success && !result.queued) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: state.data.metadata.pendingActions.filter(
										(action) =>
											action.type !== "DELETE_WORKOUT_EXERCISE" ||
											action.id !== command.id,
									),
								},
							},
						}));
					}
				} catch (error) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const err = error as { code?: string; message?: string };
					const isNetworkError =
						err?.code === "ECONNABORTED" ||
						err?.message?.includes("Network Error") ||
						!navigator.onLine;

					if (isNetworkError) {
						set((state) => ({
							data: {
								...state.data,
								metadata: {
									...state.data.metadata,
									pendingActions: addPendingAction(
										state.data.metadata.pendingActions,
										{
											type: "DELETE_WORKOUT_EXERCISE",
											retries: 0,
										},
									),
								},
							},
						}));
						console.log(
							"📡 Offline - Exercício será sincronizado quando voltar online",
						);
					} else {
						// Erro não é de rede - reverter optimistic update
						console.error("Erro ao deletar exercício:", error);
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
						"📡 Ainda offline - ações pendentes serão sincronizadas quando voltar online",
					);
					return;
				}

				console.log(
					`🔄 Sincronizando ${pendingActions.length} ação(ões) pendente(s)...`,
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
								(action) => action.createdAt > oneHourAgo,
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
			storage: createIndexedDBStorage(),
			partialize: (state) =>
				({
					data: state.data, // Persistir apenas os dados, não as actions
				}),
			// Migra dados do localStorage para IndexedDB na primeira vez
			onRehydrateStorage: () => {
				return async (state) => {
					if (typeof window !== "undefined" && state) {
						await migrateFromLocalStorage("student-unified-storage");
					}
				};
			},
		},
	),
);
