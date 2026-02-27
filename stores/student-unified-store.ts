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
		subscription: Partial<StudentData["subscription"]>,
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
	updateWorkout: (workoutId: string, data: Partial<any>) => Promise<void>;
	deleteWorkout: (workoutId: string) => Promise<void>;
	addWorkoutExercise: (workoutId: string, data: any) => Promise<void>;
	updateWorkoutExercise: (exerciseId: string, data: any) => Promise<void>;
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
// HELPER FUNCTIONS
// ============================================

/**
 * Formata a data de criação do usuário para memberSince
 */
function formatMemberSince(date: Date | string | null | undefined): string {
	if (!date) return "Jan 2025";
	const d = typeof date === "string" ? new Date(date) : date;

	// Mapeamento de meses em português
	const months = [
		"Jan",
		"Fev",
		"Mar",
		"Abr",
		"Mai",
		"Jun",
		"Jul",
		"Ago",
		"Set",
		"Out",
		"Nov",
		"Dez",
	];

	const month = months[d.getMonth()];
	const year = d.getFullYear();

	return `${month} ${year}`;
}

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
	weeklyPlan: "/api/workouts/weekly-plan",
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
 *
 * @param forceRefresh - Se true, ignora deduplicação e força nova requisição (ex: após week-reset)
 */
