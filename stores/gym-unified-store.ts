import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api/client";
import { logCommand } from "@/lib/offline/command-logger";
import { migrateCommand } from "@/lib/offline/command-migrations";
import {
	commandToSyncManager,
	type CommandType,
	createCommand,
} from "@/lib/offline/command-pattern";
import {
	createIndexedDBStorage,
	migrateFromLocalStorage,
} from "@/lib/offline/indexeddb-storage";
import {
	generateIdempotencyKey,
	syncManager,
} from "@/lib/offline/sync-manager";
import { normalizeGymDates } from "@/lib/utils/date-safe";
import type {
	GymDataSection,
	GymPendingAction,
	GymUnifiedData,
} from "@/lib/types/gym-unified";
import { initialGymData } from "@/lib/types/gym-unified";

const SECTION_ROUTES: Record<GymDataSection, string> = {
	profile: "/api/gyms/profile",
	stats: "/api/gyms/stats",
	students: "/api/gyms/members?status=all",
	equipment: "/api/gyms/equipment",
	financialSummary: "/api/gyms/financial-summary",
	recentCheckIns: "/api/gyms/checkins/recent",
	membershipPlans: "/api/gyms/plans",
	payments: "/api/gyms/payments",
	expenses: "/api/gyms/expenses",
	subscription: "/api/gym-subscriptions/current",
};

const loadingSections = new Set<GymDataSection>();
const loadingPromises = new Map<GymDataSection, Promise<Partial<GymUnifiedData>>>();
const GYM_COMMANDS: Record<string, CommandType> = {
	GYM_EXPENSE_CREATE: "GYM_EXPENSE_CREATE",
	GYM_PAYMENT_CREATE: "GYM_PAYMENT_CREATE",
	GYM_CHECKIN_CREATE: "GYM_CHECKIN_CREATE",
	GYM_CHECKOUT_UPDATE: "GYM_CHECKOUT_UPDATE",
	GYM_PAYMENT_STATUS_UPDATE: "GYM_PAYMENT_STATUS_UPDATE",
	GYM_MEMBERSHIP_UPDATE_STATUS: "GYM_MEMBERSHIP_UPDATE_STATUS",
	GYM_EQUIPMENT_CREATE: "GYM_EQUIPMENT_CREATE",
	GYM_EQUIPMENT_UPDATE: "GYM_EQUIPMENT_UPDATE",
	GYM_MAINTENANCE_CREATE: "GYM_MAINTENANCE_CREATE",
	GYM_PLAN_CREATE: "GYM_PLAN_CREATE",
	GYM_PLAN_UPDATE: "GYM_PLAN_UPDATE",
	GYM_PLAN_DELETE: "GYM_PLAN_DELETE",
	GYM_MEMBER_ENROLL_CREATE: "GYM_MEMBER_ENROLL_CREATE",
	GYM_SUBSCRIPTION_CREATE: "GYM_SUBSCRIPTION_CREATE",
	GYM_SUBSCRIPTION_CANCEL: "GYM_SUBSCRIPTION_CANCEL",
};

function addPendingAction(
	pendingActions: GymPendingAction[],
	action: Omit<GymPendingAction, "id" | "createdAt">,
): GymPendingAction[] {
	return [
		...pendingActions,
		{
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			createdAt: new Date(),
			...action,
		},
	];
}

function transformSectionResponse(
	section: GymDataSection,
	data: any,
): Partial<GymUnifiedData> {
	let result: Partial<GymUnifiedData>;
	switch (section) {
		case "profile":
			result = { profile: data.profile || null };
			break;
		case "stats":
			result = { stats: data.stats || null };
			break;
		case "students":
			result = { students: data.members || [] };
			break;
		case "equipment":
			result = { equipment: data.equipment || [] };
			break;
		case "financialSummary":
			result = { financialSummary: data.summary || null };
			break;
		case "recentCheckIns":
			result = { recentCheckIns: data.checkIns || [] };
			break;
		case "membershipPlans":
			result = { membershipPlans: data.plans || [] };
			break;
		case "payments":
			result = { payments: data.payments || [] };
			break;
		case "expenses":
			result = { expenses: data.expenses || [] };
			break;
		case "subscription":
			result = { subscription: data.subscription || null };
			break;
		default:
			result = {};
	}
	return normalizeGymDates(result) as Partial<GymUnifiedData>;
}

