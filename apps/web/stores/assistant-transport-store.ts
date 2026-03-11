"use client";

import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import { resolveApiBaseUrl } from "@/lib/api/client-factory";
import { getAuthToken } from "@/lib/auth/token-client";

interface StreamJsonSseParams {
  key: string;
  url: string;
  body: unknown;
  onEvent: (event: string, data: Record<string, unknown>) => void;
}

interface OpenSseParams {
  key: string;
  url: string;
  body: unknown;
}

interface PostJsonParams {
  key: string;
  url: string;
  body: unknown;
  timeoutMs?: number;
}

interface AssistantTransportState {
  pendingByKey: Record<string, boolean>;
  errorByKey: Record<string, string | null>;
  openSse: (params: OpenSseParams) => Promise<Response>;
  streamJsonSse: (params: StreamJsonSseParams) => Promise<void>;
  postJson: <T = unknown>(params: PostJsonParams) => Promise<T>;
  clearError: (key: string) => void;
  finishRequest: (key: string) => void;
}

async function openSseRequest({ url, body }: OpenSseParams) {
  const apiBaseUrl = resolveApiBaseUrl();
  const token = getAuthToken();

  return fetch(`${apiBaseUrl}${url}`, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export const useAssistantTransportStore = create<AssistantTransportState>()(
  (set) => ({
    pendingByKey: {},
    errorByKey: {},

    openSse: async ({ key, url, body }) => {
      set((state) => ({
        pendingByKey: { ...state.pendingByKey, [key]: true },
        errorByKey: { ...state.errorByKey, [key]: null },
      }));

      try {
        return await openSseRequest({ key, url, body });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao abrir stream";
        set((state) => ({
          errorByKey: { ...state.errorByKey, [key]: message },
          pendingByKey: { ...state.pendingByKey, [key]: false },
        }));
        throw error;
      }
    },

    streamJsonSse: async ({ key, url, body, onEvent }) => {
      set((state) => ({
        pendingByKey: { ...state.pendingByKey, [key]: true },
        errorByKey: { ...state.errorByKey, [key]: null },
      }));

      try {
        const response = await openSseRequest({ key, url, body });

        if (!response.ok) {
          const fallbackText = await response.text();
          throw new Error(fallbackText || `HTTP ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("text/event-stream")) {
          const fallbackText = await response.text();
          throw new Error(fallbackText || "Resposta invalida do servidor.");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          const fallbackText = await response.text();
          throw new Error(fallbackText || "Stream nao disponivel");
        }

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() || "";

          for (const block of blocks) {
            if (!block.trim()) continue;

            const eventMatch = block.match(/event: (\w+)/);
            const dataLine = block
              .split("\n")
              .find((line) => line.startsWith("data: "));

            const event = eventMatch?.[1];
            const dataStr = dataLine?.slice(6);

            if (!event || !dataStr) continue;

            const parsed = JSON.parse(dataStr) as Record<string, unknown>;
            onEvent(event, parsed);
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao processar stream";
        set((state) => ({
          errorByKey: { ...state.errorByKey, [key]: message },
        }));
        throw error;
      } finally {
        set((state) => ({
          pendingByKey: { ...state.pendingByKey, [key]: false },
        }));
      }
    },

    postJson: async <T = unknown>({
      key,
      url,
      body,
      timeoutMs = 120000,
    }: PostJsonParams) => {
      set((state) => ({
        pendingByKey: { ...state.pendingByKey, [key]: true },
        errorByKey: { ...state.errorByKey, [key]: null },
      }));

      try {
        const response = await apiClient.post<T>(
          url,
          (body ?? {}) as Record<string, unknown>,
          {
          timeout: timeoutMs,
          },
        );
        return response.data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao processar requisicao";
        set((state) => ({
          errorByKey: { ...state.errorByKey, [key]: message },
        }));
        throw error;
      } finally {
        set((state) => ({
          pendingByKey: { ...state.pendingByKey, [key]: false },
        }));
      }
    },

    clearError: (key) => {
      set((state) => ({
        errorByKey: { ...state.errorByKey, [key]: null },
      }));
    },

    finishRequest: (key) => {
      set((state) => ({
        pendingByKey: { ...state.pendingByKey, [key]: false },
      }));
    },
  }),
);
