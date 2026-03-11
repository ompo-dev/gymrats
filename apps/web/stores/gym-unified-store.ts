import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import type { BoostCampaign, Equipment, Expense } from "@/lib/types";
import type { GymDataSection, GymUnifiedData } from "@/lib/types/gym-unified";
import { initialGymData } from "@/lib/types/gym-unified";
import { normalizeGymDates } from "@/lib/utils/date-safe";
import {
  clearLoadingState,
  loadSection as loadSectionHelper,
  loadSectionsIncremental,
  updateStoreWithSection,
} from "./gym/load-helpers";
import { runOptimisticMutation } from "./shared/optimistic-mutation";
import {
  createResourceStateMap,
  markResourceError,
  markResourcesLoading,
  markResourcesReady,
} from "./shared/resource-metadata";

const ALL_SECTIONS: readonly GymDataSection[] = [
  "profile",
  "stats",
  "students",
  "equipment",
  "financialSummary",
  "recentCheckIns",
  "membershipPlans",
  "payments",
  "expenses",
  "coupons",
  "campaigns",
  "balanceWithdraws",
  "subscription",
];

function withGymResources(data: GymUnifiedData): GymUnifiedData {
  return {
    ...data,
    metadata: {
      ...data.metadata,
      resources: createResourceStateMap(ALL_SECTIONS),
    },
  };
}

const initialState = withGymResources(initialGymData);

function normalizeIncoming(
  incoming: Partial<GymUnifiedData>,
): Partial<GymUnifiedData> {
  return normalizeGymDates(incoming) as Partial<GymUnifiedData>;
}

export interface GymUnifiedState {
  data: GymUnifiedData;
  resetForGymChange: () => void;
  loadAll: () => Promise<void>;
  loadAllPrioritized: (
    priorities: GymDataSection[],
    onlyPriorities?: boolean,
  ) => Promise<void>;
  loadSection: (section: GymDataSection, force?: boolean) => Promise<void>;
  loadStudentDetail: (studentId: string, force?: boolean) => Promise<void>;
  loadStudentPayments: (studentId: string, force?: boolean) => Promise<void>;
  hydrateInitial: (data: Partial<GymUnifiedData>) => void;
  updateProfile: (data: {
    address?: string | null;
    phone?: string | null;
    cnpj?: string | null;
    pixKey?: string | null;
    pixKeyType?: string | null;
    openingHours?: {
      days: string[];
      byDay?: Record<string, { open: string; close: string }> | null;
      open: string;
      close: string;
    };
  }) => Promise<void>;
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
  createCoupon: (data: {
    code: string;
    notes: string;
    discountKind: "PERCENTAGE" | "FIXED";
    discount: number;
    maxRedeems?: number;
    expiresAt?: Date | string | null;
  }) => Promise<void>;
  deleteCoupon: (couponId: string) => Promise<void>;
  createBoostCampaign: (data: {
    title: string;
    description: string;
    primaryColor: string;
    linkedCouponId: string | null;
    linkedPlanId: string | null;
    durationHours: number;
    amountCents: number;
    radiusKm?: number;
  }) => Promise<{
    success: true;
    campaignId: string;
    pixId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt?: string;
  }>;
  deleteBoostCampaign: (campaignId: string) => Promise<void>;
  getBoostCampaignPix: (campaignId: string) => Promise<{
    success: true;
    pixId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt?: string;
  }>;
  createWithdraw: (data: { amountCents: number; fake?: boolean }) => Promise<{
    success: true;
    withdraw: { id: string; amount: number; status: string };
  }>;
  enrollStudent: (data: {
    studentId: string;
    planId?: string | null;
    amount: number;
  }) => Promise<void>;
  createGymSubscription: (data: {
    billingPeriod?: "monthly" | "annual";
  }) => Promise<void>;
  cancelGymSubscription: () => Promise<void>;
  applySubscriptionReferral: (referralCode: string) => Promise<{
    pixId?: string;
    brCode?: string;
    brCodeBase64?: string;
    amount?: number;
    expiresAt?: string;
    originalAmount?: number;
    error?: string;
    referralCodeInvalid?: boolean;
  }>;
  checkCurrentSubscriptionActive: () => Promise<boolean>;
  checkBoostCampaignActive: (campaignId: string) => Promise<boolean>;
}

