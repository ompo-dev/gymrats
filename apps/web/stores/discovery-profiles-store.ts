import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import type {
  DiscoveryGymProfile,
  DiscoveryGymProfileVariant,
  DiscoveryPersonalProfile,
} from "@/lib/types/discovery-profiles";
import type { ResourceState } from "@/stores/shared/resource-metadata";

const STALE_MS = 60_000;

const inflightRequests = new Map<
  string,
  Promise<DiscoveryGymProfile | DiscoveryPersonalProfile>
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

const isFresh = (resource: ResourceState | undefined) => {
  if (!resource?.lastFetchedAt) return false;
  return Date.now() - new Date(resource.lastFetchedAt).getTime() < STALE_MS;
};

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

export const getGymProfileCacheKey = (
  gymId: string,
  variant: DiscoveryGymProfileVariant = "student",
) => `${variant}:gym:${gymId}`;

export const getPersonalProfileCacheKey = (personalId: string) =>
  `student:personal:${personalId}`;

interface DiscoveryProfilesState {
  gymProfiles: Record<string, DiscoveryGymProfile>;
  personalProfiles: Record<string, DiscoveryPersonalProfile>;
  resources: Record<string, ResourceState>;
  loadGymProfile: (
    gymId: string,
    variant?: DiscoveryGymProfileVariant,
    force?: boolean,
  ) => Promise<DiscoveryGymProfile>;
  loadPersonalProfile: (
    personalId: string,
    force?: boolean,
  ) => Promise<DiscoveryPersonalProfile>;
  reset: () => void;
}

export const useDiscoveryProfilesStore = create<DiscoveryProfilesState>(
  (set, get) => ({
    gymProfiles: {},
    personalProfiles: {},
    resources: {},

    loadGymProfile: async (
      gymId,
      variant: DiscoveryGymProfileVariant = "student",
      force = false,
    ) => {
      const cacheKey = getGymProfileCacheKey(gymId, variant);
      const state = get();
      const cached = state.gymProfiles[cacheKey];
      const resource = state.resources[cacheKey];

      if (
        !force &&
        cached &&
        resource?.status === "ready" &&
        isFresh(resource)
      ) {
        return cached;
      }

      if (!force && inflightRequests.has(cacheKey)) {
        return inflightRequests.get(cacheKey) as Promise<DiscoveryGymProfile>;
      }

      set((current) => ({
        resources: markLoading(current.resources, cacheKey),
      }));

      const route =
        variant === "personal"
          ? `/api/personals/gyms/${gymId}/profile`
          : `/api/students/gyms/${gymId}/profile`;

      const request = apiClient
        .get<DiscoveryGymProfile>(route)
        .then((response) => {
          set((current) => ({
            gymProfiles: {
              ...current.gymProfiles,
              [cacheKey]: response.data,
            },
            resources: markReady(current.resources, cacheKey),
          }));
          return response.data;
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
                : "Erro ao carregar perfil";

          set((current) => ({
            resources: markError(current.resources, cacheKey, String(message)),
          }));
          throw error;
        })
        .finally(() => {
          inflightRequests.delete(cacheKey);
        });

      inflightRequests.set(cacheKey, request);
      return request;
    },

    loadPersonalProfile: async (personalId, force = false) => {
      const cacheKey = getPersonalProfileCacheKey(personalId);
      const state = get();
      const cached = state.personalProfiles[cacheKey];
      const resource = state.resources[cacheKey];

      if (
        !force &&
        cached &&
        resource?.status === "ready" &&
        isFresh(resource)
      ) {
        return cached;
      }

      if (!force && inflightRequests.has(cacheKey)) {
        return inflightRequests.get(
          cacheKey,
        ) as Promise<DiscoveryPersonalProfile>;
      }

      set((current) => ({
        resources: markLoading(current.resources, cacheKey),
      }));

      const request = apiClient
        .get<DiscoveryPersonalProfile>(
          `/api/students/personals/${personalId}/profile`,
        )
        .then((response) => {
          set((current) => ({
            personalProfiles: {
              ...current.personalProfiles,
              [cacheKey]: response.data,
            },
            resources: markReady(current.resources, cacheKey),
          }));
          return response.data;
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
                : "Erro ao carregar perfil";

          set((current) => ({
            resources: markError(current.resources, cacheKey, String(message)),
          }));
          throw error;
        })
        .finally(() => {
          inflightRequests.delete(cacheKey);
        });

      inflightRequests.set(cacheKey, request);
      return request;
    },

    reset: () => {
      inflightRequests.clear();
      set({
        gymProfiles: {},
        personalProfiles: {},
        resources: {},
      });
    },
  }),
);
