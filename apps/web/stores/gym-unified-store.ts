import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import type {
  BoostCampaign,
  CheckIn,
  Equipment,
  Expense,
  MaintenanceRecord,
  Payment,
  StudentData,
} from "@/lib/types";
import type { GymDataSection, GymUnifiedData } from "@/lib/types/gym-unified";
import { initialGymData } from "@/lib/types/gym-unified";
import { normalizeGymDates } from "@/lib/utils/date-safe";
import { normalizeEquipmentItem } from "@/lib/utils/gym/normalize-equipment";
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
  type ResourceStateMap,
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

function toGymResourceStateMap(
  resources: GymUnifiedData["metadata"]["resources"],
): ResourceStateMap<GymDataSection> {
  return resources as ResourceStateMap<GymDataSection>;
}

function normalizeIncoming(
  incoming: Partial<GymUnifiedData>,
): Partial<GymUnifiedData> {
  return normalizeGymDates(incoming) as Partial<GymUnifiedData>;
}

type EnrollmentStudentSnapshot = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  age?: number | null;
  gender?: string | null;
  currentLevel?: number;
  currentStreak?: number;
};

type EnrollmentResponse = {
  success: true;
  membership: {
    id: string;
    gymId?: string;
    amount?: number;
    status?: "active" | "suspended" | "canceled" | "pending";
    nextBillingDate?: Date | string | null;
    student?: { user?: { name?: string; email?: string } | null } | null;
    plan?: {
      id?: string | null;
      name?: string | null;
      type?: string | null;
      benefits?: string[] | string | null;
    } | null;
  };
  pendingPayment: boolean;
};

