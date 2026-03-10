/**
 * Helpers de carregamento para student-unified-store.
 * Extraído para reduzir tamanho do store principal.
 */

import { apiClient } from "@/lib/api/client";
import type { Meal } from "@/lib/types";
import type {
  StudentData,
  StudentDataSection,
  WeightHistoryItem,
} from "@/lib/types/student-unified";
import { getBrazilNutritionDateKey } from "@/lib/utils/brazil-nutrition-date";

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
};

const loadingSections = new Set<StudentDataSection>();
const loadingPromises = new Map<
  StudentDataSection,
  Promise<Partial<StudentData>>
>();

function transformSectionResponse(
  section: StudentDataSection,
  data: Record<string, string | number | boolean | object | null>,
): Partial<StudentData> {
  const d = data as Record<string, import("@/lib/types/api-error").JsonValue>;
  switch (section) {
    case "user": {
      const userData = (d.user || d) as Record<
        string,
        import("@/lib/types/api-error").JsonValue
      >;
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
            formatMemberSince(userData.createdAt as Date),
          avatar: (userData.avatar || userData.image) as string | undefined,
          role: (userData.role as "STUDENT" | "ADMIN" | "GYM") || "STUDENT",
          isAdmin: userData.role === "ADMIN" || (userData.isAdmin as boolean),
        },
      };
    }
    case "student":
      return { student: d as StudentData["student"] };
    case "profile":
      return { profile: (d.profile || d) as StudentData["profile"] };
    case "progress":
      return { progress: d as StudentData["progress"] };
    case "weightHistory":
      if (Array.isArray(d)) return { weightHistory: d };
      if (d.history && Array.isArray(d.history))
        return { weightHistory: d.history };
      return { weightHistory: (d.weightHistory as WeightHistoryItem[]) || [] };
    case "units":
      return { units: Array.isArray(d) ? d : d.units || [] };
    case "weeklyPlan":
      return { weeklyPlan: d?.weeklyPlan ?? null };
    case "libraryPlans":
      return {
        libraryPlans: Array.isArray(d) ? d : (d.libraryPlans || d.data || []) as StudentData["libraryPlans"],
      };
    case "workoutHistory":
      if (Array.isArray(d)) return { workoutHistory: d };
      if (d.history && Array.isArray(d.history))
        return { workoutHistory: d.history };
      return { workoutHistory: d.workoutHistory || [] };
    case "personalRecords":
      return {
        personalRecords: (d.records ||
          d.personalRecords ||
          []) as StudentData["personalRecords"],
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
            ? ({ ...sub, isFirstPayment } as StudentData["subscription"])
            : null,
        };
      }
      return { subscription: (d as StudentData["subscription"]) || null };
    }
    case "memberships":
      return {
        memberships: Array.isArray(d) ? d : d.memberships || [],
      };
    case "payments":
      return { payments: Array.isArray(d) ? d : d.payments || [] };
    case "paymentMethods":
      return {
        paymentMethods: Array.isArray(d) ? d : d.paymentMethods || [],
      };
    case "dayPasses":
      return { dayPasses: (d.dayPasses || []) as StudentData["dayPasses"] };
    case "friends":
      return { friends: d as StudentData["friends"] };
    case "gymLocations":
      return {
        gymLocations: Array.isArray(d) ? d : d.gymLocations || d.gyms || [],
      };
    default:
      return { [section]: d } as Partial<StudentData>;
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

