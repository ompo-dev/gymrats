/**
 * Helpers de carregamento para gym-unified-store.
 */

import { getGymBootstrapRequest } from "@/lib/api/bootstrap";
import { actionClient as apiClient } from "@/lib/actions/client";
import type {
  GymDataSection,
  GymPendingAction,
  GymUnifiedData,
} from "@/lib/types/gym-unified";
import { normalizeGymDates } from "@/lib/utils/date-safe";
import { normalizeEquipmentList } from "@/lib/utils/gym/normalize-equipment";

export const SECTION_ROUTES: Record<GymDataSection, string> = {
  profile: "/api/gyms/profile",
  stats: "/api/gyms/stats",
  students: "/api/gyms/members?status=all",
  equipment: "/api/gyms/equipment",
  financialSummary: "/api/gyms/financial-summary",
  recentCheckIns: "/api/gyms/checkins/recent",
  membershipPlans: "/api/gyms/plans",
  payments: "/api/gyms/payments",
  expenses: "/api/gyms/expenses",
  coupons: "/api/gyms/coupons",
  campaigns: "/api/gyms/boost-campaigns",
  balanceWithdraws: "/api/gyms/withdraws",
  subscription: "/api/gym-subscriptions/current",
};

function withFreshParam(route: string, force = false) {
  if (!force) {
    return route;
  }

  return `${route}${route.includes("?") ? "&" : "?"}fresh=1`;
}

const loadingSections = new Set<GymDataSection>();
const loadingPromises = new Map<
  GymDataSection,
  Promise<Partial<GymUnifiedData>>
>();
let currentFetchGeneration = 0;

interface MemberWithStudent {
  student: {
    id: string;
    user?: { name?: string; email?: string; image?: string };
    avatar?: string;
    name?: string;
    email?: string;
    age?: number;
    gender?: string;
    phone?: string;
    profile?: Record<string, unknown>;
    progress?: Record<string, unknown>;
  };
  studentId?: string;
  studentName?: string;
  status?: string;
  membershipStatus?: string;
  createdAt: Date;
  joinDate?: Date;
  plan?: { name?: string };
}

function transformMembersToStudents(members: MemberWithStudent[]): Array<
  Partial<import("@/lib/types").StudentData> & {
    id: string;
    name: string;
    email: string;
  }
> {
  return members.map((m) => {
    const student = m.student ?? m;
    const user = student.user ?? {};
    const profile = student.profile ?? {};
    const progress = student.progress ?? {};
    const status =
      m.status ??
      (m as { membershipStatus?: string }).membershipStatus ??
      "active";
    const membershipStatus =
      status === "active"
        ? "active"
        : status === "suspended"
          ? "suspended"
          : "inactive";
    return {
      id:
        student.id ??
        (m as unknown as { studentId?: string }).studentId ??
        (m as unknown as { id?: string }).id ??
        "",
      name: (user.name as string) ?? (student.name as string) ?? "",
      email: (user.email as string) ?? (student.email as string) ?? "",
      avatar: (student.avatar ?? user.image) as string | undefined,
      age: (student.age as number) ?? 0,
      gender: (student.gender as string) ?? "",
      phone: (student.phone as string) ?? "",
      membershipStatus,
      joinDate: m.createdAt ?? (m as { joinDate?: Date }).joinDate,
      totalVisits: (progress.workoutsCompleted as number) ?? 0,
      currentStreak: (progress.currentStreak as number) ?? 0,
      currentWeight: (profile.weight as number) ?? 0,
      attendanceRate: 0,
      profile: {
        id: student.id,
        height: (profile.height as number) ?? 0,
        weight: (profile.weight as number) ?? 0,
        fitnessLevel: (profile.fitnessLevel as string) ?? "beginner",
        goals: Array.isArray(profile.goals)
          ? profile.goals
          : typeof profile.goals === "string"
            ? (() => {
                try {
                  return JSON.parse(profile.goals) ?? [];
                } catch {
                  return [];
                }
              })()
            : [],
        weeklyWorkoutFrequency: (profile.weeklyWorkoutFrequency as number) ?? 0,
      },
      progress: {
        currentStreak: (progress.currentStreak as number) ?? 0,
        totalXP: (progress.totalXP as number) ?? 0,
        currentLevel: (progress.currentLevel as number) ?? 1,
        xpToNextLevel: (progress.xpToNextLevel as number) ?? 100,
        weeklyXP: Array.isArray(progress.weeklyXP)
          ? progress.weeklyXP
          : [0, 0, 0, 0, 0, 0, 0],
      },
      workoutHistory: [],
      personalRecords: [],
      weightHistory: [],
      favoriteEquipment: [],
    };
  }) as unknown as Array<
    Partial<import("@/lib/types").StudentData> & {
      id: string;
      name: string;
      email: string;
    }
  >;
}

