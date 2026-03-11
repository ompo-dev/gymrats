import { create } from "zustand";
import type { BoostCampaign, Expense } from "@/lib/types";
import { apiClient } from "@/lib/api/client";
import { getAxiosInstance } from "@/lib/api/client-factory";
import type {
  PersonalDataSection,
  PersonalUnifiedData,
} from "@/lib/types/personal-unified";
import { initialPersonalData } from "@/lib/types/personal-unified";
import {
  loadSection as loadSectionHelper,
  loadSectionsIncremental,
  updateStoreWithSection,
} from "./personal/load-helpers";
import { runOptimisticMutation } from "./shared/optimistic-mutation";
import {
  createResourceStateMap,
  markResourceError,
  markResourcesLoading,
  markResourcesReady,
} from "./shared/resource-metadata";

const ALL_SECTIONS: readonly PersonalDataSection[] = [
  "profile",
  "affiliations",
  "students",
  "studentDirectory",
  "subscription",
  "financialSummary",
  "expenses",
  "payments",
  "coupons",
  "campaigns",
  "membershipPlans",
];

function withPersonalResources(
  data: PersonalUnifiedData,
): PersonalUnifiedData {
  return {
    ...data,
    metadata: {
      ...data.metadata,
      resources: createResourceStateMap(ALL_SECTIONS),
    },
  };
}

const initialState = withPersonalResources(initialPersonalData);

export interface PersonalUnifiedState {
  data: PersonalUnifiedData;
  loadAll: () => Promise<void>;
  loadAllPrioritized: (
    priorities: PersonalDataSection[],
    onlyPriorities?: boolean,
  ) => Promise<void>;
  loadSection: (section: PersonalDataSection, force?: boolean) => Promise<void>;
  loadStudentDetail: (studentId: string, force?: boolean) => Promise<void>;
  loadStudentPayments: (studentId: string, force?: boolean) => Promise<void>;
  hydrateInitial: (data: Partial<PersonalUnifiedData>) => void;
  updateProfile: (data: {
    name?: string;
    email?: string;
    phone?: string | null;
    bio?: string | null;
    address?: string | null;
    cref?: string | null;
    pixKey?: string | null;
    pixKeyType?: string | null;
    atendimentoPresencial?: boolean;
    atendimentoRemoto?: boolean;
  }) => Promise<void>;
  linkAffiliation: (gymId: string) => Promise<void>;
  unlinkAffiliation: (gymId: string) => Promise<void>;
  assignStudent: (data: {
    studentId: string;
    gymId?: string;
  }) => Promise<void>;
  removeStudent: (studentId: string) => Promise<void>;
  createExpense: (data: {
    type: string;
    description?: string | null;
    amount: number;
    date?: string | null;
    category?: string | null;
  }) => Promise<void>;
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
  createMembershipPlan: (data: {
    name: string;
    description?: string | null;
    type: string;
    price: number;
    duration: number;
    benefits?: string[] | null;
  }) => Promise<void>;
  updateMembershipPlan: (
    planId: string,
    data: {
      name?: string;
      description?: string | null;
      type?: string;
      price?: number;
      duration?: number;
      benefits?: string[] | null;
      isActive?: boolean;
    },
  ) => Promise<void>;
  deleteMembershipPlan: (planId: string) => Promise<void>;
  createPersonalSubscription: (data: {
    plan: "standard" | "pro_ai";
    billingPeriod: "monthly" | "annual";
  }) => Promise<{
    pix?: {
      pixId: string;
      brCode: string;
      brCodeBase64: string;
      amount: number;
      expiresAt?: string;
    };
  } | null>;
  cancelPersonalSubscription: () => Promise<void>;
  checkBoostCampaignActive: (campaignId: string) => Promise<boolean>;
}

