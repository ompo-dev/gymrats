import { create } from "zustand";
import { actionClient as apiClient } from "@/lib/actions/client";
import type {
  PersonalFilter,
  StudentPersonalAssignment,
  StudentPersonalListItem,
} from "@/lib/types/student-discovery";
import type { ResourceState } from "@/stores/shared/resource-metadata";

const STALE_MS = 60_000;

const inflight = new Map<
  string,
  Promise<StudentPersonalAssignment[] | StudentPersonalListItem[]>
>();

const createResourceState = (): ResourceState => ({
  status: "idle",
  lastStartedAt: null,
  lastFetchedAt: null,
  error: null,
});

const getResource = (
  resources: Record<string, ResourceState>,
  key: string,
): ResourceState => resources[key] ?? createResourceState();

const markLoading = (
  resources: Record<string, ResourceState>,
  key: string,
): Record<string, ResourceState> => ({
  ...resources,
  [key]: {
    ...getResource(resources, key),
    status: "loading",
    lastStartedAt: new Date(),
    error: null,
  },
});

const markReady = (
  resources: Record<string, ResourceState>,
  key: string,
): Record<string, ResourceState> => ({
  ...resources,
  [key]: {
    ...getResource(resources, key),
    status: "ready",
    lastFetchedAt: new Date(),
    error: null,
  },
});

const markError = (
  resources: Record<string, ResourceState>,
  key: string,
  error: string,
): Record<string, ResourceState> => ({
  ...resources,
  [key]: {
    ...getResource(resources, key),
    status: "error",
    error,
  },
});

const isFresh = (resource: ResourceState | undefined) => {
  if (!resource?.lastFetchedAt) return false;
  return Date.now() - new Date(resource.lastFetchedAt).getTime() < STALE_MS;
};

const ASSIGNED_PERSONALS_KEY = "student:assigned-personals";

export const getPersonalDirectoryCacheKey = (params: {
  filter: PersonalFilter;
  lat?: number;
  lng?: number;
}) =>
  `student:personals:${params.filter}:${params.lat ?? "none"}:${params.lng ?? "none"}`;

interface StudentDiscoveryState {
  assignedPersonals: StudentPersonalAssignment[];
  personalDirectory: Record<string, StudentPersonalListItem[]>;
  resources: Record<string, ResourceState>;
  loadAssignedPersonals: (
    force?: boolean,
  ) => Promise<StudentPersonalAssignment[]>;
  loadPersonalDirectory: (params: {
    filter: PersonalFilter;
    lat?: number;
    lng?: number;
    force?: boolean;
  }) => Promise<StudentPersonalListItem[]>;
  preloadDefault: () => Promise<void>;
  reset: () => void;
}

export const useStudentDiscoveryStore = create<StudentDiscoveryState>(
  (set, get) => ({
    assignedPersonals: [],
    personalDirectory: {},
    resources: {},

    loadAssignedPersonals: async (force = false) => {
      const state = get();
      const resource = state.resources[ASSIGNED_PERSONALS_KEY];

      if (
        !force &&
        state.assignedPersonals.length > 0 &&
        resource?.status === "ready" &&
        isFresh(resource)
      ) {
        return state.assignedPersonals;
      }

      if (!force && inflight.has(ASSIGNED_PERSONALS_KEY)) {
        return inflight.get(ASSIGNED_PERSONALS_KEY) as Promise<
          StudentPersonalAssignment[]
        >;
      }

      set((current) => ({
        resources: markLoading(current.resources, ASSIGNED_PERSONALS_KEY),
      }));

      const request = apiClient
        .get<{ personals: StudentPersonalAssignment[] }>(
          "/api/students/personals",
        )
        .then((response) => {
          const data = response.data.personals ?? [];
          set((current) => ({
            assignedPersonals: data,
            resources: markReady(current.resources, ASSIGNED_PERSONALS_KEY),
          }));
          return data;
        })
        .catch((error: unknown) => {
          const message =
            error &&
            typeof error === "object" &&
            "response" in error &&
            (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
              ? (error as { response?: { data?: { error?: string } } }).response
                  ?.data?.error
              : error instanceof Error
                ? error.message
                : "Erro ao carregar personais";

          set((current) => ({
            resources: markError(
              current.resources,
              ASSIGNED_PERSONALS_KEY,
              String(message),
            ),
          }));
          throw error;
        })
        .finally(() => {
          inflight.delete(ASSIGNED_PERSONALS_KEY);
        });

      inflight.set(ASSIGNED_PERSONALS_KEY, request);
      return request;
    },

    loadPersonalDirectory: async ({ filter, lat, lng, force = false }) => {
      const cacheKey = getPersonalDirectoryCacheKey({ filter, lat, lng });
      const state = get();
      const cached = state.personalDirectory[cacheKey];
      const resource = state.resources[cacheKey];

      if (
        !force &&
        cached &&
        resource?.status === "ready" &&
        isFresh(resource)
      ) {
        return cached;
      }

      if (!force && inflight.has(cacheKey)) {
        return inflight.get(cacheKey) as Promise<StudentPersonalListItem[]>;
      }

      set((current) => ({
        resources: markLoading(current.resources, cacheKey),
      }));

      const params = new URLSearchParams();
      params.set("filter", filter);
      if (lat !== undefined && lng !== undefined) {
        params.set("lat", String(lat));
        params.set("lng", String(lng));
      }

      const request = apiClient
        .get<{ personals: StudentPersonalListItem[] }>(
          `/api/students/personals/nearby?${params.toString()}`,
        )
        .then((response) => {
          const data = response.data.personals ?? [];
          set((current) => ({
            personalDirectory: {
              ...current.personalDirectory,
              [cacheKey]: data,
            },
            resources: markReady(current.resources, cacheKey),
          }));
          return data;
        })
        .catch((error: unknown) => {
          const message =
            error &&
            typeof error === "object" &&
            "response" in error &&
            (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
              ? (error as { response?: { data?: { error?: string } } }).response
                  ?.data?.error
              : error instanceof Error
                ? error.message
                : "Erro ao carregar personais";

          set((current) => ({
            resources: markError(current.resources, cacheKey, String(message)),
          }));
          throw error;
        })
        .finally(() => {
          inflight.delete(cacheKey);
        });

      inflight.set(cacheKey, request);
      return request;
    },

    preloadDefault: async () => {
      await Promise.allSettled([
        get().loadAssignedPersonals(),
        get().loadPersonalDirectory({ filter: "all" }),
      ]);
    },

    reset: () => {
      inflight.clear();
      set({
        assignedPersonals: [],
        personalDirectory: {},
        resources: {},
      });
    },
  }),
);