async function loadSection(
	section: StudentDataSection,
	forceRefresh = false,
): Promise<Partial<StudentData>> {
	// Se forceRefresh, limpar cache da seção para garantir dados frescos (ex: após week-reset)
	if (forceRefresh) {
		loadingSections.delete(section);
		loadingPromises.delete(section);
	}

	// Se já está sendo carregada, retornar a promise existente
	if (loadingSections.has(section) && loadingPromises.has(section)) {
		const existingPromise = loadingPromises.get(section);
		if (existingPromise) {
			console.log(
				`[loadSection] Seção ${section} já está sendo carregada, reutilizando promise`,
			);
			return existingPromise;
		}
	}

	// Marcar como carregando e criar promise
	loadingSections.add(section);

	const loadPromise = (async () => {
		const route = SECTION_ROUTES[section]; // Declarar route dentro da função assíncrona para estar disponível no catch

		// Wrapper para capturar erros silenciosamente antes que sejam logados pelo navegador
		try {
			if (!route) {
				console.warn(`⚠️ Seção ${section} não tem rota específica mapeada`);
				return {};
			}

			// Usar rota específica (mais rápida e eficiente)
			// Capturar erro diretamente na Promise com .catch() para evitar "unhandled promise rejection"
			// Isso previne que o erro apareça no console antes de ser tratado
			const response = await apiClient
				.get<any>(route, {
					timeout: 30000, // 30 segundos para rotas específicas
				})
				.catch((error: any) => {
					// Tratar erro imediatamente aqui para evitar log no console
					const status = error?.response?.status;
					const _errorMessage =
						error?.response?.data?.error ||
						error?.message ||
						"Erro desconhecido";
					const _errorCode = error?.response?.data?.code;

					// Se o erro já foi marcado como tratado no interceptor, retornar vazio silenciosamente
					if (error._isHandled || error._isSilent) {
						return null; // Retornar null para indicar que houve erro mas foi tratado
					}

					// Tratamento específico para timeout
					if (
						error.code === "ECONNABORTED" ||
						error.message?.includes("timeout")
					) {
						if (process.env.NODE_ENV === "development") {
							console.debug(
								`⏱️ Timeout ao carregar ${section} (rota: ${route})`,
							);
						}
						return null;
					}

					// Tratamento para erros HTTP (500, 404, etc)
					if (status === 500 || status === 404) {
						// Erros esperados - não logar, apenas retornar null
						return null;
					}

					// Para outros erros HTTP, também retornar null silenciosamente
					if (status && status >= 400) {
						return null;
					}

					// Para erros não-HTTP (rede, etc), re-lançar para ser logado
					throw error;
				});

			// Se response é null, significa que houve erro mas foi tratado silenciosamente
			if (!response) {
				return {};
			}

			// Transformar resposta da rota específica para formato do store
			return transformSectionResponse(section, response.data);
		} catch (error: any) {
			// Este catch só captura erros não-HTTP (erros de rede, etc)
			// Erros HTTP já foram tratados no .catch() acima
			console.error(
				`❌ Erro não-HTTP ao carregar ${section}${route ? ` (rota: ${route})` : ""}:`,
				error,
			);
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
	data: any,
): Partial<StudentData> {
	switch (section) {
		case "user": {
			// User vem de /api/auth/session como { user: {...}, session: {...} }
			// Extrair apenas os dados do user e transformar
			const userData = data.user || data;

			// Gerar username do email se não existir
			const username =
				userData.username ||
				(userData.email
					? `@${userData.email.split("@")[0].toLowerCase()}`
					: "@usuario");

			return {
				user: {
					id: userData.id || "",
					name: userData.name || "",
					email: userData.email || "",
					username,
					memberSince:
						userData.memberSince || formatMemberSince(userData.createdAt),
					avatar: userData.avatar || userData.image,
					role: userData.role || "STUDENT",
					isAdmin: userData.role === "ADMIN" || userData.isAdmin || false,
				},
			};
		}

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

		case "weeklyPlan":
			// Weekly plan vem como { weeklyPlan: { id, title, slots }, weekStart }
			return {
				weeklyPlan: data?.weeklyPlan ?? null,
			};

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
			// Se vier no formato { success: true, subscription: ... }
			if (data && typeof data === "object" && "success" in data) {
				return { subscription: data.subscription || null };
			}
			// Se vier direto (objeto subscription ou null)
			return { subscription: data || null };

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
			// API retorna gyms ou gymLocations
			return {
				gymLocations: Array.isArray(data)
					? data
					: data.gymLocations || data.gyms || [],
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
	weightHistory: WeightHistoryItem[],
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
	_section: StudentDataSection,
	sectionData: Partial<StudentData>,
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
		if (sectionData.weeklyPlan !== undefined) {
			newState.weeklyPlan = sectionData.weeklyPlan;
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
	skipNutrition: boolean = false,
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
				error,
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

			// Normalizar data para dateKey Brasil (reset às 03:00 BRT)
			let normalizedDate: string;
			try {
				normalizedDate = getBrazilNutritionDateKey(nutritionResponseData.date);
			} catch {
				normalizedDate = getBrazilNutritionDateKey();
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
				error,
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
	_get: () => StudentUnifiedState,
): Promise<void> {
	// Seções em ordem de prioridade (mais importantes primeiro)
	// Isso permite que units, progress apareçam primeiro na tela de learn
	const sections: StudentDataSection[] = [
		"user",
		"student",
		"progress", // Importante para tela de learn
		"units", // Legado - mantido para compatibilidade
		"weeklyPlan", // Plano semanal 7 slots - usado em learn e ContinueWorkoutCard
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
				} catch (error: any) {
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
						gyms?: any[];
						gymLocations?: any[];
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
					const response = await apiClient.get<{ foods: any[] }>(
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
				} catch (error: any) {
					// Tratamento específico para timeout
					if (
						error.code === "ECONNABORTED" ||
						error.message?.includes("timeout")
					) {
						console.warn(
							"⚠️ Timeout ao carregar alimentos. Continuando com dados existentes.",
						);
						return;
					}

					// Se a tabela não existir, não mostrar erro
					if (
						error.response?.status === 500 ||
						error.message?.includes("does not exist")
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
							? localStorage.getItem("auth_token")
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
						const completedMeals = updatedMeals.filter(
							(meal: any) => meal.completed === true,
						);
						const totalCalories = completedMeals.reduce(
							(sum: number, meal: any) => sum + (meal.calories || 0),
							0,
						);
						const totalProtein = completedMeals.reduce(
							(sum: number, meal: any) => sum + (meal.protein || 0),
							0,
						);
						const totalCarbs = completedMeals.reduce(
							(sum: number, meal: any) => sum + (meal.carbs || 0),
							0,
						);
						const totalFats = completedMeals.reduce(
							(sum: number, meal: any) => sum + (meal.fats || 0),
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
							}),
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
				} catch (error: any) {
					// Se a migration não foi aplicada, não mostrar erro
					if (error.response?.data?.code === "MIGRATION_REQUIRED") {
						console.log(
							"⚠️ Tabela de nutrição não existe. Execute: node scripts/apply-nutrition-migration.js",
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
						subscription: updates 
							? { ...(state.data.subscription || {}), ...updates } as any
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
							? localStorage.getItem("auth_token")
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
				} catch (error: any) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const isNetworkError =
						error.code === "ECONNABORTED" ||
						error.message?.includes("Network Error") ||
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
							? localStorage.getItem("auth_token")
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
				} catch (error: any) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const isNetworkError =
						error.code === "ECONNABORTED" ||
						error.message?.includes("Network Error") ||
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
							? localStorage.getItem("auth_token")
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
				} catch (error: any) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const isNetworkError =
						error.code === "ECONNABORTED" ||
						error.message?.includes("Network Error") ||
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
							? localStorage.getItem("auth_token")
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
				} catch (error: any) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const isNetworkError =
						error.code === "ECONNABORTED" ||
						error.message?.includes("Network Error") ||
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
							? localStorage.getItem("auth_token")
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
				} catch (error: any) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const isNetworkError =
						error.code === "ECONNABORTED" ||
						error.message?.includes("Network Error") ||
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
							? localStorage.getItem("auth_token")
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
				} catch (error: any) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const isNetworkError =
						error.code === "ECONNABORTED" ||
						error.message?.includes("Network Error") ||
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
							? localStorage.getItem("auth_token")
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
																const safeParse = (value: any) => {
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
				} catch (error: any) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const isNetworkError =
						error.code === "ECONNABORTED" ||
						error.message?.includes("Network Error") ||
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
							? localStorage.getItem("auth_token")
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
				} catch (error: any) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const isNetworkError =
						error.code === "ECONNABORTED" ||
						error.message?.includes("Network Error") ||
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
							? localStorage.getItem("auth_token")
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
				} catch (error: any) {
					// NÃO reverter UI - marcar como pendente se for erro de rede
					const isNetworkError =
						error.code === "ECONNABORTED" ||
						error.message?.includes("Network Error") ||
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
			storage: createIndexedDBStorage() as any, // Usa IndexedDB ao invés de localStorage (suporta dados grandes)
			partialize: (state) =>
				({
					data: state.data, // Persistir apenas os dados, não as actions
				}) as any,
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