export function transformSectionResponse(
  section: GymDataSection,
  data: Record<string, import("@/lib/types/api-error").JsonValue>,
): Partial<GymUnifiedData> {
  let result: Partial<GymUnifiedData>;
  switch (section) {
    case "profile":
      result = { profile: (data.profile as GymUnifiedData["profile"]) || null };
      break;
    case "stats":
      result = { stats: (data.stats as GymUnifiedData["stats"]) || null };
      break;
    case "students":
      result = {
        students: transformMembersToStudents(
          (data.members as unknown as MemberWithStudent[]) || [],
        ) as import("@/lib/types").StudentData[],
      };
      break;
    case "equipment":
      result = {
        equipment: normalizeEquipmentList(
          data.equipment as unknown as GymUnifiedData["equipment"],
        ) as GymUnifiedData["equipment"],
      };
      break;
    case "financialSummary":
      result = {
        financialSummary:
          (data.summary as GymUnifiedData["financialSummary"]) || null,
      };
      break;
    case "recentCheckIns":
      result = {
        recentCheckIns:
          (data.checkIns as unknown as GymUnifiedData["recentCheckIns"]) || [],
      };
      break;
    case "membershipPlans":
      result = {
        membershipPlans:
          (data.plans as unknown as GymUnifiedData["membershipPlans"]) || [],
      };
      break;
    case "payments":
      result = {
        payments: (
          (data.payments as Array<
            Record<string, import("@/lib/types/api-error").JsonValue>
          >) || []
        ).map((p) => ({
          id: String(p.id ?? ""),
          studentId: String(p.studentId ?? ""),
          studentName: String(p.studentName ?? ""),
          planId: (p.planId as string) || "",
          planName:
            (p.plan as { name?: string })?.name ?? (p.planName as string) ?? "",
          amount: Number(p.amount ?? 0),
          date: p.date as string | Date,
          dueDate: p.dueDate as string | Date | undefined,
          status: (p.withdrawnAt ? "withdrawn" : (p.status as string)) as
            | "paid"
            | "pending"
            | "overdue"
            | "canceled"
            | "withdrawn",
          paymentMethod: (p.paymentMethod as string) || "pix",
          reference: (p.reference as string) ?? undefined,
          abacatePayBillingId: (p.abacatePayBillingId as string) ?? undefined,
          withdrawnAt: (p.withdrawnAt as unknown as Date) ?? undefined,
          withdrawId: (p.withdrawId as string) ?? undefined,
        })) as import("@/lib/types").Payment[],
      };
      break;
    case "expenses":
      result = {
        expenses:
          (data.expenses as unknown as GymUnifiedData["expenses"]) || [],
      };
      break;
    case "coupons":
      result = {
        coupons: (data.coupons as unknown as GymUnifiedData["coupons"]) || [],
      };
      break;
    case "campaigns":
      result = {
        campaigns:
          (data.campaigns as unknown as GymUnifiedData["campaigns"]) || [],
      };
      break;
    case "balanceWithdraws": {
      const rawWithdraws = Array.isArray(data.withdraws)
        ? (data.withdraws as Array<
            Record<string, import("@/lib/types/api-error").JsonValue>
          >)
        : [];
      result = {
        balanceWithdraws: {
          balanceReais: Number(data.balanceReais ?? 0),
          balanceCents: Number(data.balanceCents ?? 0),
          withdraws: rawWithdraws.map((withdraw) => ({
            id: String(withdraw.id ?? ""),
            amount: Number(withdraw.amount ?? 0),
            pixKey: String(withdraw.pixKey ?? ""),
            pixKeyType: String(withdraw.pixKeyType ?? ""),
            externalId: String(withdraw.externalId ?? ""),
            status: String(withdraw.status ?? ""),
            createdAt: withdraw.createdAt as unknown as Date,
            completedAt:
              (withdraw.completedAt as unknown as Date | null | undefined) ??
              null,
          })),
        },
      };
      break;
    }
    case "subscription":
      result = {
        subscription:
          (data.subscription as GymUnifiedData["subscription"]) || null,
      };
      break;
    default:
      result = {};
  }
  return normalizeGymDates(result) as Partial<GymUnifiedData>;
}

