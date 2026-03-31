import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import { getAxiosInstance } from "@/lib/api/client-factory";
import type { BoostCampaign, Expense } from "@/lib/types";
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
  type ResourceStateMap,
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

function withPersonalResources(data: PersonalUnifiedData): PersonalUnifiedData {
  return {
    ...data,
    metadata: {
      ...data.metadata,
      resources: createResourceStateMap(ALL_SECTIONS),
    },
  };
}

const initialState = withPersonalResources(initialPersonalData);

function toPersonalResourceStateMap(
  resources: PersonalUnifiedData["metadata"]["resources"],
): ResourceStateMap<PersonalDataSection> {
  return resources as ResourceStateMap<PersonalDataSection>;
}

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
  assignStudent: (data: { studentId: string; gymId?: string }) => Promise<void>;
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
              toPersonalResourceStateMap(state.data.metadata.resources),
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
              toPersonalResourceStateMap(state.data.metadata.resources),
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
              toPersonalResourceStateMap(state.data.metadata.resources),
              section,
              message,
            ),
          },
        },
      }));
    };

    const hydrateSections = (incoming: Partial<PersonalUnifiedData>) => {
      const sections = ALL_SECTIONS.filter((section) =>
        Object.hasOwn(incoming, section),
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
              toPersonalResourceStateMap(state.data.metadata.resources),
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
          ALL_SECTIONS.forEach((section) => {
            setSectionError(section, err);
          });
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
          sections.forEach((section) => {
            setSectionError(section, err);
          });
        }
      },

      loadSection: async (section, force = false) => {
        setSectionLoading([section]);
        try {
          const result = await loadSectionHelper(section, force);
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
            }>(
              `/api/personals/students/${studentId}/student-data${force ? "?fresh=1" : ""}`,
            );
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
              params: { studentId, ...(force ? { fresh: "1" } : {}) },
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
        const previous = get().data.profile;
        await runOptimisticMutation({
          getSnapshot: () => previous,
          applyOptimistic: () => {
            if (!previous) {
              return;
            }

            set((state) => ({
              data: {
                ...state.data,
                profile: {
                  ...previous,
                  ...data,
                },
              },
            }));
          },
          rollback: (snapshot) => {
            set((state) => ({
              data: { ...state.data, profile: snapshot },
            }));
          },
          execute: async () => {
            await apiClient.patch("/api/personals", data);
          },
        });
      },

      linkAffiliation: async (gymId) => {
        const normalizedGymId = gymId.trim();
        await apiClient.post("/api/personals/affiliations", {
          gymId: normalizedGymId.startsWith("@")
            ? normalizedGymId
            : `@${normalizedGymId}`,
        });
      },

      unlinkAffiliation: async (gymId) => {
        const previous = get().data.affiliations;
        await runOptimisticMutation({
          getSnapshot: () => previous,
          applyOptimistic: () => {
            set((state) => ({
              data: {
                ...state.data,
                affiliations: state.data.affiliations.filter(
                  (affiliation) => affiliation.gym.id !== gymId,
                ),
              },
            }));
          },
          rollback: (snapshot) => {
            set((state) => ({
              data: { ...state.data, affiliations: snapshot },
            }));
          },
          execute: async () => {
            await apiClient.delete("/api/personals/affiliations", {
              data: { gymId },
            });
          },
        });
      },

      assignStudent: async ({ studentId, gymId }) => {
        await apiClient.post("/api/personals/students/assign", {
          studentId,
          ...(gymId ? { gymId } : {}),
        });
      },

      removeStudent: async (studentId) => {
        const previous = {
          students: get().data.students,
          studentDirectory: get().data.studentDirectory,
          studentDetails: get().data.studentDetails,
          studentPayments: get().data.studentPayments,
        };
        await runOptimisticMutation({
          getSnapshot: () => previous,
          applyOptimistic: () => {
            set((state) => {
              const nextStudentDetails = { ...state.data.studentDetails };
              const nextStudentPayments = { ...state.data.studentPayments };
              delete nextStudentDetails[studentId];
              delete nextStudentPayments[studentId];

              return {
                data: {
                  ...state.data,
                  students: state.data.students.filter(
                    (assignment) => assignment.student.id !== studentId,
                  ),
                  studentDirectory: state.data.studentDirectory.filter(
                    (student) => student.id !== studentId,
                  ),
                  studentDetails: nextStudentDetails,
                  studentPayments: nextStudentPayments,
                },
              };
            });
          },
          rollback: (snapshot) => {
            set((state) => ({
              data: {
                ...state.data,
                students: snapshot.students,
                studentDirectory: snapshot.studentDirectory,
                studentDetails: snapshot.studentDetails,
                studentPayments: snapshot.studentPayments,
              },
            }));
          },
          execute: async () => {
            await getAxiosInstance().delete("/api/personals/students/assign", {
              data: { studentId },
            });
          },
        });
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
            await apiClient.post("/api/personals/expenses", payload);
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
                  : (payload.expiresAt ?? null),
            });
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
                coupons: state.data.coupons.filter(
                  (coupon) => coupon.id !== couponId,
                ),
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
        const tempId = `temp-membership-plan-${Date.now()}`;
        await runOptimisticMutation({
          getSnapshot: () => get().data.membershipPlans,
          applyOptimistic: () => {
            set((state) => ({
              data: {
                ...state.data,
                membershipPlans: [
                  {
                    id: tempId,
                    personalId: state.data.profile?.id ?? "",
                    name: payload.name,
                    description: payload.description ?? null,
                    type: payload.type,
                    price: payload.price,
                    duration: payload.duration,
                    benefits: payload.benefits ?? [],
                    isActive: true,
                  },
                  ...state.data.membershipPlans,
                ],
              },
            }));
          },
          rollback: (snapshot) => {
            set((state) => ({
              data: { ...state.data, membershipPlans: snapshot },
            }));
          },
          execute: async () => {
            const response = await apiClient.post<{
              plan: PersonalUnifiedData["membershipPlans"][number];
            }>("/api/personals/membership-plans", payload);
            return response.data.plan;
          },
          onSuccess: (createdPlan) => {
            set((state) => ({
              data: {
                ...state.data,
                membershipPlans: state.data.membershipPlans.map((plan) =>
                  plan.id === tempId ? createdPlan : plan,
                ),
              },
            }));
          },
        });
      },

      updateMembershipPlan: async (planId, payload) => {
        const previous = get().data.membershipPlans;
        await runOptimisticMutation({
          getSnapshot: () => previous,
          applyOptimistic: () => {
            set((state) => ({
              data: {
                ...state.data,
                membershipPlans: state.data.membershipPlans.map((plan) =>
                  plan.id === planId
                    ? {
                        ...plan,
                        ...payload,
                        description: payload.description ?? plan.description,
                        benefits: payload.benefits ?? plan.benefits,
                        isActive: payload.isActive ?? plan.isActive,
                      }
                    : plan,
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
            const response = await apiClient.patch<{
              plan: PersonalUnifiedData["membershipPlans"][number];
            }>(`/api/personals/membership-plans/${planId}`, payload);
            return response.data.plan;
          },
          onSuccess: (updatedPlan) => {
            set((state) => ({
              data: {
                ...state.data,
                membershipPlans: state.data.membershipPlans.map((plan) =>
                  plan.id === planId ? updatedPlan : plan,
                ),
              },
            }));
          },
        });
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
        return res.data?.pix ? { pix: res.data.pix } : null;
      },

      cancelPersonalSubscription: async () => {
        await apiClient.post("/api/personals/subscription/cancel", {});
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
