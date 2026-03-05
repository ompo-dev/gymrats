import type {
  PersonalAffiliation,
  PersonalProfile,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
} from "@/app/personal/types";
import { apiClient } from "@/lib/api/client";
import type {
  PersonalDataSection,
  PersonalUnifiedData,
} from "@/lib/types/personal-unified";

export const SECTION_ROUTES: Record<PersonalDataSection, string> = {
  profile: "/api/personals",
  affiliations: "/api/personals/affiliations",
  students: "/api/personals/students",
  subscription: "/api/personals/subscription",
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
      if (section === "subscription") {
        const res = await apiClient.get<{
          subscription: PersonalSubscriptionData | null;
        }>(route).catch(() => ({ data: { subscription: null } }));
        return { subscription: res.data.subscription ?? null };
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

export async function loadSectionsIncremental(
  sections: PersonalDataSection[],
): Promise<Partial<PersonalUnifiedData>> {
  const results: Partial<PersonalUnifiedData> = {};
  for (const section of sections) {
    const data = await loadSection(section);
    Object.assign(results, data);
  }
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