function parseMembershipBenefits(benefits: unknown): string[] {
  if (Array.isArray(benefits)) {
    return benefits.map(String);
  }

  if (typeof benefits === "string") {
    try {
      const parsed = JSON.parse(benefits) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function toStudentMembershipStatus(
  status: "active" | "suspended" | "canceled" | "pending" | undefined,
): StudentData["membershipStatus"] {
  if (status === "active") {
    return "active";
  }

  if (status === "suspended") {
    return "suspended";
  }

  return "inactive";
}

function normalizePaymentSnapshot(
  value: unknown,
  fallback: Partial<Payment>,
): Payment {
  const payment = normalizeGymDates(value) as Partial<Payment>;

  return {
    id: String(payment.id ?? fallback.id ?? `payment-${Date.now()}`),
    studentId: String(payment.studentId ?? fallback.studentId ?? ""),
    studentName: String(payment.studentName ?? fallback.studentName ?? "Aluno"),
    planId: String(payment.planId ?? fallback.planId ?? ""),
    planName: String(payment.planName ?? fallback.planName ?? "Pagamento"),
    amount:
      typeof payment.amount === "number"
        ? payment.amount
        : (fallback.amount ?? 0),
    date: payment.date ?? fallback.date ?? new Date(),
    dueDate: payment.dueDate ?? fallback.dueDate ?? new Date(),
    status: payment.status ?? fallback.status ?? "pending",
    paymentMethod: payment.paymentMethod ?? fallback.paymentMethod ?? "pix",
    reference: payment.reference ?? fallback.reference,
    abacatePayBillingId:
      payment.abacatePayBillingId ?? fallback.abacatePayBillingId,
    withdrawnAt: payment.withdrawnAt ?? fallback.withdrawnAt,
    withdrawId: payment.withdrawId ?? fallback.withdrawId,
  };
}

function normalizeCheckInSnapshot(value: unknown): CheckIn {
  const checkIn = normalizeGymDates(value) as Partial<CheckIn>;

  return {
    id: String(checkIn.id ?? `checkin-${Date.now()}`),
    studentId: String(checkIn.studentId ?? ""),
    studentName: String(checkIn.studentName ?? "Aluno"),
    timestamp: checkIn.timestamp ?? new Date(),
    checkOut: checkIn.checkOut,
    duration: checkIn.duration,
  };
}

function normalizeMaintenanceSnapshot(value: unknown): MaintenanceRecord {
  const record = normalizeGymDates(value) as Partial<MaintenanceRecord>;

  return {
    id: String(record.id ?? `maintenance-${Date.now()}`),
    date: record.date ?? new Date(),
    type: record.type ?? "inspection",
    description: String(record.description ?? ""),
    performedBy: String(record.performedBy ?? ""),
    cost: typeof record.cost === "number" ? record.cost : undefined,
    nextScheduled: record.nextScheduled,
  };
}

function updateSummaryForPaymentStatus(
  summary: GymUnifiedData["financialSummary"],
  payment: Payment,
  nextStatus: Payment["status"],
): GymUnifiedData["financialSummary"] {
  if (!summary || payment.status === nextStatus) {
    return summary;
  }

  const isRevenueStatus = (status: Payment["status"]) =>
    status === "paid" || status === "withdrawn";

  const pendingDelta =
    (nextStatus === "pending" ? payment.amount : 0) -
    (payment.status === "pending" ? payment.amount : 0);
  const overdueDelta =
    (nextStatus === "overdue" ? payment.amount : 0) -
    (payment.status === "overdue" ? payment.amount : 0);
  const revenueDelta =
    (isRevenueStatus(nextStatus) ? payment.amount : 0) -
    (isRevenueStatus(payment.status) ? payment.amount : 0);

  return {
    ...summary,
    pendingPayments: Math.max(0, summary.pendingPayments + pendingDelta),
    overduePayments: Math.max(0, summary.overduePayments + overdueDelta),
    totalRevenue: Math.max(0, summary.totalRevenue + revenueDelta),
    netProfit: summary.netProfit + revenueDelta,
  };
}

function buildEnrolledStudentPlaceholder(
  studentSnapshot: EnrollmentStudentSnapshot,
  membership: EnrollmentResponse["membership"],
  gymProfile: GymUnifiedData["profile"],
): StudentData {
  const normalizedMembership = normalizeGymDates(membership) as Partial<
    EnrollmentResponse["membership"]
  >;

  return {
    id: studentSnapshot.id,
    name: studentSnapshot.name,
    email: studentSnapshot.email,
    avatar: studentSnapshot.avatar ?? undefined,
    age: studentSnapshot.age ?? 0,
    gender: studentSnapshot.gender ?? "",
    phone: "",
    membershipStatus: toStudentMembershipStatus(normalizedMembership.status),
    joinDate: new Date(),
    lastVisit: undefined,
    totalVisits: 0,
    currentStreak: studentSnapshot.currentStreak ?? 0,
    profile: null,
    progress: null,
    recentWorkouts: [],
    workoutHistory: [],
    personalRecords: [],
    currentWeight: 0,
    weightHistory: [],
    attendanceRate: 0,
    favoriteEquipment: [],
    gymMembership: {
      id: normalizedMembership.id ?? "",
      gymId: normalizedMembership.gymId ?? gymProfile?.id ?? "",
      gymName: gymProfile?.name ?? "Academia",
      gymLogo: gymProfile?.logo,
      gymAddress: gymProfile?.address ?? "",
      planId: normalizedMembership.plan?.id ?? "",
      planName: normalizedMembership.plan?.name ?? "Plano",
      planType:
        normalizedMembership.plan?.type === "quarterly" ||
        normalizedMembership.plan?.type === "semi-annual" ||
        normalizedMembership.plan?.type === "annual"
          ? normalizedMembership.plan.type
          : "monthly",
      startDate: new Date(),
      nextBillingDate: normalizedMembership.nextBillingDate ?? undefined,
      amount: normalizedMembership.amount ?? 0,
      status: normalizedMembership.status ?? "pending",
      autoRenew: true,
      benefits: parseMembershipBenefits(normalizedMembership.plan?.benefits),
    },
    payments: [],
  } as unknown as StudentData;
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
  }) => Promise<Payment>;
  checkInStudent: (studentId: string) => Promise<CheckIn>;
  checkOutStudent: (checkInId: string) => Promise<CheckIn>;
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
  }) => Promise<Equipment>;
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
  ) => Promise<Equipment>;
  createMaintenance: (
    equipmentId: string,
    data: {
      type: string;
      description: string;
      performedBy: string;
      cost?: string | number;
      nextScheduled?: string;
    },
  ) => Promise<MaintenanceRecord>;
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
    studentSnapshot?: EnrollmentStudentSnapshot;
  }) => Promise<EnrollmentResponse>;
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
            toGymResourceStateMap(state.data.metadata.resources),
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
            toGymResourceStateMap(state.data.metadata.resources),
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
            toGymResourceStateMap(state.data.metadata.resources),
            section,
            message,
          ),
        },
      },
    }));
  };

  const hydrateSections = (incoming: Partial<GymUnifiedData>) => {
    const sections = ALL_SECTIONS.filter((section) =>
      Object.hasOwn(incoming, section),
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
            toGymResourceStateMap(state.data.metadata.resources),
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
      const previous = get().data.profile;
      await runOptimisticMutation({
        getSnapshot: () => previous,
        applyOptimistic: () => {
          if (!previous) {
            return;
          }

          const nextProfile: GymUnifiedData["profile"] = {
            ...previous,
            ...(Object.hasOwn(payload, "address")
              ? { address: payload.address ?? "" }
              : {}),
            ...(Object.hasOwn(payload, "phone")
              ? { phone: payload.phone ?? "" }
              : {}),
            ...(Object.hasOwn(payload, "cnpj")
              ? { cnpj: payload.cnpj ?? "" }
              : {}),
            ...(Object.hasOwn(payload, "pixKey")
              ? { pixKey: payload.pixKey ?? undefined }
              : {}),
            ...(Object.hasOwn(payload, "pixKeyType")
              ? { pixKeyType: payload.pixKeyType ?? undefined }
              : {}),
            ...(payload.openingHours
              ? {
                  openingHours: {
                    ...payload.openingHours,
                    byDay: payload.openingHours.byDay ?? undefined,
                  },
                }
              : {}),
          };

          set((state) => ({
            data: {
              ...state.data,
              profile: nextProfile,
            },
          }));
        },
        rollback: (snapshot) => {
          set((state) => ({
            data: { ...state.data, profile: snapshot },
          }));
        },
        execute: async () => {
          await apiClient.patch("/api/gyms/profile", payload);
        },
      });
    },

    loadAll: async () => {
      setSectionLoading(ALL_SECTIONS);
      try {
        await loadSectionsIncremental(set, [...ALL_SECTIONS]);
        setSectionsReady(ALL_SECTIONS);
      } catch (error) {
        ALL_SECTIONS.forEach((section) => {
          setSectionError(section, error);
        });
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
        sections.forEach((section) => {
          setSectionError(section, error);
        });
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
          const response = await apiClient.get<{
            student: GymUnifiedData["students"][number];
          }>(`/api/gyms/students/${studentId}${force ? "?fresh=1" : ""}`);
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
            params: { studentId, ...(force ? { fresh: "1" } : {}) },
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
          await apiClient.post("/api/gyms/expenses", payload);
        },
      });
    },

    createPayment: async (payload) => {
      const response = await apiClient.post<{ payment: unknown }>(
        "/api/gyms/payments",
        payload,
      );
      const payment = normalizePaymentSnapshot(response.data.payment, {
        studentId: payload.studentId,
        studentName: payload.studentName ?? "Aluno",
        planId: payload.planId ?? "",
        planName: payload.reference ?? "Pagamento avulso",
        amount: payload.amount,
        dueDate: new Date(payload.dueDate),
        date: new Date(),
        status: "pending",
        paymentMethod:
          payload.paymentMethod === "credit-card" ||
          payload.paymentMethod === "debit-card" ||
          payload.paymentMethod === "cash" ||
          payload.paymentMethod === "bank-transfer"
            ? payload.paymentMethod
            : "pix",
        reference: payload.reference ?? undefined,
      });

      set((state) => ({
        data: {
          ...state.data,
          payments: [
            payment,
            ...state.data.payments.filter((item) => item.id !== payment.id),
          ],
          studentPayments: {
            ...state.data.studentPayments,
            [payment.studentId]: [
              payment,
              ...(state.data.studentPayments[payment.studentId] ?? []).filter(
                (item) => item.id !== payment.id,
              ),
            ],
          },
          financialSummary: state.data.financialSummary
            ? {
                ...state.data.financialSummary,
                pendingPayments:
                  state.data.financialSummary.pendingPayments + payment.amount,
              }
            : state.data.financialSummary,
        },
      }));

      return payment;
    },

    checkInStudent: async (studentId) => {
      const response = await apiClient.post<{
        success: true;
        checkIn: unknown;
      }>("/api/gyms/checkin", { studentId });
      const checkIn = normalizeCheckInSnapshot(response.data.checkIn);

      set((state) => ({
        data: {
          ...state.data,
          recentCheckIns: [
            checkIn,
            ...state.data.recentCheckIns.filter(
              (item) => item.id !== checkIn.id,
            ),
          ],
          students: state.data.students.map((student) =>
            student.id === studentId
              ? {
                  ...student,
                  lastVisit: checkIn.timestamp,
                  totalVisits: (student.totalVisits ?? 0) + 1,
                }
              : student,
          ),
          stats: state.data.stats
            ? {
                ...state.data.stats,
                today: {
                  ...state.data.stats.today,
                  checkins: state.data.stats.today.checkins + 1,
                  activeStudents: state.data.stats.today.activeStudents + 1,
                  equipmentInUse: state.data.stats.today.equipmentInUse + 1,
                },
                week: {
                  ...state.data.stats.week,
                  totalCheckins: state.data.stats.week.totalCheckins + 1,
                },
                month: {
                  ...state.data.stats.month,
                  totalCheckins: state.data.stats.month.totalCheckins + 1,
                },
              }
            : state.data.stats,
        },
      }));

      return checkIn;
    },

    checkOutStudent: async (checkInId) => {
      const currentCheckIn = get().data.recentCheckIns.find(
        (item) => item.id === checkInId,
      );
      const response = await apiClient.post<{
        success: true;
        checkIn: unknown;
      }>("/api/gyms/checkout", { checkInId });
      const checkIn = normalizeCheckInSnapshot(response.data.checkIn);

      set((state) => ({
        data: {
          ...state.data,
          recentCheckIns: state.data.recentCheckIns.map((item) =>
            item.id === checkInId ? checkIn : item,
          ),
          stats: state.data.stats
            ? {
                ...state.data.stats,
                today: {
                  ...state.data.stats.today,
                  activeStudents: Math.max(
                    0,
                    state.data.stats.today.activeStudents -
                      (currentCheckIn?.checkOut ? 0 : 1),
                  ),
                  equipmentInUse: Math.max(
                    0,
                    state.data.stats.today.equipmentInUse -
                      (currentCheckIn?.checkOut ? 0 : 1),
                  ),
                },
              }
            : state.data.stats,
        },
      }));

      return checkIn;
    },

    updatePaymentStatus: async (paymentId, status) => {
      const currentPayment =
        get().data.payments.find((payment) => payment.id === paymentId) ??
        Object.values(get().data.studentPayments)
          .flat()
          .find((payment) => payment.id === paymentId);

      if (!currentPayment) {
        await apiClient.patch(`/api/gyms/payments/${paymentId}`, { status });
        return;
      }

      await runOptimisticMutation({
        getSnapshot: () => ({
          payments: get().data.payments,
          studentPayments: get().data.studentPayments,
          financialSummary: get().data.financialSummary,
        }),
        applyOptimistic: () => {
          set((state) => ({
            data: {
              ...state.data,
              payments: state.data.payments.map((payment) =>
                payment.id === paymentId ? { ...payment, status } : payment,
              ),
              studentPayments: Object.fromEntries(
                Object.entries(state.data.studentPayments).map(
                  ([studentId, payments]) => [
                    studentId,
                    payments.map((payment) =>
                      payment.id === paymentId
                        ? { ...payment, status }
                        : payment,
                    ),
                  ],
                ),
              ),
              financialSummary: updateSummaryForPaymentStatus(
                state.data.financialSummary,
                currentPayment,
                status,
              ),
            },
          }));
        },
        rollback: (snapshot) => {
          set((state) => ({
            data: {
              ...state.data,
              payments: snapshot.payments,
              studentPayments: snapshot.studentPayments,
              financialSummary: snapshot.financialSummary,
            },
          }));
        },
        execute: async () => {
          const response = await apiClient.patch<{ payment: unknown }>(
            `/api/gyms/payments/${paymentId}`,
            { status },
          );
          return response.data.payment;
        },
        onSuccess: (result, snapshot) => {
          const payment = normalizePaymentSnapshot(result, currentPayment);
          set((state) => ({
            data: {
              ...state.data,
              payments: state.data.payments.map((item) =>
                item.id === paymentId ? payment : item,
              ),
              studentPayments: Object.fromEntries(
                Object.entries(state.data.studentPayments).map(
                  ([studentId, payments]) => [
                    studentId,
                    payments.map((item) =>
                      item.id === paymentId ? payment : item,
                    ),
                  ],
                ),
              ),
              financialSummary: updateSummaryForPaymentStatus(
                snapshot.financialSummary,
                currentPayment,
                payment.status,
              ),
            },
          }));
        },
      });
    },

    updateMemberStatus: async (membershipId, status) => {
      await runOptimisticMutation({
        getSnapshot: () => ({
          students: get().data.students,
          studentDetails: get().data.studentDetails,
        }),
        applyOptimistic: () => {
          set((state) => ({
            data: {
              ...state.data,
              students: state.data.students.map((student) =>
                student.gymMembership?.id === membershipId
                  ? {
                      ...student,
                      membershipStatus: toStudentMembershipStatus(status),
                      gymMembership: student.gymMembership
                        ? { ...student.gymMembership, status }
                        : student.gymMembership,
                    }
                  : student,
              ),
              studentDetails: Object.fromEntries(
                Object.entries(state.data.studentDetails).map(
                  ([studentId, student]) => [
                    studentId,
                    student?.gymMembership?.id === membershipId
                      ? {
                          ...student,
                          membershipStatus: toStudentMembershipStatus(status),
                          gymMembership: student.gymMembership
                            ? { ...student.gymMembership, status }
                            : student.gymMembership,
                        }
                      : student,
                  ],
                ),
              ),
            },
          }));
        },
        rollback: (snapshot) => {
          set((state) => ({
            data: {
              ...state.data,
              students: snapshot.students,
              studentDetails: snapshot.studentDetails,
            },
          }));
        },
        execute: async () => {
          const response = await apiClient.patch<{
            success: true;
            membership: {
              status?: "active" | "suspended" | "canceled" | "pending";
            };
          }>(`/api/gyms/members/${membershipId}`, { status });
          return response.data.membership;
        },
        onSuccess: (membership) => {
          const resolvedStatus = membership.status ?? status;
          set((state) => ({
            data: {
              ...state.data,
              students: state.data.students.map((student) =>
                student.gymMembership?.id === membershipId
                  ? {
                      ...student,
                      membershipStatus:
                        toStudentMembershipStatus(resolvedStatus),
                      gymMembership: student.gymMembership
                        ? { ...student.gymMembership, status: resolvedStatus }
                        : student.gymMembership,
                    }
                  : student,
              ),
              studentDetails: Object.fromEntries(
                Object.entries(state.data.studentDetails).map(
                  ([studentId, student]) => [
                    studentId,
                    student?.gymMembership?.id === membershipId
                      ? {
                          ...student,
                          membershipStatus:
                            toStudentMembershipStatus(resolvedStatus),
                          gymMembership: student.gymMembership
                            ? {
                                ...student.gymMembership,
                                status: resolvedStatus,
                              }
                            : student.gymMembership,
                        }
                      : student,
                  ],
                ),
              ),
            },
          }));
        },
      });
    },

    createEquipment: async (payload) => {
      const response = await apiClient.post<{ equipment: unknown }>(
        "/api/gyms/equipment",
        payload,
      );
      const equipment = normalizeEquipmentItem(response.data.equipment);

      set((state) => ({
        data: {
          ...state.data,
          equipment: [
            equipment,
            ...state.data.equipment.filter((item) => item.id !== equipment.id),
          ],
          profile: state.data.profile
            ? {
                ...state.data.profile,
                equipmentCount: state.data.profile.equipmentCount + 1,
              }
            : state.data.profile,
        },
      }));

      return equipment;
    },

    updateEquipment: async (equipmentId, payload) => {
      const previous = get().data.equipment;
      const result = await runOptimisticMutation({
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
          const response = await apiClient.patch<{ equipment: unknown }>(
            `/api/gyms/equipment/${equipmentId}`,
            payload,
          );
          return response.data.equipment;
        },
        onSuccess: (result) => {
          const equipment = normalizeEquipmentItem(result);
          set((state) => ({
            data: {
              ...state.data,
              equipment: state.data.equipment.map((item) =>
                item.id === equipmentId ? equipment : item,
              ),
            },
          }));
        },
      });

      return normalizeEquipmentItem(result);
    },

    createMaintenance: async (equipmentId, payload) => {
      const response = await apiClient.post<{ record: unknown }>(
        `/api/gyms/equipment/${equipmentId}/maintenance`,
        payload,
      );
      const record = normalizeMaintenanceSnapshot(response.data.record);

      set((state) => ({
        data: {
          ...state.data,
          equipment: state.data.equipment.map((equipment) =>
            equipment.id === equipmentId
              ? {
                  ...equipment,
                  status: "available",
                  lastMaintenance: record.date,
                  nextMaintenance: record.nextScheduled,
                  maintenanceHistory: [record, ...equipment.maintenanceHistory],
                }
              : equipment,
          ),
        },
      }));

      return record;
    },

    createMembershipPlan: async (payload) => {
      await apiClient.post("/api/gyms/plans", payload);
    },

    updateMembershipPlan: async (planId, payload) => {
      await apiClient.patch(`/api/gyms/plans/${planId}`, payload);
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
            `/api/gyms/coupons?couponId=${encodeURIComponent(couponId)}`,
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
          }>("/api/gyms/boost-campaigns", payload);
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
            `/api/gyms/boost-campaigns?campaignId=${encodeURIComponent(campaignId)}`,
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
      }>(`/api/gyms/boost-campaigns/${campaignId}/pix`);
      return response.data;
    },

    createWithdraw: async ({ amountCents, fake }) => {
      const previous = get().data.balanceWithdraws;
      const tempId = `temp-withdraw-${Date.now()}`;
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
                    id: tempId,
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
        onSuccess: async (result) => {
          set((state) => ({
            data: {
              ...state.data,
              balanceWithdraws: {
                ...state.data.balanceWithdraws,
                withdraws: state.data.balanceWithdraws.withdraws.map(
                  (withdraw) =>
                    withdraw.id === tempId
                      ? {
                          ...withdraw,
                          id: result.withdraw.id,
                          amount: result.withdraw.amount,
                          status: result.withdraw.status,
                        }
                      : withdraw,
                ),
              },
            },
          }));
        },
      });
    },

    enrollStudent: async (payload) => {
      const { studentSnapshot, ...requestPayload } = payload;
      const response = await apiClient.post<EnrollmentResponse>(
        "/api/gyms/members",
        requestPayload,
      );
      const membership = normalizeGymDates(
        response.data.membership,
      ) as EnrollmentResponse["membership"];
      const resolvedStudentSnapshot: EnrollmentStudentSnapshot = {
        id: requestPayload.studentId,
        name:
          studentSnapshot?.name ?? membership.student?.user?.name ?? "Aluno",
        email: studentSnapshot?.email ?? membership.student?.user?.email ?? "",
        avatar: studentSnapshot?.avatar,
        age: studentSnapshot?.age,
        gender: studentSnapshot?.gender,
        currentLevel: studentSnapshot?.currentLevel,
        currentStreak: studentSnapshot?.currentStreak,
      };
      const placeholderStudent = buildEnrolledStudentPlaceholder(
        resolvedStudentSnapshot,
        membership,
        get().data.profile,
      );
      const pendingPayment = response.data.pendingPayment
        ? normalizePaymentSnapshot(
            {},
            {
              id: `pending-membership-${membership.id}`,
              studentId: requestPayload.studentId,
              studentName: resolvedStudentSnapshot.name,
              planId: membership.plan?.id ?? "",
              planName: membership.plan?.name ?? "Plano",
              amount: membership.amount ?? requestPayload.amount,
              dueDate:
                membership.nextBillingDate instanceof Date
                  ? membership.nextBillingDate
                  : membership.nextBillingDate
                    ? new Date(membership.nextBillingDate)
                    : new Date(),
              date: new Date(),
              status: "pending",
              paymentMethod: "pix",
            },
          )
        : null;

      set((state) => {
        const alreadyExists = state.data.students.some(
          (student) => student.id === requestPayload.studentId,
        );
        const nextStudentDetails = {
          ...state.data.studentDetails,
          [requestPayload.studentId]: state.data.studentDetails[
            requestPayload.studentId
          ]
            ? ({
                ...state.data.studentDetails[requestPayload.studentId],
                membershipStatus: placeholderStudent.membershipStatus,
                gymMembership: placeholderStudent.gymMembership,
              } as StudentData)
            : placeholderStudent,
        };

        return {
          data: {
            ...state.data,
            students: alreadyExists
              ? state.data.students.map((student) =>
                  student.id === requestPayload.studentId
                    ? {
                        ...student,
                        membershipStatus: placeholderStudent.membershipStatus,
                        gymMembership: placeholderStudent.gymMembership,
                      }
                    : student,
                )
              : [placeholderStudent, ...state.data.students],
            studentDetails: nextStudentDetails,
            payments: pendingPayment
              ? [
                  pendingPayment,
                  ...state.data.payments.filter(
                    (payment) => payment.id !== pendingPayment.id,
                  ),
                ]
              : state.data.payments,
            studentPayments: pendingPayment
              ? {
                  ...state.data.studentPayments,
                  [requestPayload.studentId]: [
                    pendingPayment,
                    ...(
                      state.data.studentPayments[requestPayload.studentId] ?? []
                    ).filter((payment) => payment.id !== pendingPayment.id),
                  ],
                }
              : state.data.studentPayments,
            financialSummary:
              pendingPayment && state.data.financialSummary
                ? {
                    ...state.data.financialSummary,
                    pendingPayments:
                      state.data.financialSummary.pendingPayments +
                      pendingPayment.amount,
                  }
                : state.data.financialSummary,
            profile: state.data.profile
              ? {
                  ...state.data.profile,
                  totalStudents:
                    state.data.profile.totalStudents + (alreadyExists ? 0 : 1),
                  activeStudents:
                    state.data.profile.activeStudents +
                    (alreadyExists || membership.status !== "active" ? 0 : 1),
                }
              : state.data.profile,
            stats: state.data.stats
              ? {
                  ...state.data.stats,
                  week: {
                    ...state.data.stats.week,
                    newMembers:
                      state.data.stats.week.newMembers +
                      (alreadyExists ? 0 : 1),
                  },
                }
              : state.data.stats,
          },
        };
      });

      return response.data;
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
