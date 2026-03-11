import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import type { BoostCampaign } from "@/lib/types";
import type { ResourceState } from "@/stores/shared/resource-metadata";

const STALE_MS = 60_000;

const impressionIds = new Set<string>();
const clickIds = new Set<string>();
const inflight = new Map<string, Promise<BoostCampaign[]>>();

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

export const getBoostCampaignCacheKey = (params?: {
  lat?: number;
  lng?: number;
}) =>
  params?.lat !== undefined && params?.lng !== undefined
    ? `boost:${params.lat.toFixed(4)}:${params.lng.toFixed(4)}`
    : "boost:all";

interface BoostCampaignsState {
  campaignsByKey: Record<string, BoostCampaign[]>;
  resources: Record<string, ResourceState>;
  loadCampaigns: (params?: {
    lat?: number;
    lng?: number;
    force?: boolean;
  }) => Promise<BoostCampaign[]>;
  trackImpression: (campaignId: string) => Promise<void>;
  trackClick: (campaignId: string) => Promise<void>;
  reset: () => void;
}

export const useBoostCampaignsStore = create<BoostCampaignsState>(
  (set, get) => ({
    campaignsByKey: {},
    resources: {},

    loadCampaigns: async ({ lat, lng, force = false } = {}) => {
      const cacheKey = getBoostCampaignCacheKey({ lat, lng });
      const state = get();
      const cached = state.campaignsByKey[cacheKey];
      const resource = state.resources[cacheKey];

      if (!force && cached && resource?.status === "ready" && isFresh(resource)) {
        return cached;
      }

      if (!force && inflight.has(cacheKey)) {
        return inflight.get(cacheKey)!;
      }

      set((current) => ({
        resources: markLoading(current.resources, cacheKey),
      }));

      const params = new URLSearchParams();
      if (lat !== undefined && lng !== undefined) {
        params.set("lat", String(lat));
        params.set("lng", String(lng));
      }

      const request = apiClient
        .get<{ campaigns: BoostCampaign[] }>(
          `/api/boost-campaigns/nearby${params.toString() ? `?${params}` : ""}`,
        )
        .then((response) => {
          const campaigns = response.data.campaigns ?? [];
          set((current) => ({
            campaignsByKey: {
              ...current.campaignsByKey,
              [cacheKey]: campaigns,
            },
            resources: markReady(current.resources, cacheKey),
          }));
          return campaigns;
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
                : "Erro ao carregar campanhas";

          set((current) => ({
            resources: markError(current.resources, cacheKey, String(message)),
          }));
          return cached ?? [];
        })
        .finally(() => {
          inflight.delete(cacheKey);
        });

      inflight.set(cacheKey, request);
      return request;
    },

    trackImpression: async (campaignId) => {
      if (impressionIds.has(campaignId)) return;
      impressionIds.add(campaignId);

      try {
        await apiClient.post(`/api/boost-campaigns/${campaignId}/impression`, {});
      } catch {
        impressionIds.delete(campaignId);
      }
    },

    trackClick: async (campaignId) => {
      if (clickIds.has(campaignId)) return;
      clickIds.add(campaignId);

      try {
        await apiClient.post(`/api/boost-campaigns/${campaignId}/click`, {});
      } catch {
        clickIds.delete(campaignId);
      }
    },

    reset: () => {
      inflight.clear();
      impressionIds.clear();
      clickIds.clear();
      set({
        campaignsByKey: {},
        resources: {},
      });
    },
  }),
);