export const useGymUnifiedStore = create<GymUnifiedState>()((set, get) => {
  const studentDetailPromises = new Map<string, Promise<void>>();
  const studentPaymentPromises = new Map<string, Promise<void>>();

  const setSectionLoading = (sections: readonly GymDataSection[]) => {
    set((state) => ({
      data: {
        ...state.data,
        metadata: {
          ...state.data.metadata,
          isLoading: true,
          resources: markResourcesLoading(
            state.data.metadata.resources as any,
            sections,
          ),
        },
      },
    }));
  };

  const setSectionsReady = (sections: readonly GymDataSection[]) => {
    set((state) => ({
      data: {
        ...state.data,
        metadata: {
          ...state.data.metadata,
          isLoading: false,
          isInitialized: true,
          lastSync: new Date(),
          resources: markResourcesReady(
            state.data.metadata.resources as any,
            sections,
          ),
        },
      },
    }));
  };

  const setSectionError = (section: GymDataSection, error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar recurso";
    set((state) => ({
      data: {
        ...state.data,
        metadata: {
          ...state.data.metadata,
          isLoading: false,
          errors: {
            ...state.data.metadata.errors,
            [section]: message,
          },
          resources: markResourceError(
            state.data.metadata.resources as any,
            section,
            message,
          ),
        },
      },
    }));
  };

  const hydrateSections = (incoming: Partial<GymUnifiedData>) => {
    const sections = ALL_SECTIONS.filter((section) =>
      Object.prototype.hasOwnProperty.call(incoming, section),
    );
    if (sections.length === 0) return;

    set((state) => ({
      data: {
        ...state.data,
        ...normalizeIncoming(incoming),
        metadata: {
          ...state.data.metadata,
          isInitialized: true,
          lastSync: new Date(),
          resources: markResourcesReady(
            state.data.metadata.resources as any,
            sections,
          ),
        },
      },
    }));
  };

  return {
    data: initialState,

    resetForGymChange: () => {
      clearLoadingState();
      studentDetailPromises.clear();
      studentPaymentPromises.clear();
      set({ data: withGymResources(initialGymData) });
    },

    hydrateInitial: (incoming) => {
      hydrateSections(incoming);
    },

    updateProfile: async (payload) => {
      await apiClient.patch("/api/gyms/profile", payload);
      await get().loadSection("profile", true);
    },

    loadAll: async () => {
      setSectionLoading(ALL_SECTIONS);
      try {
        await loadSectionsIncremental(set, [...ALL_SECTIONS]);
        setSectionsReady(ALL_SECTIONS);
      } catch (error) {
        ALL_SECTIONS.forEach((section) => setSectionError(section, error));
      }
    },

    loadAllPrioritized: async (priorities, onlyPriorities = true) => {
      const sections = onlyPriorities
        ? priorities
        : Array.from(new Set([...priorities, ...ALL_SECTIONS]));
      setSectionLoading(sections);
      try {
        await loadSectionsIncremental(set, sections);
        setSectionsReady(sections);
      } catch (error) {
        sections.forEach((section) => setSectionError(section, error));
      }
    },

    loadSection: async (section, force = false) => {
      setSectionLoading([section]);
      try {
        const start = Date.now();
        const sectionData = await loadSectionHelper(section, force);
        updateStoreWithSection(set, sectionData, Date.now() - start, section);
        setSectionsReady([section]);
      } catch (error) {
        console.error(`[GymUnifiedStore] erro ao carregar ${section}:`, error);
        setSectionError(section, error);
      }
    },

    loadStudentDetail: async (studentId, force = false) => {
      if (!force && studentDetailPromises.has(studentId)) {
        return studentDetailPromises.get(studentId)!;
      }

      const promise = (async () => {
        try {
          const response = await apiClient.get<{ student: GymUnifiedData["students"][number] }>(
            `/api/gyms/students/${studentId}`,
          );
          set((state) => ({
            data: {
              ...state.data,
              studentDetails: {
                ...state.data.studentDetails,
                [studentId]: normalizeGymDates(response.data.student),
              },
            },
          }));
        } finally {
          studentDetailPromises.delete(studentId);
        }
      })();

      studentDetailPromises.set(studentId, promise);
      return promise;
    },

    loadStudentPayments: async (studentId, force = false) => {
      if (!force && studentPaymentPromises.has(studentId)) {
        return studentPaymentPromises.get(studentId)!;
      }

      const promise = (async () => {
        try {
          const response = await apiClient.get<{
            payments: GymUnifiedData["payments"];
          }>("/api/gyms/payments", {
            params: { studentId },
          });
          set((state) => ({
            data: {
              ...state.data,
              studentPayments: {
                ...state.data.studentPayments,
                [studentId]: normalizeGymDates(response.data.payments),
              },
            },
          }));
        } finally {
          studentPaymentPromises.delete(studentId);
        }
      })();

      studentPaymentPromises.set(studentId, promise);
      return promise;
    },

    createExpense: async (payload) => {
      const tempId = `temp-expense-${Date.now()}`;
      await runOptimisticMutation({
        getSnapshot: () => get().data.expenses,
        applyOptimistic: () => {
          set((state) => ({
            data: {
              ...state.data,
              expenses: [
                {
                  id: tempId,
                  type: payload.type as Expense["type"],
                  description: payload.description ?? "",
                  amount: payload.amount,
                  date: new Date(payload.date ?? Date.now()),
                  category: payload.category ?? "",
                } as Expense,
                ...state.data.expenses,
              ],
            },
          }));
        },
        rollback: (snapshot) => {
          set((state) => ({
            data: {
              ...state.data,
              expenses: snapshot,
            },
          }));
        },
        execute: async () => {
          await apiClient.post("/api/gyms/expenses", payload as any);
        },
        onSuccess: async () => {
          await Promise.all([
            get().loadSection("expenses", true),
            get().loadSection("financialSummary", true),
          ]);
        },
      });
    },

    createPayment: async (payload) => {
      await apiClient.post("/api/gyms/payments", payload as any);
      await Promise.all([
        get().loadSection("payments", true),
        get().loadSection("financialSummary", true),
      ]);
    },

    checkInStudent: async (studentId) => {
      await apiClient.post("/api/gyms/checkin", { studentId } as any);
      await Promise.all([
        get().loadSection("recentCheckIns", true),
        get().loadSection("stats", true),
      ]);
    },

    checkOutStudent: async (checkInId) => {
      await apiClient.post("/api/gyms/checkout", { checkInId } as any);
      await Promise.all([
        get().loadSection("recentCheckIns", true),
        get().loadSection("stats", true),
      ]);
    },

    updatePaymentStatus: async (paymentId, status) => {
      await apiClient.patch(`/api/gyms/payments/${paymentId}`, { status } as any);
      await Promise.all([
        get().loadSection("payments", true),
        get().loadSection("financialSummary", true),
      ]);
    },

    updateMemberStatus: async (membershipId, status) => {
      await apiClient.patch(`/api/gyms/members/${membershipId}`, { status } as any);
      await Promise.all([
        get().loadSection("students", true),
        get().loadSection("stats", true),
      ]);
    },

    createEquipment: async (payload) => {
      await apiClient.post("/api/gyms/equipment", payload as any);
      await Promise.all([
        get().loadSection("equipment", true),
        get().loadSection("stats", true),
      ]);
    },

    updateEquipment: async (equipmentId, payload) => {
      const previous = get().data.equipment;
      await runOptimisticMutation({
        getSnapshot: () => previous,
        applyOptimistic: () => {
          set((state) => ({
            data: {
              ...state.data,
              equipment: state.data.equipment.map((equipment) =>
                equipment.id === equipmentId
                  ? ({
                      ...equipment,
                      ...payload,
                      brand: payload.brand ?? equipment.brand,
                      model: payload.model ?? equipment.model,
                      serialNumber:
                        payload.serialNumber ?? equipment.serialNumber,
                      purchaseDate: payload.purchaseDate
                        ? new Date(payload.purchaseDate)
                        : equipment.purchaseDate,
                    } as Equipment)
                  : equipment,
              ),
            },
          }));
        },
        rollback: (snapshot) => {
          set((state) => ({
            data: { ...state.data, equipment: snapshot },
          }));
        },
        execute: async () => {
          await apiClient.patch(`/api/gyms/equipment/${equipmentId}`, payload as any);
        },
        onSuccess: async () => {
          await Promise.all([
            get().loadSection("equipment", true),
            get().loadSection("stats", true),
          ]);
        },
      });
    },

    createMaintenance: async (equipmentId, payload) => {
      await apiClient.post(
        `/api/gyms/equipment/${equipmentId}/maintenance`,
        payload as any,
      );
      await get().loadSection("equipment", true);
    },

    createMembershipPlan: async (payload) => {
      await apiClient.post("/api/gyms/plans", payload as any);
      await get().loadSection("membershipPlans", true);
    },

    updateMembershipPlan: async (planId, payload) => {
      await apiClient.patch(`/api/gyms/plans/${planId}`, payload as any);
      await get().loadSection("membershipPlans", true);
    },

    deleteMembershipPlan: async (planId) => {
      const previous = get().data.membershipPlans;
      await runOptimisticMutation({
        getSnapshot: () => previous,
        applyOptimistic: () => {
          set((state) => ({
            data: {
              ...state.data,
              membershipPlans: state.data.membershipPlans.filter(
                (plan) => plan.id !== planId,
              ),
            },
          }));
        },
        rollback: (snapshot) => {
          set((state) => ({
            data: { ...state.data, membershipPlans: snapshot },
          }));
        },
        execute: async () => {
          await apiClient.delete(`/api/gyms/plans/${planId}`);
        },
        onSuccess: async () => {
          await get().loadSection("membershipPlans", true);
        },
      });
    },

    createCoupon: async (payload) => {
      const tempId = `temp-coupon-${Date.now()}`;
      await runOptimisticMutation({
        getSnapshot: () => get().data.coupons,
        applyOptimistic: () => {
          set((state) => ({
            data: {
              ...state.data,
              coupons: [
                {
                  id: tempId,
                  code: payload.code,
                  description: payload.notes,
                  type:
                    payload.discountKind === "PERCENTAGE"
                      ? "percentage"
                      : "fixed",
                  value: payload.discount,
                  currentUses: 0,
                  maxUses: payload.maxRedeems ?? 999999,
                  expiryDate:
                    payload.expiresAt instanceof Date
                      ? payload.expiresAt
                      : new Date(payload.expiresAt ?? Date.now()),
                  isActive: true,
                },
                ...state.data.coupons,
              ],
            },
          }));
        },
        rollback: (snapshot) => {
          set((state) => ({
            data: { ...state.data, coupons: snapshot },
          }));
        },
        execute: async () => {
          await apiClient.post("/api/gyms/coupons", {
            ...payload,
            expiresAt:
              payload.expiresAt instanceof Date
                ? payload.expiresAt.toISOString()
                : payload.expiresAt ?? null,
          });
        },
        onSuccess: async () => {
          await get().loadSection("coupons", true);
        },
      });
    },

    deleteCoupon: async (couponId) => {
      const previous = get().data.coupons;
      await runOptimisticMutation({
        getSnapshot: () => previous,
        applyOptimistic: () => {
          set((state) => ({
            data: {
              ...state.data,
              coupons: state.data.coupons.filter((coupon) => coupon.id !== couponId),
            },
          }));
        },
        rollback: (snapshot) => {
          set((state) => ({
            data: { ...state.data, coupons: snapshot },
          }));
        },
        execute: async () => {
          await apiClient.delete(
            `/api/gyms/coupons?couponId=${encodeURIComponent(couponId)}`,
          );
        },
        onSuccess: async () => {
          await get().loadSection("coupons", true);
        },
      });
    },

    createBoostCampaign: async (payload) => {
      const tempId = `temp-campaign-${Date.now()}`;
      return runOptimisticMutation({
        getSnapshot: () => get().data.campaigns,
        applyOptimistic: () => {
          set((state) => ({
            data: {
              ...state.data,
              campaigns: [
                {
                  id: tempId,
                  gymId: null,
                  personalId: null,
                  personal: null,
                  title: payload.title,
                  description: payload.description,
                  primaryColor: payload.primaryColor,
                  linkedCouponId: payload.linkedCouponId,
                  linkedPlanId: payload.linkedPlanId,
                  durationHours: payload.durationHours,
                  amountCents: payload.amountCents,
                  radiusKm: payload.radiusKm ?? 5,
                  abacatePayBillingId: null,
                  status: "pending_payment",
                  impressions: 0,
                  clicks: 0,
                  startsAt: null,
                  endsAt: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                } as BoostCampaign,
                ...state.data.campaigns,
              ],
            },
          }));
        },
        rollback: (snapshot) => {
          set((state) => ({
            data: { ...state.data, campaigns: snapshot },
          }));
        },
        execute: async () => {
          const response = await apiClient.post<{
            success: true;
            campaignId: string;
            pixId: string;
            brCode: string;
            brCodeBase64: string;
            amount: number;
            expiresAt?: string;
          }>("/api/gyms/boost-campaigns", payload);
          return response.data;
        },
        onSuccess: async () => {
          await get().loadSection("campaigns", true);
        },
      });
    },

    deleteBoostCampaign: async (campaignId) => {
      const previous = get().data.campaigns;
      await runOptimisticMutation({
        getSnapshot: () => previous,
        applyOptimistic: () => {
          set((state) => ({
            data: {
              ...state.data,
              campaigns: state.data.campaigns.filter(
                (campaign) => campaign.id !== campaignId,
              ),
            },
          }));
        },
        rollback: (snapshot) => {
          set((state) => ({
            data: { ...state.data, campaigns: snapshot },
          }));
        },
        execute: async () => {
          await apiClient.delete(
            `/api/gyms/boost-campaigns?campaignId=${encodeURIComponent(campaignId)}`,
          );
        },
        onSuccess: async () => {
          await get().loadSection("campaigns", true);
        },
      });
    },

    getBoostCampaignPix: async (campaignId) => {
      const response = await apiClient.get<{
        success: true;
        pixId: string;
        brCode: string;
        brCodeBase64: string;
        amount: number;
        expiresAt?: string;
      }>(`/api/gyms/boost-campaigns/${campaignId}/pix`);
      return response.data;
    },

    createWithdraw: async ({ amountCents, fake }) => {
      const previous = get().data.balanceWithdraws;
      return runOptimisticMutation({
        getSnapshot: () => previous,
        applyOptimistic: () => {
          set((state) => ({
            data: {
              ...state.data,
              balanceWithdraws: {
                balanceReais: Math.max(
                  0,
                  state.data.balanceWithdraws.balanceReais - amountCents / 100,
                ),
                balanceCents: Math.max(
                  0,
                  state.data.balanceWithdraws.balanceCents - amountCents,
                ),
                withdraws: [
                  {
                    id: `temp-withdraw-${Date.now()}`,
                    amount: amountCents / 100,
                    pixKey: "PIX",
                    pixKeyType: "PIX",
                    externalId: "pending",
                    status: "pending",
                    createdAt: new Date(),
                    completedAt: null,
                  },
                  ...state.data.balanceWithdraws.withdraws,
                ],
              },
            },
          }));
        },
        rollback: (snapshot) => {
          set((state) => ({
            data: { ...state.data, balanceWithdraws: snapshot },
          }));
        },
        execute: async () => {
          const response = await apiClient.post<{
            success: true;
            withdraw: { id: string; amount: number; status: string };
          }>("/api/gyms/withdraws", { amountCents, fake });
          return response.data;
        },
        onSuccess: async () => {
          await get().loadSection("balanceWithdraws", true);
        },
      });
    },

    enrollStudent: async (payload) => {
      await apiClient.post("/api/gyms/members", payload as any);
      await Promise.all([
        get().loadSection("students", true),
        get().loadSection("stats", true),
        get().loadSection("payments", true),
      ]);
    },

    createGymSubscription: async (payload) => {
      await apiClient.post("/api/gym-subscriptions/create", payload as any);
      await get().loadSection("subscription", true);
    },

    cancelGymSubscription: async () => {
      await apiClient.post("/api/gym-subscriptions/cancel", {} as any);
      await get().loadSection("subscription", true);
    },

    applySubscriptionReferral: async (referralCode) => {
      const response = await apiClient.post<{
        pixId?: string;
        brCode?: string;
        brCodeBase64?: string;
        amount?: number;
        expiresAt?: string;
        originalAmount?: number;
        error?: string;
        referralCodeInvalid?: boolean;
      }>("/api/gym-subscriptions/apply-referral", {
        referralCode: referralCode.trim(),
      });
      return response.data;
    },

    checkCurrentSubscriptionActive: async () => {
      const response = await apiClient.get<{
        subscription?: { status?: string } | null;
      }>("/api/gym-subscriptions/current");
      return response.data.subscription?.status === "active";
    },

    checkBoostCampaignActive: async (campaignId) => {
      const response = await apiClient.get<{ status: string }>(
        `/api/gym/boost-campaigns/${campaignId}`,
      );
      return response.data.status === "active";
    },
  };
});
