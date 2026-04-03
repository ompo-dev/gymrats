import type {
  PersonalAffiliation,
  PersonalProfile,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
} from "@gymrats/types/personal-module";
import { getPersonalBootstrapRequest } from "@/lib/api/bootstrap";
import { actionClient as apiClient } from "@/lib/actions/client";
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
  options: boolean | { force?: boolean; fresh?: boolean } = false,
): Promise<Partial<PersonalUnifiedData>> {
  const normalizedOptions =
    typeof options === "boolean" ? { force: options } : options;
  const forceReload = normalizedOptions.force ?? false;
  const bypassCache = normalizedOptions.fresh ?? false;

  if (forceReload) {
    loadingSections.delete(section);
    loadingPromises.delete(section);
  }

  const existing = loadingPromises.get(section);
  if (existing) return existing;

  const promise = (async () => {
    loadingSections.add(section);
    try {
      const route = SECTION_ROUTES[section];
      const config = {
        ...(bypassCache ? { fresh: true } : {}),
      };
      if (section === "profile") {
        const res = await apiClient.get<{ personal: PersonalProfile | null }>(
          route,
          config,
        );
        return { profile: res.data.personal };
      }
      if (section === "affiliations") {
        const res = await apiClient.get<{
          affiliations: PersonalAffiliation[];
        }>(route, config);
        return { affiliations: res.data.affiliations || [] };
      }
      if (section === "students") {
        const res = await apiClient.get<{
          students: PersonalStudentAssignment[];
        }>(route, config);
        return { students: res.data.students || [] };
      }
      if (section === "studentDirectory") {
        const res = await apiClient.get<{
          students: PersonalUnifiedData["studentDirectory"];
        }>(route, config);
        return { studentDirectory: res.data.students || [] };
      }
      if (section === "subscription") {
        const res = await apiClient
          .get<{
            subscription: PersonalSubscriptionData | null;
          }>(route, config)
          .catch(() => ({ data: { subscription: null } }));
        return { subscription: res.data.subscription ?? null };
      }
      if (section === "financialSummary") {
        const res = await apiClient
          .get<{
            financialSummary: FinancialSummary | null;
          }>(route, config)
          .catch(() => ({ data: { financialSummary: null } }));
        return { financialSummary: res.data.financialSummary ?? null };
      }
      if (section === "expenses") {
        const res = await apiClient
          .get<{
            expenses: Expense[];
          }>(route, config)
          .catch(() => ({ data: { expenses: [] } }));
        return { expenses: res.data.expenses || [] };
      }
      if (section === "payments") {
        const res = await apiClient
          .get<{
            payments: PersonalUnifiedData["payments"];
          }>(route, config)
          .catch(() => ({ data: { payments: [] } }));
        return { payments: res.data.payments || [] };
      }
      if (section === "coupons") {
        const res = await apiClient
          .get<{
            coupons: PersonalUnifiedData["coupons"];
          }>(route, config)
          .catch(() => ({ data: { coupons: [] } }));
        return { coupons: res.data.coupons || [] };
      }
      if (section === "campaigns") {
        const res = await apiClient
          .get<{
            campaigns: PersonalUnifiedData["campaigns"];
          }>(route, config)
          .catch(() => ({ data: { campaigns: [] } }));
        return { campaigns: res.data.campaigns || [] };
      }
      if (section === "membershipPlans") {
        const res = await apiClient
          .get<{
            plans: PersonalUnifiedData["membershipPlans"];
          }>(route, config)
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
  const response = await getPersonalBootstrapRequest(sections);
  return response.data ?? {};
}

export async function loadSectionsIncremental(
  sections: PersonalDataSection[],
): Promise<Partial<PersonalUnifiedData>> {
  if (sections.length === 0) {
    return {};
  }

  return loadPersonalBootstrap(sections);
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
