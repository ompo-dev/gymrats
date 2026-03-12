import { featureFlags } from "@gymrats/config";
import type { BootstrapResponse } from "@gymrats/types/bootstrap";
import type {
  PersonalAffiliation,
  PersonalProfile,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
} from "@gymrats/types/personal-module";
import { apiClient } from "@/lib/api/client";
import { isClientApiCapabilityEnabled } from "@/lib/api/route-capabilities";
import type { Expense, FinancialSummary } from "@/lib/types";
import type {
  PersonalDataSection,
  PersonalUnifiedData,
} from "@/lib/types/personal-unified";

export const SECTION_ROUTES: Record<PersonalDataSection, string> = {
  profile: "/api/personals",
  affiliations: "/api/personals/affiliations",
  students: "/api/personals/students",
  studentDirectory: "/api/personals/students/student-data",
  subscription: "/api/personals/subscription",
  financialSummary: "/api/personals/financial-summary",
  expenses: "/api/personals/expenses",
  payments: "/api/personals/payments",
  coupons: "/api/personals/coupons",
  campaigns: "/api/personals/boost-campaigns",
  membershipPlans: "/api/personals/membership-plans",
};

const loadingSections = new Set<PersonalDataSection>();
const loadingPromises = new Map<
  PersonalDataSection,
  Promise<Partial<PersonalUnifiedData>>
>();

export function clearLoadingState() {
  loadingSections.clear();
  loadingPromises.clear();
}

export async function loadSection(
  section: PersonalDataSection,
): Promise<Partial<PersonalUnifiedData>> {
  const existing = loadingPromises.get(section);
  if (existing) return existing;

  const promise = (async () => {
    loadingSections.add(section);
    try {
      const route = SECTION_ROUTES[section];
      if (section === "profile") {
        const res = await apiClient.get<{ personal: PersonalProfile | null }>(
          route,
        );
        return { profile: res.data.personal };
      }
      if (section === "affiliations") {
        const res = await apiClient.get<{
          affiliations: PersonalAffiliation[];
        }>(route);
        return { affiliations: res.data.affiliations || [] };
      }
      if (section === "students") {
        const res = await apiClient.get<{
          students: PersonalStudentAssignment[];
        }>(route);
        return { students: res.data.students || [] };
      }
      if (section === "studentDirectory") {
        const res = await apiClient.get<{
          students: PersonalUnifiedData["studentDirectory"];
        }>(route);
        return { studentDirectory: res.data.students || [] };
      }
      if (section === "subscription") {
        const res = await apiClient
          .get<{
            subscription: PersonalSubscriptionData | null;
          }>(route)
          .catch(() => ({ data: { subscription: null } }));
        return { subscription: res.data.subscription ?? null };
      }
      if (section === "financialSummary") {
        const res = await apiClient
          .get<{
            financialSummary: FinancialSummary | null;
          }>(route)
          .catch(() => ({ data: { financialSummary: null } }));
        return { financialSummary: res.data.financialSummary ?? null };
      }
      if (section === "expenses") {
        const res = await apiClient
          .get<{
            expenses: Expense[];
          }>(route)
          .catch(() => ({ data: { expenses: [] } }));
        return { expenses: res.data.expenses || [] };
      }
      if (section === "payments") {
        const res = await apiClient
          .get<{
            payments: PersonalUnifiedData["payments"];
          }>(route)
          .catch(() => ({ data: { payments: [] } }));
        return { payments: res.data.payments || [] };
      }
      if (section === "coupons") {
        const res = await apiClient
          .get<{
            coupons: PersonalUnifiedData["coupons"];
          }>(route)
          .catch(() => ({ data: { coupons: [] } }));
        return { coupons: res.data.coupons || [] };
      }
      if (section === "campaigns") {
        const res = await apiClient
          .get<{
            campaigns: PersonalUnifiedData["campaigns"];
          }>(route)
          .catch(() => ({ data: { campaigns: [] } }));
        return { campaigns: res.data.campaigns || [] };
      }
      if (section === "membershipPlans") {
        const res = await apiClient
          .get<{
            plans: PersonalUnifiedData["membershipPlans"];
          }>(route)
          .catch(() => ({ data: { plans: [] } }));
        return { membershipPlans: res.data.plans || [] };
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

async function loadPersonalBootstrap(
  sections: PersonalDataSection[],
): Promise<Partial<PersonalUnifiedData>> {
  const params = new URLSearchParams();
  if (sections.length > 0) {
    params.set("sections", sections.join(","));
  }

  const response = await apiClient.get<
    BootstrapResponse<Partial<PersonalUnifiedData>>
  >(
    `/api/personals/bootstrap${params.size > 0 ? `?${params.toString()}` : ""}`,
    {
      timeout: 30000,
    },
  );

  return response.data.data ?? {};
}

export async function loadSectionsIncremental(
  sections: PersonalDataSection[],
): Promise<Partial<PersonalUnifiedData>> {
  if (
    featureFlags.perfPersonalBootstrapV2 &&
    isClientApiCapabilityEnabled("personalBootstrap") &&
    sections.length > 1
  ) {
    try {
      return await loadPersonalBootstrap(sections);
    } catch {
      // Fallback para o carregamento legado por secao.
    }
  }

  const results: Partial<PersonalUnifiedData> = {};
  await Promise.all(
    sections.map(async (section) => {
      const data = await loadSection(section);
      Object.assign(results, data);
    }),
  );
  return results;
}

export type SetStateFn = (
  fn: (s: { data: PersonalUnifiedData }) => { data: PersonalUnifiedData },
) => void;

export function updateStoreWithSection(
  set: SetStateFn,
  sectionData: Partial<PersonalUnifiedData>,
) {
  set((state) => ({
    data: {
      ...state.data,
      ...sectionData,
      metadata: {
        ...state.data.metadata,
        lastSync: new Date(),
        isInitialized: true,
        isLoading: false,
      },
    },
  }));
}
