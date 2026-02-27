import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
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
import {
	addPendingAction,
	clearLoadingState,
	loadSection as loadSectionHelper,
	loadSectionsIncremental,
	updateStoreWithSection,
} from "./gym/load-helpers";

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

export interface GymUnifiedState {
	data: GymUnifiedData;
	/** Limpa todos os dados ao trocar de academia (evita dados da academia anterior) */
	resetForGymChange: () => void;
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

			resetForGymChange: () => {
				clearLoadingState();
				set({
					data: {
						...initialGymData,
						metadata: {
							...initialGymData.metadata,
							isInitialized: false,
							lastSync: null,
						},
					},
				});
			},

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
				const sectionData = await loadSectionHelper(section);
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
			storage: createIndexedDBStorage() as PersistStorage<{ data: GymUnifiedData }>,
			partialize: (state): { data: GymUnifiedData } => ({ data: state.data }),
			onRehydrateStorage: () => {
				return async (state) => {
					if (typeof window !== "undefined" && state) {
						await migrateFromLocalStorage("gym-unified-storage");
					}
				};
			},
		} as import("zustand/middleware").PersistOptions<GymUnifiedState, { data: GymUnifiedData }>,
	),
);
