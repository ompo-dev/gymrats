/**
 * Helpers de carregamento para student-unified-store.
 * Extraído para reduzir tamanho do store principal.
 */

import { getStudentBootstrapRequest } from "@/lib/api/bootstrap";
import { actionClient as apiClient } from "@/lib/actions/client";
import type { Meal } from "@/lib/types";
import type {
  StudentData,
  StudentDataSection,
  WeightHistoryItem,
} from "@/lib/types/student-unified";
import { normalizeDailyNutrition } from "@/lib/utils/nutrition/nutrition-plan";
import { normalizeStudentSectionData } from "@/lib/utils/student/normalize-student-data";

type SetStateFn = (
  fn: (s: { data: StudentData }) => { data: StudentData },
) => void;

export function formatMemberSince(
  date: Date | string | null | undefined,
): string {
  if (!date) return "Jan 2025";
  const d = typeof date === "string" ? new Date(date) : date;
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
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export const SECTION_ROUTES: Partial<Record<StudentDataSection, string>> = {
  user: "/api/auth/session",
  student: "/api/students/student",
  progress: "/api/students/progress",
  profile: "/api/students/profile",
  weightHistory: "/api/students/weight",
  units: "/api/workouts/units",
  weeklyPlan: "/api/workouts/weekly-plan",
  libraryPlans: "/api/workouts/library",
  activeNutritionPlan: "/api/nutrition/active",
  nutritionLibraryPlans: "/api/nutrition/library",
  workoutHistory: "/api/workouts/history",
  personalRecords: "/api/students/personal-records",
  subscription: "/api/subscriptions/current",
  memberships: "/api/memberships",
  payments: "/api/payments",
  paymentMethods: "/api/payment-methods",
  referral: "/api/students/referrals",
  dayPasses: "/api/students/day-passes",
  friends: "/api/students/friends",
  gymLocations: "/api/gyms/locations",
  dailyNutrition: "/api/nutrition/daily",
};

const loadingSections = new Set<StudentDataSection>();
const loadingPromises = new Map<
  StudentDataSection,
  Promise<Partial<StudentData>>
>();

function transformSectionResponse(
  section: StudentDataSection,
  data: Record<string, unknown>,
): Partial<StudentData> {
  const d = data as Record<string, unknown>;
  switch (section) {
    case "user": {
      const userData = (d.user || d) as Record<string, unknown>;
      const username =
        (userData.username as string) ||
        (userData.email
          ? `@${(userData.email as string).split("@")[0].toLowerCase()}`
          : "@usuario");
      return {
        user: {
          id: (userData.id as string) || "",
          name: (userData.name as string) || "",
          email: (userData.email as string) || "",
          username,
          memberSince:
            (userData.memberSince as string) ||
            formatMemberSince(
              userData.createdAt as Date | string | null | undefined,
            ),
          avatar: (userData.avatar || userData.image) as string | undefined,
          role: (userData.role as "STUDENT" | "ADMIN" | "GYM") || "STUDENT",
          isAdmin: userData.role === "ADMIN" || (userData.isAdmin as boolean),
        },
      };
    }
    case "student":
      return { student: d as unknown as StudentData["student"] };
    case "profile":
      return { profile: (d.profile || d) as unknown as StudentData["profile"] };
    case "progress":
      return { progress: d as unknown as StudentData["progress"] };
    case "weightHistory":
      if (Array.isArray(d)) {
        return { weightHistory: d as unknown as WeightHistoryItem[] };
      }
      if (d.history && Array.isArray(d.history))
        return { weightHistory: d.history as unknown as WeightHistoryItem[] };
      return {
        weightHistory:
          (d.weightHistory as unknown as WeightHistoryItem[] | undefined) || [],
      };
    case "units":
      return {
        units: Array.isArray(d)
          ? (d as unknown as StudentData["units"])
          : (d.units as unknown as StudentData["units"]) || [],
      };
    case "weeklyPlan":
      return {
        weeklyPlan:
          (d.weeklyPlan as unknown as StudentData["weeklyPlan"] | undefined) ??
          null,
      };
    case "libraryPlans":
      return {
        libraryPlans: Array.isArray(d)
          ? (d as unknown as StudentData["libraryPlans"])
          : (((d.libraryPlans as unknown) ||
              (d.data as unknown) ||
              []) as StudentData["libraryPlans"]),
      };
    case "workoutHistory":
      if (Array.isArray(d)) {
        return {
          workoutHistory: d as unknown as StudentData["workoutHistory"],
        };
      }
      if (d.history && Array.isArray(d.history))
        return {
          workoutHistory: d.history as unknown as StudentData["workoutHistory"],
        };
      return {
        workoutHistory:
          (d.workoutHistory as unknown as StudentData["workoutHistory"]) || [],
      };
    case "personalRecords":
      return {
        personalRecords: (d.records ||
          d.personalRecords ||
          []) as StudentData["personalRecords"],
      };
    case "activeNutritionPlan":
      return {
        activeNutritionPlan: ((d.data as unknown) ||
          (d.activeNutritionPlan as unknown) ||
          null) as StudentData["activeNutritionPlan"],
      };
    case "nutritionLibraryPlans":
      return {
        nutritionLibraryPlans: Array.isArray(d)
          ? (d as unknown as StudentData["nutritionLibraryPlans"])
          : (((d.nutritionLibraryPlans as unknown) ||
              (d.data as unknown) ||
              []) as StudentData["nutritionLibraryPlans"]),
      };
    case "dailyNutrition":
      return {
        dailyNutrition: normalizeDailyNutrition(
          d as Partial<StudentData["dailyNutrition"]>,
        ),
      };
    case "subscription": {
      if (d && typeof d === "object" && "success" in d) {
        const payload = d as {
          subscription?: StudentData["subscription"] | null;
          isFirstPayment?: boolean;
        };
        const sub = payload.subscription;
        const isFirstPayment = payload.isFirstPayment ?? true;
        return {
          subscription: sub
            ? ({
                ...sub,
                isFirstPayment,
              } as unknown as StudentData["subscription"])
            : null,
        };
      }
      return {
        subscription: (d as unknown as StudentData["subscription"]) || null,
      };
    }
    case "memberships":
      return {
        memberships: Array.isArray(d)
          ? (d as unknown as StudentData["memberships"])
          : (d.memberships as unknown as StudentData["memberships"]) || [],
      };
    case "payments":
      return {
        payments: Array.isArray(d)
          ? (d as unknown as StudentData["payments"])
          : (d.payments as unknown as StudentData["payments"]) || [],
      };
    case "paymentMethods":
      return {
        paymentMethods: Array.isArray(d)
          ? (d as unknown as StudentData["paymentMethods"])
          : (d.paymentMethods as unknown as StudentData["paymentMethods"]) ||
            [],
      };
    case "referral":
      return {
        referral: (d.referral || d) as unknown as StudentData["referral"],
      };
    case "dayPasses":
      return {
        dayPasses: ((d.dayPasses as unknown) || []) as StudentData["dayPasses"],
      };
    case "friends":
      return { friends: d as unknown as StudentData["friends"] };
    case "gymLocations":
      return {
        gymLocations: Array.isArray(d)
          ? (d as unknown as StudentData["gymLocations"])
          : (((d.gymLocations as unknown) ||
              (d.gyms as unknown) ||
              []) as StudentData["gymLocations"]),
      };
    default:
      return { [section]: d } as unknown as Partial<StudentData>;
  }
}

export function calculateWeightGain(
  weightHistory: WeightHistoryItem[],
): number | null {
  if (!weightHistory?.length) return null;
  const currentWeight = weightHistory[0].weight;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const weightOneMonthAgo = weightHistory.find((wh) => {
    const whDate = new Date(wh.date);
    return whDate <= oneMonthAgo;
  });
  return weightOneMonthAgo ? currentWeight - weightOneMonthAgo.weight : null;
}

export function deduplicateMeals(meals: Meal[]): Meal[] {
  if (!meals?.length) return [];
  const seen = new Set<string>();
  const unique: Meal[] = [];
  for (const meal of meals) {
    const key = meal.id
      ? `id:${meal.id}`
      : `${meal.name || ""}:${meal.type || ""}:${(meal.time as string) || ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(meal);
    }
  }
  return unique;
}

export function updateStoreWithSection(
  set: SetStateFn,
  sectionData: Partial<StudentData>,
): void {
  const normalizedSectionData = normalizeStudentSectionData(sectionData);

  set((state) => {
    const newState = { ...state.data };
    if (normalizedSectionData.user)
      newState.user = { ...newState.user, ...normalizedSectionData.user };
    if (normalizedSectionData.student)
      newState.student = {
        ...newState.student,
        ...normalizedSectionData.student,
      };
    if (normalizedSectionData.progress)
      newState.progress = {
        ...newState.progress,
        ...normalizedSectionData.progress,
      };
    if (normalizedSectionData.profile)
      newState.profile = {
        ...newState.profile,
        ...normalizedSectionData.profile,
      };
    if (normalizedSectionData.weightHistory) {
      newState.weightHistory = normalizedSectionData.weightHistory;
      if (normalizedSectionData.weightHistory.length > 0) {
        newState.weightGain =
          normalizedSectionData.weightGain ??
          calculateWeightGain(normalizedSectionData.weightHistory);
        if (
          !newState.profile?.weight &&
          normalizedSectionData.weightHistory[0]
        ) {
          newState.profile = {
            ...newState.profile,
            weight: normalizedSectionData.weightHistory[0].weight,
          };
        }
      }
    }
    if (normalizedSectionData.units !== undefined)
      newState.units = normalizedSectionData.units;
    if (normalizedSectionData.weeklyPlan !== undefined)
      newState.weeklyPlan = normalizedSectionData.weeklyPlan;
    if (normalizedSectionData.libraryPlans !== undefined)
      newState.libraryPlans = normalizedSectionData.libraryPlans;
    if (normalizedSectionData.workoutHistory !== undefined)
      newState.workoutHistory = normalizedSectionData.workoutHistory;
    if (normalizedSectionData.personalRecords !== undefined)
      newState.personalRecords = normalizedSectionData.personalRecords;
    if (normalizedSectionData.activeNutritionPlan !== undefined)
      newState.activeNutritionPlan = normalizedSectionData.activeNutritionPlan;
    if (normalizedSectionData.nutritionLibraryPlans !== undefined)
      newState.nutritionLibraryPlans =
        normalizedSectionData.nutritionLibraryPlans;
    if (normalizedSectionData.subscription !== undefined)
      newState.subscription = normalizedSectionData.subscription;
    if (normalizedSectionData.memberships !== undefined)
      newState.memberships = normalizedSectionData.memberships;
    if (normalizedSectionData.payments !== undefined)
      newState.payments = normalizedSectionData.payments;
    if (normalizedSectionData.paymentMethods !== undefined)
      newState.paymentMethods = normalizedSectionData.paymentMethods;
    if (normalizedSectionData.referral !== undefined)
      newState.referral = normalizedSectionData.referral;
    if (normalizedSectionData.dayPasses !== undefined)
      newState.dayPasses = normalizedSectionData.dayPasses;
    if (normalizedSectionData.friends !== undefined)
      newState.friends = normalizedSectionData.friends;
    if (normalizedSectionData.gymLocations !== undefined)
      newState.gymLocations = normalizedSectionData.gymLocations;
    if (normalizedSectionData.dailyNutrition !== undefined)
      newState.dailyNutrition = normalizedSectionData.dailyNutrition;
    return { data: newState };
  });
}

export function hydrateStudentBootstrapData(
  set: SetStateFn,
  sectionData: Partial<StudentData>,
): void {
  updateStoreWithSection(set, sectionData);
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
}

async function loadStudentBootstrap(
  sections: StudentDataSection[],
): Promise<Partial<StudentData>> {
  const response = await getStudentBootstrapRequest(sections);
  return normalizeStudentSectionData(response.data ?? {});
}

export async function loadSection(
  section: StudentDataSection,
  options: boolean | { force?: boolean; fresh?: boolean } = false,
): Promise<Partial<StudentData>> {
  const normalizedOptions =
    typeof options === "boolean" ? { force: options } : options;
  const forceReload = normalizedOptions.force ?? false;
  const bypassCache = normalizedOptions.fresh ?? false;

  if (forceReload) {
    loadingSections.delete(section);
    loadingPromises.delete(section);
  }
  if (loadingSections.has(section) && loadingPromises.has(section)) {
    const p = loadingPromises.get(section);
    if (p) return p;
  }
  loadingSections.add(section);
  const route = SECTION_ROUTES[section];
  const loadPromise = (async () => {
    try {
      if (!route) return {};
      const response = await apiClient
        .get<Record<string, string | number | boolean | object | null>>(
          route,
          {
            timeout: 30000,
            ...(bypassCache ? { fresh: true } : {}),
          },
        )
        .catch(
          (err: {
            _isHandled?: boolean;
            _isSilent?: boolean;
            code?: string;
            message?: string;
            response?: { status?: number };
          }) => {
            if (err._isHandled || err._isSilent) return null;
            if (err.code === "ECONNABORTED" || err.message?.includes("timeout"))
              return null;
            if (err.response?.status && err.response.status >= 400) return null;
            throw err;
          },
        );
      if (!response) return {};
      return transformSectionResponse(section, response.data);
    } finally {
      loadingSections.delete(section);
      loadingPromises.delete(section);
    }
  })();
  loadingPromises.set(section, loadPromise);
  return loadPromise;
}

export async function loadSectionsIncremental(
  set: SetStateFn,
  sections: StudentDataSection[],
  _skipNutrition = false,
): Promise<void> {
  if (sections.length === 0) {
    return;
  }

  const bootstrapData = await loadStudentBootstrap(sections);
  if (Object.keys(bootstrapData).length > 0) {
    updateStoreWithSection(set, bootstrapData);
  }
}

const ALL_SECTIONS: StudentDataSection[] = [
  "user",
  "student",
  "progress",
  "units",
  "weeklyPlan",
  "libraryPlans",
  "activeNutritionPlan",
  "nutritionLibraryPlans",
  "profile",
  "weightHistory",
  "workoutHistory",
  "personalRecords",
  "subscription",
  "memberships",
  "payments",
  "paymentMethods",
  "referral",
  "dayPasses",
  "friends",
  "gymLocations",
];

export async function loadAllDataIncremental(set: SetStateFn): Promise<void> {
  await loadSectionsIncremental(set, ALL_SECTIONS);
}
