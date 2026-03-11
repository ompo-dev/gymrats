import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import type { FoodItem } from "@/lib/types";
import type { ResourceState } from "@/stores/shared/resource-metadata";

interface ExerciseResult {
  id: string;
  name: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  difficulty?: string;
  equipment?: string[];
}

interface PaginatedResult<T> {
  items: T[];
  total?: number;
}

interface CatalogSearchState {
  exerciseResults: Record<string, PaginatedResult<ExerciseResult>>;
  foodResults: Record<string, PaginatedResult<FoodItem>>;
  resources: Record<string, ResourceState>;
  loadExercises: (params: {
    query?: string;
    muscle?: string;
    limit: number;
    offset: number;
    force?: boolean;
  }) => Promise<PaginatedResult<ExerciseResult>>;
  loadFoods: (params: {
    query?: string;
    category?: string;
    limit: number;
    offset: number;
    force?: boolean;
  }) => Promise<PaginatedResult<FoodItem>>;
}

const inflight = new Map<string, Promise<PaginatedResult<unknown>>>();

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

export const getExerciseSearchKey = (params: {
  query?: string;
  muscle?: string;
  limit: number;
  offset: number;
}) =>
  `exercise:${params.query ?? ""}:${params.muscle ?? ""}:${params.limit}:${params.offset}`;

export const getFoodSearchKey = (params: {
  query?: string;
  category?: string;
  limit: number;
  offset: number;
}) =>
  `food:${params.query ?? ""}:${params.category ?? ""}:${params.limit}:${params.offset}`;

export const useCatalogSearchStore = create<CatalogSearchState>((set, get) => ({
  exerciseResults: {},
  foodResults: {},
  resources: {},

  loadExercises: async ({ query, muscle, limit, offset, force = false }) => {
    const key = getExerciseSearchKey({ query, muscle, limit, offset });
    const cached = get().exerciseResults[key];

    if (!force && cached) {
      return cached;
    }

    if (!force && inflight.has(key)) {
      return inflight.get(key) as Promise<PaginatedResult<ExerciseResult>>;
    }

    set((state) => ({
      resources: markLoading(state.resources, key),
    }));

    const params = new URLSearchParams();
    if (query?.trim()) params.append("q", query.trim());
    if (muscle) params.append("muscle", muscle);
    params.append("limit", String(limit));
    params.append("offset", String(offset));

    const request = apiClient
      .get<{ exercises: ExerciseResult[]; total: number }>(
        `/api/exercises/search?${params.toString()}`,
      )
      .then((response) => {
        const result = {
          items: response.data.exercises ?? [],
          total: response.data.total,
        };
        set((state) => ({
          exerciseResults: {
            ...state.exerciseResults,
            [key]: result,
          },
          resources: markReady(state.resources, key),
        }));
        return result;
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar exercicios";
        set((state) => ({
          resources: markError(state.resources, key, message),
        }));
        return cached ?? { items: [], total: 0 };
      })
      .finally(() => {
        inflight.delete(key);
      });

    inflight.set(key, request);
    return request;
  },

  loadFoods: async ({ query, category, limit, offset, force = false }) => {
    const key = getFoodSearchKey({ query, category, limit, offset });
    const cached = get().foodResults[key];

    if (!force && cached) {
      return cached;
    }

    if (!force && inflight.has(key)) {
      return inflight.get(key) as Promise<PaginatedResult<FoodItem>>;
    }

    set((state) => ({
      resources: markLoading(state.resources, key),
    }));

    const params = new URLSearchParams();
    if (query?.trim()) params.append("q", query.trim());
    if (category) params.append("category", category);
    params.append("limit", String(limit));
    if (offset > 0) params.append("offset", String(offset));

    const request = apiClient
      .get<{ foods: FoodItem[] }>(`/api/foods/search?${params.toString()}`)
      .then((response) => {
        const result = {
          items: response.data.foods ?? [],
        };
        set((state) => ({
          foodResults: {
            ...state.foodResults,
            [key]: result,
          },
          resources: markReady(state.resources, key),
        }));
        return result;
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar alimentos";
        set((state) => ({
          resources: markError(state.resources, key, message),
        }));
        return cached ?? { items: [] };
      })
      .finally(() => {
        inflight.delete(key);
      });

    inflight.set(key, request);
    return request;
  },
}));