async function loadSection(section: GymDataSection): Promise<Partial<GymUnifiedData>> {
	if (loadingSections.has(section) && loadingPromises.has(section)) {
		return loadingPromises.get(section)!;
	}

	loadingSections.add(section);
	const route = SECTION_ROUTES[section];
	const promise = (async () => {
		try {
			const response = await apiClient.get(route, { timeout: 30000 });
			return transformSectionResponse(section, response.data);
		} catch (error: any) {
			const isExpectedHttp =
				error?.response?.status === 404 || error?.response?.status >= 500;
			if (!isExpectedHttp) {
				console.error(`[gym-unified] erro ao carregar ${section}:`, error);
			}
			return {};
		} finally {
			loadingSections.delete(section);
			loadingPromises.delete(section);
		}
	})();

	loadingPromises.set(section, promise);
	return promise;
}

function updateStoreWithSection(
	set: any,
	sectionData: Partial<GymUnifiedData>,
	elapsedMs?: number,
	sectionName?: GymDataSection,
) {
	set((state: GymUnifiedState) => ({
		data: {
			...state.data,
			...sectionData,
			metadata: {
				...state.data.metadata,
				telemetry:
					sectionName && elapsedMs !== undefined
						? {
								...state.data.metadata.telemetry,
								[`section:${sectionName}:ms`]: elapsedMs,
							}
						: state.data.metadata.telemetry,
			},
		},
	}));
}

async function loadSectionsIncremental(set: any, sections: GymDataSection[]) {
	await Promise.all(
		sections.map(async (section) => {
			const start = Date.now();
			const sectionData = await loadSection(section);
			if (Object.keys(sectionData).length > 0) {
				updateStoreWithSection(set, sectionData, Date.now() - start, section);
			}
		}),
	);
}

export interface GymUnifiedState {
	data: GymUnifiedData;
	loadAll: () => Promise<void>;
	loadAllPrioritized: (
		priorities: GymDataSection[],
		onlyPriorities?: boolean,
	) => Promise<void>;
	loadSection: (section: GymDataSection) => Promise<void>;
	hydrateInitial: (data: Partial<GymUnifiedData>) => void;
	createExpense: (data: {
		type: string;
		description?: string | null;
		amount: number;
		date?: string | null;
		category?: string | null;
	}) => Promise<void>;
	createPayment: (data: {
		studentId: string;
		studentName?: string;
		planId?: string | null;
		amount: number;
		dueDate: string;
		paymentMethod?: string;
		reference?: string | null;
	}) => Promise<void>;
	checkInStudent: (studentId: string) => Promise<void>;
	checkOutStudent: (checkInId: string) => Promise<void>;
	updatePaymentStatus: (
		paymentId: string,
		status: "paid" | "pending" | "overdue" | "canceled",
	) => Promise<void>;
	updateMemberStatus: (
		membershipId: string,
		status: "active" | "suspended" | "canceled",
	) => Promise<void>;
	createEquipment: (data: {
		name: string;
		type: string;
		brand?: string | null;
		model?: string | null;
		serialNumber?: string | null;
		purchaseDate?: string | null;
	}) => Promise<void>;
	updateEquipment: (
		equipmentId: string,
		data: {
			name?: string;
			type?: string;
			brand?: string | null;
			model?: string | null;
			serialNumber?: string | null;
			purchaseDate?: string | null;
			status?: "available" | "in-use" | "maintenance" | "broken";
		},
	) => Promise<void>;
	createMaintenance: (
		equipmentId: string,
		data: {
			type: string;
			description: string;
			performedBy: string;
			cost?: string | number;
			nextScheduled?: string;
		},
	) => Promise<void>;
	createMembershipPlan: (data: {
		name: string;
		type: string;
		price: number;
		duration: number;
		benefits?: string[];
	}) => Promise<void>;
	updateMembershipPlan: (
		planId: string,
		data: {
			name?: string;
			type?: string;
			price?: number;
			duration?: number;
			benefits?: string[];
		},
	) => Promise<void>;
	deleteMembershipPlan: (planId: string) => Promise<void>;
	enrollStudent: (data: {
		studentId: string;
		planId?: string | null;
		amount: number;
	}) => Promise<void>;
	createGymSubscription: (data: { billingPeriod?: "monthly" | "annual" }) => Promise<void>;
	cancelGymSubscription: () => Promise<void>;
}

