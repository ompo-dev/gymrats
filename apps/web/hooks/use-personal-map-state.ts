"use client";

import { create } from "zustand";

export type PersonalMapFilter =
  | "all"
  | "subscribed"
  | "near"
  | "remote";

interface PersonalMapState {
  selectedPersonalId: string | null;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  filter: PersonalMapFilter;
  setSelectedPersonal: (personalId: string | null) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
  setFilter: (filter: PersonalMapFilter) => void;
}

const DEFAULT_CENTER = { lat: -23.5505, lng: -46.6333 };
const DEFAULT_ZOOM = 13;

export const usePersonalMapStore = create<PersonalMapState>((set) => ({
  selectedPersonalId: null,
  mapCenter: DEFAULT_CENTER,
  mapZoom: DEFAULT_ZOOM,
  filter: "all",
  setSelectedPersonal: (personalId) => set({ selectedPersonalId: personalId }),
  setMapCenter: (mapCenter) => set({ mapCenter }),
  setMapZoom: (mapZoom) => set({ mapZoom }),
  setFilter: (filter) => set({ filter }),
}));
