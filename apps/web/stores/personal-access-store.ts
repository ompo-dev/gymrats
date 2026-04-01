"use client";

import type {
  AccessEventFeedItem,
  AccessOverview,
  AccessSubjectType,
} from "@gymrats/types";
import { create } from "zustand";
import { actionClient as apiClient } from "@/lib/actions/client";
import {
  normalizeAccessFeedItem,
  normalizeAccessOverview,
} from "@/lib/utils/access/normalize";

interface PersonalManualStudent {
  id: string;
  name: string;
}

interface PersonalAccessState {
  gymId: string | null;
  overview: AccessOverview | null;
  feed: AccessEventFeedItem[];
  students: PersonalManualStudent[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  loadAll: (gymId: string) => Promise<void>;
  createManualEvent: (payload: {
    subjectType: AccessSubjectType;
    subjectId: string;
    direction: "entry" | "exit";
    reason?: string | null;
  }) => Promise<void>;
}

export const usePersonalAccessStore = create<PersonalAccessState>()(
  (set, get) => ({
    gymId: null,
    overview: null,
    feed: [],
    students: [],
    isLoading: false,
    isMutating: false,
    error: null,

    loadAll: async (gymId) => {
      set({ gymId, isLoading: true, error: null });
      try {
        const [overview, feed, students] = await Promise.all([
          apiClient.get<{ overview: AccessOverview }>(
            `/api/personals/gyms/${gymId}/access/overview`,
          ),
          apiClient.get<{ feed: AccessEventFeedItem[] }>(
            `/api/personals/gyms/${gymId}/access/feed?limit=50`,
          ),
          apiClient.get<{
            students: Array<{
              student?: {
                id?: string;
                user?: { name?: string | null } | null;
              };
            }>;
          }>(`/api/personals/students?gymId=${encodeURIComponent(gymId)}`),
        ]);

        set({
          overview: normalizeAccessOverview(overview.data.overview),
          feed: feed.data.feed.map(normalizeAccessFeedItem),
          students: (students.data.students ?? [])
            .map((item) => ({
              id: item.student?.id ?? "",
              name: item.student?.user?.name ?? "Aluno",
            }))
            .filter((item) => item.id),
        });
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : "Falha ao carregar catracas da academia",
        });
      } finally {
        set({ isLoading: false });
      }
    },

    createManualEvent: async (payload) => {
      const gymId = get().gymId;
      if (!gymId) {
        throw new Error("gymId não configurado");
      }

      set({ isMutating: true, error: null });
      try {
        await apiClient.post(
          `/api/personals/gyms/${gymId}/access/manual-events`,
          payload,
        );
        await get().loadAll(gymId);
      } finally {
        set({ isMutating: false });
      }
    },
  }),
);