export type SetStateFn = (
  fn: (s: { data: GymUnifiedData }) => { data: GymUnifiedData },
) => void;

export async function loadSection(
  section: GymDataSection,
  force = false,
): Promise<Partial<GymUnifiedData>> {
  if (force) {
    loadingSections.delete(section);
    loadingPromises.delete(section);
  }
  if (loadingSections.has(section) && loadingPromises.has(section)) {
    return loadingPromises.get(section)!;
  }
  loadingSections.add(section);

  // Guardar geração atual para evitar que requisições antigas sobrescrevam a store
  // caso o usuário mude de academia enquanto a request está em andamento.
  const expectedGeneration = currentFetchGeneration;

  const route = withFreshParam(SECTION_ROUTES[section], force);
  const promise = (async () => {
    try {
      const response = await apiClient.get(route, { timeout: 30000 });

      // Abortar se a geração mudou entre o inicio e o fim do fetch!
      if (currentFetchGeneration !== expectedGeneration) {
        return {};
      }

      return transformSectionResponse(
        section,
        response.data as Record<
          string,
          import("@/lib/types/api-error").JsonValue
        >,
      );
    } catch (error) {
      const err = error as { response?: { status?: number } };
      const isExpectedHttp =
        err?.response?.status === 404 || (err?.response?.status ?? 0) >= 500;
      if (!isExpectedHttp) {
        console.error(`[gym-unified] erro ao carregar ${section}:`, error);
      }
      return {};
    } finally {
      // Limpar os mapas desde que não tenham sido limpos por clearLoadingState
      if (currentFetchGeneration === expectedGeneration) {
        loadingSections.delete(section);
        loadingPromises.delete(section);
      }
    }
  })();
  loadingPromises.set(section, promise);
  return promise;
}

async function loadGymBootstrap(
  sections: GymDataSection[],
): Promise<Partial<GymUnifiedData>> {
  const response = await getGymBootstrapRequest(sections);
  const normalizedData = normalizeGymDates(
    response.data ?? {},
  ) as Partial<GymUnifiedData>;

  if ("equipment" in normalizedData) {
    normalizedData.equipment = normalizeEquipmentList(normalizedData.equipment);
  }

  return normalizedData;
}

export function updateStoreWithSection(
  set: SetStateFn,
  sectionData: Partial<GymUnifiedData>,
  elapsedMs?: number,
  sectionName?: GymDataSection,
) {
  set((state: { data: GymUnifiedData }) => ({
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

export async function loadSectionsIncremental(
  set: SetStateFn,
  sections: GymDataSection[],
) {
  if (sections.length === 0) {
    return;
  }

  const bootstrapData = await loadGymBootstrap(sections);
  if (Object.keys(bootstrapData).length > 0) {
    updateStoreWithSection(set, bootstrapData);
  }
}

export function addPendingAction(
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

export function clearLoadingState() {
  currentFetchGeneration++; // Invalida qualquer request em andamento
  loadingSections.clear();
  loadingPromises.clear();
}
