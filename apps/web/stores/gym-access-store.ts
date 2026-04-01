"use client";

import type {
  AccessCredentialBinding,
  AccessDeviceSnapshot,
  AccessEventFeedItem,
  AccessOverview,
  AccessPresenceGroup,
  AccessSubjectType,
} from "@gymrats/types";
import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import {
  normalizeAccessBinding,
  normalizeAccessDevice,
  normalizeAccessFeedItem,
  normalizeAccessOverview,
  normalizeAccessPresence,
} from "@/lib/utils/access/normalize";

type ManualAccessPayload = {
  subjectType: AccessSubjectType;
  subjectId: string;
  direction: "entry" | "exit";
  reason?: string | null;
};

type DevicePayload = {
  name: string;
  vendorKey: string;
  adapterKey: string;
  hardwareType: string;
  authModes: string[];
  transport: "webhook" | "bridge" | "manual";
  status: "active" | "paused" | "offline" | "error";
  externalDeviceId?: string | null;
  externalSerial?: string | null;
  directionMode: "provider" | "entry" | "exit" | "auto";
  dedupeWindowSeconds: number;
  payloadTemplate?: Record<string, unknown> | null;
  settings?: Record<string, unknown> | null;
};

interface GymAccessState {
  overview: AccessOverview | null;
  feed: AccessEventFeedItem[];
  presence: AccessPresenceGroup;
  devices: AccessDeviceSnapshot[];
  pending: AccessEventFeedItem[];
  bindings: AccessCredentialBinding[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  loadAll: () => Promise<void>;
  loadOverview: () => Promise<void>;
  loadFeed: () => Promise<void>;
  loadPresence: () => Promise<void>;
  loadDevices: () => Promise<void>;
  loadPending: () => Promise<void>;
  loadBindings: () => Promise<void>;
  createDevice: (payload: DevicePayload) => Promise<{
    ingestionKey: string;
    secret: string;
  }>;
  updateDevice: (deviceId: string, payload: Partial<DevicePayload>) => Promise<void>;
  createManualEvent: (payload: ManualAccessPayload) => Promise<void>;
  createBinding: (payload: {
    subjectType: AccessSubjectType;
    subjectId: string;
    identifierType: string;
    identifierValue: string;
  }) => Promise<void>;
  reconcileEvent: (payload: {
    eventId: string;
    action: "apply" | "ignore";
    subjectType?: AccessSubjectType;
    subjectId?: string;
    createBinding?: boolean;
  }) => Promise<void>;
}

const emptyPresence: AccessPresenceGroup = {
  students: [],
  personals: [],
};

export const useGymAccessStore = create<GymAccessState>()((set, get) => ({
  overview: null,
  feed: [],
  presence: emptyPresence,
  devices: [],
  pending: [],
  bindings: [],
  isLoading: false,
  isMutating: false,
  error: null,

  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().loadOverview(),
        get().loadFeed(),
        get().loadPresence(),
        get().loadDevices(),
        get().loadPending(),
        get().loadBindings(),
      ]);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Falha ao carregar catracas",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  loadOverview: async () => {
    const response = await apiClient.get<{ overview: AccessOverview }>(
      "/api/gyms/access/overview",
    );
    set({ overview: normalizeAccessOverview(response.data.overview) });
  },

  loadFeed: async () => {
    const response = await apiClient.get<{ feed: AccessEventFeedItem[] }>(
      "/api/gyms/access/feed?limit=50",
    );
    set({ feed: response.data.feed.map(normalizeAccessFeedItem) });
  },

  loadPresence: async () => {
    const response = await apiClient.get<{ presence: AccessPresenceGroup }>(
      "/api/gyms/access/presence",
    );
    set({ presence: normalizeAccessPresence(response.data.presence) });
  },

  loadDevices: async () => {
    const response = await apiClient.get<{ devices: AccessDeviceSnapshot[] }>(
      "/api/gyms/access/devices",
    );
    set({ devices: response.data.devices.map(normalizeAccessDevice) });
  },

  loadPending: async () => {
    const response = await apiClient.get<{ pending: AccessEventFeedItem[] }>(
      "/api/gyms/access/pending",
    );
    set({ pending: response.data.pending.map(normalizeAccessFeedItem) });
  },

  loadBindings: async () => {
    const response = await apiClient.get<{ bindings: AccessCredentialBinding[] }>(
      "/api/gyms/access/bindings",
    );
    set({ bindings: response.data.bindings.map(normalizeAccessBinding) });
  },

  createDevice: async (payload) => {
    set({ isMutating: true, error: null });
    try {
      const response = await apiClient.post<{
        device: AccessDeviceSnapshot;
        setup: { ingestionKey: string; secret: string };
      }>("/api/gyms/access/devices", payload);
      await Promise.all([get().loadDevices(), get().loadOverview()]);
      return response.data.setup;
    } finally {
      set({ isMutating: false });
    }
  },

  updateDevice: async (deviceId, payload) => {
    set({ isMutating: true, error: null });
    try {
      await apiClient.patch(`/api/gyms/access/devices/${deviceId}`, payload);
      await Promise.all([get().loadDevices(), get().loadOverview()]);
    } finally {
      set({ isMutating: false });
    }
  },

  createManualEvent: async (payload) => {
    set({ isMutating: true, error: null });
    try {
      await apiClient.post("/api/gyms/access/manual-events", payload);
      await Promise.all([
        get().loadOverview(),
        get().loadFeed(),
        get().loadPresence(),
        get().loadPending(),
      ]);
    } finally {
      set({ isMutating: false });
    }
  },

  createBinding: async (payload) => {
    set({ isMutating: true, error: null });
    try {
      await apiClient.post("/api/gyms/access/bindings", payload);
      await Promise.all([get().loadBindings(), get().loadPending()]);
    } finally {
      set({ isMutating: false });
    }
  },

  reconcileEvent: async (payload) => {
    set({ isMutating: true, error: null });
    try {
      await apiClient.post(
        `/api/gyms/access/events/${payload.eventId}/reconcile`,
        payload,
      );
      await Promise.all([
        get().loadOverview(),
        get().loadFeed(),
        get().loadPresence(),
        get().loadPending(),
        get().loadBindings(),
      ]);
    } finally {
      set({ isMutating: false });
    }
  },
}));
