/**
 * Slice de amigos e academias para student-unified-store.
 */

import { actionClient as apiClient } from "@/lib/actions/client";
import { loadSection } from "../load-helpers";
import type { StudentGetState, StudentSetState } from "./types";

export function createSocialSlice(set: StudentSetState, _get: StudentGetState) {
  return {
    loadFriends: async () => {
      const section = await loadSection("friends");
      set((state) => ({
        data: {
          ...state.data,
          friends: section.friends || state.data.friends,
        },
      }));
    },
    loadGymLocations: async () => {
      const section = await loadSection("gymLocations");
      set((state) => ({
        data: {
          ...state.data,
          gymLocations: section.gymLocations || state.data.gymLocations,
        },
      }));
    },
    loadGymLocationsWithPosition: async (lat: number, lng: number) => {
      try {
        const response = await apiClient.get<{
          gyms?: import("@/lib/types").GymLocation[];
          gymLocations?: import("@/lib/types").GymLocation[];
        }>("/api/gyms/locations", {
          params: { lat: String(lat), lng: String(lng) },
          timeout: 30000,
        });
        const data = response.data;
        const gymLocations = Array.isArray(data)
          ? data
          : data.gymLocations || data.gyms || [];
        set((state) => ({
          data: { ...state.data, gymLocations },
        }));
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[loadGymLocationsWithPosition] Erro:", error);
        }
      }
    },
  };
}
