"use client";

import { create } from "zustand";

export type GymMapFilter = "all" | "open" | "near" | "subscribed";

interface GymMapState {
  selectedGymId: string | null;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  filter: GymMapFilter;
  setSelectedGym: (gymId: string | null) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
  setFilter: (filter: GymMapFilter) => void;
}

const DEFAULT_CENTER = { lat: -23.5505, lng: -46.6333 };
const DEFAULT_ZOOM = 13;

export const useGymMapStore = create<GymMapState>((set) => ({
  selectedGymId: null,
  mapCenter: DEFAULT_CENTER,
  mapZoom: DEFAULT_ZOOM,
  filter: "all",
  setSelectedGym: (gymId) => set({ selectedGymId: gymId }),
  setMapCenter: (mapCenter) => set({ mapCenter }),
  setMapZoom: (mapZoom) => set({ mapZoom }),
  setFilter: (filter) => set({ filter }),
}));