export const useGymUnifiedStore = create<GymUnifiedState>()(
	persist(
		(set, get) => ({
			data: initialGymData,

			hydrateInitial: (incoming) => {
				const normalized = normalizeGymDates(incoming) as Partial<GymUnifiedData>;
				set((state) => ({
					data: {
						...state.data,
						...normalized,
						metadata: {
							...state.data.metadata,
							isInitialized: true,
							lastSync: new Date(),
						},
					},
				}));
			},

			loadAll: async () => {
				set((state) => ({
					data: {
						...state.data,
						metadata: { ...state.data.metadata, isLoading: true },
					},
				}));
				const allSections: GymDataSection[] = [
					"stats",
					"students",
					"equipment",
					"recentCheckIns",
					"financialSummary",
					"membershipPlans",
					"payments",
					"expenses",
					"subscription",
				];
				await loadSectionsIncremental(set, allSections);
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
			},

			loadAllPrioritized: async (priorities, onlyPriorities = true) => {
				await loadSectionsIncremental(set, priorities);
				if (!onlyPriorities) {
					const allSections: GymDataSection[] = [
						"stats",
						"students",
						"equipment",
						"recentCheckIns",
						"financialSummary",
						"membershipPlans",
						"payments",
						"expenses",
						"subscription",
					];
					const rest = allSections.filter((s) => !priorities.includes(s));
					loadSectionsIncremental(set, rest).catch(() => {});
				}
			},

			loadSection: async (section) => {
				const start = Date.now();
				const sectionData = await loadSection(section);
				updateStoreWithSection(set, sectionData, Date.now() - start, section);
			},

			createExpense: async (payload) => {
				const command = createCommand(GYM_COMMANDS.GYM_EXPENSE_CREATE, payload, {
					idempotencyKey: generateIdempotencyKey(),
				});
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(
					migrated,
					"/api/gyms/expenses",
					"POST",
				);
				const result = await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
				});
				if (result.queued) {
					set((state) => ({
						data: {
							...state.data,
							metadata: {
								...state.data.metadata,
								pendingActions: addPendingAction(
									state.data.metadata.pendingActions,
									{
										type: "GYM_EXPENSE_CREATE",
										retries: 0,
										queueId: result.queueId,
									},
								),
							},
						},
					}));
					return;
				}
				await get().loadSection("expenses");
				await get().loadSection("financialSummary");
			},

			createPayment: async (payload) => {
				const command = createCommand(GYM_COMMANDS.GYM_PAYMENT_CREATE, payload, {
					idempotencyKey: generateIdempotencyKey(),
				});
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(
					migrated,
					"/api/gyms/payments",
					"POST",
				);
				const result = await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
				});
				if (result.queued) {
					set((state) => ({
						data: {
							...state.data,
							metadata: {
								...state.data.metadata,
								pendingActions: addPendingAction(
									state.data.metadata.pendingActions,
									{
										type: "GYM_PAYMENT_CREATE",
										retries: 0,
										queueId: result.queueId,
									},
								),
							},
						},
					}));
					return;
				}
				await get().loadSection("payments");
				await get().loadSection("financialSummary");
			},

			checkInStudent: async (studentId) => {
				const command = createCommand(
					GYM_COMMANDS.GYM_CHECKIN_CREATE,
					{ studentId },
					{ idempotencyKey: generateIdempotencyKey() },
				);
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(
					migrated,
					"/api/gyms/checkin",
					"POST",
				);
				const result = await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
					priority: "high",
				});
				if (result.queued) {
					set((state) => ({
						data: {
							...state.data,
							metadata: {
								...state.data.metadata,
								pendingActions: addPendingAction(
									state.data.metadata.pendingActions,
									{
										type: "GYM_CHECKIN_CREATE",
										retries: 0,
										queueId: result.queueId,
									},
								),
							},
						},
					}));
					return;
				}
				await Promise.all([get().loadSection("recentCheckIns"), get().loadSection("stats")]);
			},

			checkOutStudent: async (checkInId) => {
				const command = createCommand(
					GYM_COMMANDS.GYM_CHECKOUT_UPDATE,
					{ checkInId },
					{ idempotencyKey: generateIdempotencyKey() },
				);
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(
					migrated,
					"/api/gyms/checkout",
					"POST",
				);
				await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
					priority: "high",
				});
				await Promise.all([get().loadSection("recentCheckIns"), get().loadSection("stats")]);
			},

			updatePaymentStatus: async (paymentId, status) => {
				const command = createCommand(
					GYM_COMMANDS.GYM_PAYMENT_STATUS_UPDATE,
					{ paymentId, status },
					{ idempotencyKey: generateIdempotencyKey() },
				);
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(
					migrated,
					`/api/gyms/payments/${paymentId}`,
					"PATCH",
				);
				await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
					priority: "high",
				});
				await Promise.all([get().loadSection("payments"), get().loadSection("financialSummary")]);
			},

			updateMemberStatus: async (membershipId, status) => {
				const command = createCommand(
					GYM_COMMANDS.GYM_MEMBERSHIP_UPDATE_STATUS,
					{ membershipId, status },
					{ idempotencyKey: generateIdempotencyKey() },
				);
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(
					migrated,
					`/api/gyms/members/${membershipId}`,
					"PATCH",
				);
				await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
					priority: "high",
				});
				await Promise.all([get().loadSection("students"), get().loadSection("stats")]);
			},

			createEquipment: async (payload) => {
				const command = createCommand(GYM_COMMANDS.GYM_EQUIPMENT_CREATE, payload, {
					idempotencyKey: generateIdempotencyKey(),
				});
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(
					migrated,
					"/api/gyms/equipment",
					"POST",
				);
				await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
				});
				await Promise.all([get().loadSection("equipment"), get().loadSection("stats")]);
			},

			updateEquipment: async (equipmentId, payload) => {
				const command = createCommand(
					GYM_COMMANDS.GYM_EQUIPMENT_UPDATE,
					{ equipmentId, ...payload },
					{ idempotencyKey: generateIdempotencyKey() },
				);
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(
					migrated,
					`/api/gyms/equipment/${equipmentId}`,
					"PATCH",
				);
				await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
				});
				await Promise.all([get().loadSection("equipment"), get().loadSection("stats")]);
			},

			createMaintenance: async (equipmentId, payload) => {
				const command = createCommand(
					GYM_COMMANDS.GYM_MAINTENANCE_CREATE,
					{ equipmentId, ...payload },
					{ idempotencyKey: generateIdempotencyKey() },
				);
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(
					migrated,
					`/api/gyms/equipment/${equipmentId}/maintenance`,
					"POST",
				);
				await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
				});
				await get().loadSection("equipment");
			},

			createMembershipPlan: async (payload) => {
				const command = createCommand(GYM_COMMANDS.GYM_PLAN_CREATE, payload, {
					idempotencyKey: generateIdempotencyKey(),
				});
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(migrated, "/api/gyms/plans", "POST");
				await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
				});
				await get().loadSection("membershipPlans");
			},

			updateMembershipPlan: async (planId, payload) => {
				const command = createCommand(
					GYM_COMMANDS.GYM_PLAN_UPDATE,
					{ planId, ...payload },
					{ idempotencyKey: generateIdempotencyKey() },
				);
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(
					migrated,
					`/api/gyms/plans/${planId}`,
					"PATCH",
				);
				await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
				});
				await get().loadSection("membershipPlans");
			},

			deleteMembershipPlan: async (planId) => {
				const command = createCommand(
					GYM_COMMANDS.GYM_PLAN_DELETE,
					{ planId },
					{ idempotencyKey: generateIdempotencyKey() },
				);
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(
					migrated,
					`/api/gyms/plans/${planId}`,
					"DELETE",
				);
				await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
				});
				await get().loadSection("membershipPlans");
			},

			enrollStudent: async (payload) => {
				const command = createCommand(
					GYM_COMMANDS.GYM_MEMBER_ENROLL_CREATE,
					payload,
					{ idempotencyKey: generateIdempotencyKey() },
				);
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(migrated, "/api/gyms/members", "POST");
				await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
					priority: "high",
				});
				await Promise.all([get().loadSection("students"), get().loadSection("stats")]);
			},

			createGymSubscription: async (payload) => {
				const command = createCommand(
					GYM_COMMANDS.GYM_SUBSCRIPTION_CREATE,
					payload,
					{ idempotencyKey: generateIdempotencyKey() },
				);
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(
					migrated,
					"/api/gym-subscriptions/create",
					"POST",
				);
				await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
					priority: "high",
				});
				await get().loadSection("subscription");
			},

			cancelGymSubscription: async () => {
				const command = createCommand(
					GYM_COMMANDS.GYM_SUBSCRIPTION_CANCEL,
					{},
					{ idempotencyKey: generateIdempotencyKey() },
				);
				await logCommand(command);
				const migrated = migrateCommand(command);
				const options = commandToSyncManager(
					migrated,
					"/api/gym-subscriptions/cancel",
					"POST",
				);
				await syncManager({
					...options,
					commandId: migrated.id,
					idempotencyKey: options.idempotencyKey || migrated.meta.idempotencyKey,
					priority: "high",
				});
				await get().loadSection("subscription");
			},
		}),
		{
			name: "gym-unified-storage",
			storage: createIndexedDBStorage() as any,
			partialize: (state) => ({ data: state.data }) as any,
			onRehydrateStorage: () => {
				return async (state) => {
					if (typeof window !== "undefined" && state) {
						await migrateFromLocalStorage("gym-unified-storage");
					}
				};
			},
		},
	),
);