function updateStoreWithSection(
  set: SetStateFn,
  sectionData: Partial<StudentData>,
): void {
  set((state) => {
    const newState = { ...state.data };
    if (sectionData.user)
      newState.user = { ...newState.user, ...sectionData.user };
    if (sectionData.student)
      newState.student = { ...newState.student, ...sectionData.student };
    if (sectionData.progress)
      newState.progress = { ...newState.progress, ...sectionData.progress };
    if (sectionData.profile)
      newState.profile = { ...newState.profile, ...sectionData.profile };
    if (sectionData.weightHistory) {
      newState.weightHistory = sectionData.weightHistory;
      if (sectionData.weightHistory.length > 0) {
        newState.weightGain = calculateWeightGain(sectionData.weightHistory);
        if (!newState.profile?.weight && sectionData.weightHistory[0]) {
          newState.profile = {
            ...newState.profile,
            weight: sectionData.weightHistory[0].weight,
          };
        }
      }
    }
    if (sectionData.units !== undefined) newState.units = sectionData.units;
    if (sectionData.weeklyPlan !== undefined)
      newState.weeklyPlan = sectionData.weeklyPlan;
    if (sectionData.libraryPlans !== undefined)
      newState.libraryPlans = sectionData.libraryPlans;
    if (sectionData.workoutHistory !== undefined)
      newState.workoutHistory = sectionData.workoutHistory;
    if (sectionData.personalRecords !== undefined)
      newState.personalRecords = sectionData.personalRecords;
    if (sectionData.subscription !== undefined)
      newState.subscription = sectionData.subscription;
    if (sectionData.memberships !== undefined)
      newState.memberships = sectionData.memberships;
    if (sectionData.payments !== undefined)
      newState.payments = sectionData.payments;
    if (sectionData.paymentMethods !== undefined)
      newState.paymentMethods = sectionData.paymentMethods;
    if (sectionData.dayPasses !== undefined)
      newState.dayPasses = sectionData.dayPasses;
    if (sectionData.friends !== undefined)
      newState.friends = sectionData.friends;
    if (sectionData.gymLocations !== undefined)
      newState.gymLocations = sectionData.gymLocations;
    if (sectionData.dailyNutrition !== undefined)
      newState.dailyNutrition = sectionData.dailyNutrition;
    return { data: newState };
  });
}

export async function loadSection(
  section: StudentDataSection,
  forceRefresh = false,
): Promise<Partial<StudentData>> {
  if (forceRefresh) {
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
        .get<Record<string, string | number | boolean | object | null>>(route, {
          timeout: 30000,
        })
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
  skipNutrition = false,
): Promise<void> {
  const sectionPromises = sections.map(async (section) => {
    try {
      const sectionData = await loadSection(section);
      if (sectionData && Object.keys(sectionData).length > 0) {
        updateStoreWithSection(set, sectionData);
      }
      return sectionData;
    } catch {
      return {};
    }
  });
  await Promise.all(sectionPromises);
  if (!skipNutrition && sections.includes("dailyNutrition")) {
    try {
      const res = await apiClient.get<{
        date: string;
        meals: Meal[];
        totalCalories?: number;
        totalProtein?: number;
        totalCarbs?: number;
        totalFats?: number;
        waterIntake?: number;
        targetCalories?: number;
        targetProtein?: number;
        targetCarbs?: number;
        targetFats?: number;
        targetWater?: number;
      }>("/api/nutrition/daily", { timeout: 30000 });
      const d = res.data;
      let normalizedDate: string;
      try {
        normalizedDate = getBrazilNutritionDateKey(d.date);
      } catch {
        normalizedDate = getBrazilNutritionDateKey();
      }
      const uniqueMeals = deduplicateMeals(d.meals || []);
      updateStoreWithSection(set, {
        dailyNutrition: {
          date: normalizedDate,
          meals: uniqueMeals,
          totalCalories: d.totalCalories ?? 0,
          totalProtein: d.totalProtein ?? 0,
          totalCarbs: d.totalCarbs ?? 0,
          totalFats: d.totalFats ?? 0,
          waterIntake: d.waterIntake ?? 0,
          targetCalories: d.targetCalories ?? 2000,
          targetProtein: d.targetProtein ?? 150,
          targetCarbs: d.targetCarbs ?? 250,
          targetFats: d.targetFats ?? 65,
          targetWater: d.targetWater ?? 3000,
        },
      });
    } catch {
      // ignore
    }
  }
}

const ALL_SECTIONS: StudentDataSection[] = [
  "user",
  "student",
  "progress",
  "units",
  "weeklyPlan",
  "libraryPlans",
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

export async function loadAllDataIncremental(set: SetStateFn): Promise<void> {
  await loadSectionsIncremental(set, ALL_SECTIONS);
}