export const usePersonalUnifiedStore = create<PersonalUnifiedState>()(
  (set, get) => {
    const studentDetailPromises = new Map<string, Promise<void>>();
    const studentPaymentPromises = new Map<string, Promise<void>>();

    const setSectionLoading = (sections: readonly PersonalDataSection[]) => {
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

    const setSectionsReady = (sections: readonly PersonalDataSection[]) => {
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

    const setSectionError = (section: PersonalDataSection, error: unknown) => {
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

    const hydrateSections = (incoming: Partial<PersonalUnifiedData>) => {
      const sections = ALL_SECTIONS.filter((section) =>
        Object.prototype.hasOwnProperty.call(incoming, section),
      );
      if (sections.length === 0) return;

      set((state) => ({
        data: {
          ...state.data,
          ...incoming,
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

      hydrateInitial: (data) => {
        hydrateSections(data);
      },

      loadAll: async () => {
        setSectionLoading(ALL_SECTIONS);
        try {
          const result = await loadSectionsIncremental([...ALL_SECTIONS]);
          updateStoreWithSection(set, result);
          setSectionsReady(ALL_SECTIONS);
        } catch (err) {
          ALL_SECTIONS.forEach((section) => setSectionError(section, err));
        }
      },

      loadAllPrioritized: async (priorities, onlyPriorities = true) => {
        const sections = onlyPriorities
          ? priorities
          : Array.from(new Set([...priorities, ...ALL_SECTIONS]));
        setSectionLoading(sections);
        try {
          const result = await loadSectionsIncremental(sections);
          updateStoreWithSection(set, result);
          setSectionsReady(sections);
        } catch (err) {
          sections.forEach((section) => setSectionError(section, err));
        }
      },

      loadSection: async (section, _force = false) => {
        setSectionLoading([section]);
        try {
          const result = await loadSectionHelper(section);
          updateStoreWithSection(set, result);
          setSectionsReady([section]);
        } catch (err) {
          console.error(
            `[personal-unified-store] loadSection(${section}) erro:`,
            err,
          );
          setSectionError(section, err);
        }
      },

      loadStudentDetail: async (studentId, force = false) => {
        if (!force && studentDetailPromises.has(studentId)) {
          return studentDetailPromises.get(studentId)!;
        }

        const promise = (async () => {
          try {
            const response = await apiClient.get<{
              student: PersonalUnifiedData["studentDirectory"][number];
            }>(`/api/personals/students/${studentId}/student-data`);
            set((state) => ({
              data: {
                ...state.data,
                studentDetails: {
                  ...state.data.studentDetails,
                  [studentId]: response.data.student,
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
              payments: PersonalUnifiedData["payments"];
            }>(`/api/personals/payments`, {
              params: { studentId },
            });
            set((state) => ({
              data: {
                ...state.data,
                studentPayments: {
                  ...state.data.studentPayments,
                  [studentId]: response.data.payments ?? [],
                },
              },
            }));
          } catch {
            set((state) => ({
              data: {
                ...state.data,
                studentPayments: {
                  ...state.data.studentPayments,
                  [studentId]: [],
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

      updateProfile: async (data) => {
        await apiClient.patch("/api/personals", data);
        await get().loadSection("profile", true);
      },

      linkAffiliation: async (gymId) => {
        const normalizedGymId = gymId.trim();
        await apiClient.post("/api/personals/affiliations", {
          gymId: normalizedGymId.startsWith("@")
            ? normalizedGymId
            : `@${normalizedGymId}`,
        });
        await get().loadSection("affiliations", true);
      },

      unlinkAffiliation: async (gymId) => {
        await apiClient.delete("/api/personals/affiliations", {
          data: { gymId },
        });
        await get().loadSection("affiliations", true);
      },

      assignStudent: async ({ studentId, gymId }) => {
        await apiClient.post("/api/personals/students/assign", {
          studentId,
          ...(gymId ? { gymId } : {}),
        });
        await Promise.all([
          get().loadSection("students", true),
          get().loadSection("studentDirectory", true),
        ]);
      },

      removeStudent: async (studentId) => {
        await getAxiosInstance().delete("/api/personals/students/assign", {
          data: { studentId },
        });
        await Promise.all([
          get().loadSection("students", true),
          get().loadSection("studentDirectory", true),
        ]);
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
              data: { ...state.data, expenses: snapshot },
            }));
          },
          execute: async () => {
            await apiClient.post("/api/personals/expenses", payload as any);
          },
          onSuccess: async () => {
            await Promise.all([
              get().loadSection("expenses", true),
              get().loadSection("financialSummary", true),
            ]);
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
            await apiClient.post("/api/personals/coupons", {
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
              `/api/personals/coupons?couponId=${encodeURIComponent(couponId)}`,
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
            }>("/api/personals/boost-campaigns", payload);
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
              `/api/personals/boost-campaigns?campaignId=${encodeURIComponent(campaignId)}`,
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
        }>(`/api/personals/boost-campaigns/${campaignId}/pix`);
        return response.data;
      },

      createMembershipPlan: async (payload) => {
        await apiClient.post("/api/personals/membership-plans", payload);
        await get().loadSection("membershipPlans", true);
      },

      updateMembershipPlan: async (planId, payload) => {
        await apiClient.patch(`/api/personals/membership-plans/${planId}`, payload);
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
            await apiClient.delete(`/api/personals/membership-plans/${planId}`);
          },
          onSuccess: async () => {
            await get().loadSection("membershipPlans", true);
          },
        });
      },

      createPersonalSubscription: async ({ plan, billingPeriod }) => {
        const res = await apiClient.post<{
          subscription: unknown;
          pix?: {
            pixId: string;
            brCode: string;
            brCodeBase64: string;
            amount: number;
            expiresAt?: string;
          };
        }>("/api/personals/subscription", { plan, billingPeriod });
        await get().loadSection("subscription", true);
        return res.data?.pix ? { pix: res.data.pix } : null;
      },

      cancelPersonalSubscription: async () => {
        await apiClient.post("/api/personals/subscription/cancel", {});
        await get().loadSection("subscription", true);
      },

      checkBoostCampaignActive: async (campaignId) => {
        const response = await apiClient.get<{ status: string }>(
          `/api/personals/boost-campaigns/${campaignId}`,
        );
        return response.data.status === "active";
      },
    };
  },
);
