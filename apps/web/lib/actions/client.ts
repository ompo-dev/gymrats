"use client";

import {
  executeWebMutationAction,
  executeWebReadAction,
  getAuthSessionAction,
  getGymBootstrapAction,
  getPersonalBootstrapAction,
  getStudentBootstrapAction,
  signOutAction,
  type WebMutationActionInput,
  type WebReadActionInput,
} from "./web-actions";

type ActionClientConfig = {
  params?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  timeout?: number;
  tags?: readonly string[];
  profile?: WebReadActionInput["profile"];
  scope?: WebReadActionInput["scope"];
  fresh?: boolean;
  data?: unknown;
};

type ActionResponse<T> = {
  data: T;
};

async function wrapAction<T>(promise: Promise<T>): Promise<ActionResponse<T>> {
  const data = await promise;
  return { data };
}

export const actionClient = {
  get<T>(path: string, config?: ActionClientConfig) {
    return wrapAction(
      executeWebReadAction<T>({
        path,
        query: config?.params,
        headers: config?.headers,
        tags: config?.tags,
        profile: config?.profile,
        scope: config?.scope,
        fresh: config?.fresh,
      }),
    );
  },
  post<T>(path: string, data?: unknown, config?: ActionClientConfig) {
    return wrapAction(
      executeWebMutationAction<T>({
        path,
        method: "POST",
        body: data,
        query: config?.params,
        headers: config?.headers,
        tags: config?.tags,
      }),
    );
  },
  put<T>(path: string, data?: unknown, config?: ActionClientConfig) {
    return wrapAction(
      executeWebMutationAction<T>({
        path,
        method: "PUT",
        body: data,
        query: config?.params,
        headers: config?.headers,
        tags: config?.tags,
      }),
    );
  },
  patch<T>(path: string, data?: unknown, config?: ActionClientConfig) {
    return wrapAction(
      executeWebMutationAction<T>({
        path,
        method: "PATCH",
        body: data,
        query: config?.params,
        headers: config?.headers,
        tags: config?.tags,
      }),
    );
  },
  delete<T>(path: string, config?: ActionClientConfig) {
    return wrapAction(
      executeWebMutationAction<T>({
        path,
        method: "DELETE",
        body: config?.data,
        query: config?.params,
        headers: config?.headers,
        tags: config?.tags,
      }),
    );
  },
};

export const webActions = {
  getAuthSessionAction,
  signOutAction,
  getStudentBootstrapAction,
  getGymBootstrapAction,
  getPersonalBootstrapAction,
};
