import Constants from "expo-constants";
import { create } from "zustand";
import {
  clearStoredSession,
  readStoredConfig,
  readStoredSession,
  writeStoredConfig,
  writeStoredSession,
} from "../lib/storage";
import { normalizeUrl } from "../utils/url";
import type {
  AppConfig,
  AppStore,
  AuthSessionPayload,
  PersistedSession,
} from "./types";

function createDefaultConfig(): AppConfig {
  const extra = Constants.expoConfig?.extra as
    | Record<string, unknown>
    | undefined;
  const defaultWebUrl =
    typeof extra?.defaultWebUrl === "string"
      ? extra.defaultWebUrl
      : "https://gym-rats-testes.vercel.app";
  const defaultApiUrl =
    typeof extra?.defaultApiUrl === "string"
      ? extra.defaultApiUrl
      : "https://gymrats-production.up.railway.app";

  return {
    webUrl: normalizeUrl(defaultWebUrl) || "https://gym-rats-testes.vercel.app",
    apiUrl:
      normalizeUrl(defaultApiUrl) ||
      "https://gymrats-production.up.railway.app",
  };
}

function toPersistedSession(payload: AuthSessionPayload): PersistedSession {
  return {
    token: payload.session.token,
    user: payload.user,
  };
}

export const useAppStore = create<AppStore>((set, get) => ({
  hydrated: false,
  config: createDefaultConfig(),
  session: {
    token: null,
    user: null,
  },
  hydrate: async () => {
    const [storedConfig, storedSession] = await Promise.all([
      readStoredConfig<AppConfig>(),
      readStoredSession<PersistedSession>(),
    ]);
    const defaults = createDefaultConfig();

    set({
      hydrated: true,
      config: storedConfig
        ? {
            webUrl: normalizeUrl(storedConfig.webUrl) || defaults.webUrl,
            apiUrl: normalizeUrl(storedConfig.apiUrl) || defaults.apiUrl,
          }
        : defaults,
      session: storedSession || {
        token: null,
        user: null,
      },
    });
  },
  updateConfig: async (nextConfig) => {
    const normalizedConfig: AppConfig = {
      webUrl: normalizeUrl(nextConfig.webUrl) || get().config.webUrl,
      apiUrl: normalizeUrl(nextConfig.apiUrl) || get().config.apiUrl,
    };

    await writeStoredConfig(normalizedConfig);
    set({
      config: normalizedConfig,
    });
  },
  upsertSession: async (payload) => {
    const persistedSession = toPersistedSession(payload);
    await writeStoredSession(persistedSession);
    set({
      session: persistedSession,
    });
  },
  clearSession: async () => {
    await clearStoredSession();
    set({
      session: {
        token: null,
        user: null,
      },
    });
  },
}));
