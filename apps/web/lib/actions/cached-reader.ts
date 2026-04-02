import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { buildApiPath } from "@/lib/api/server-action-utils";
import {
  buildServerApiUrl,
  parseServerApiJsonResponse,
  serverApiRequest,
  type ServerApiError,
} from "@/lib/api/server";
import type { CacheProfile, CacheScope } from "./cache-tags";
import { buildCacheTags } from "./cache-tags";

export interface CachedReadInput {
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  tags?: readonly string[];
  profile?: CacheProfile;
  scope?: CacheScope;
}

const CACHE_LIFE_PROFILES: Record<
  CacheProfile,
  { stale?: number; revalidate?: number; expire?: number }
> = {
  default: {
    revalidate: 900,
    expire: 31_536_000,
  },
  seconds: {
    stale: 30,
    revalidate: 1,
    expire: 60,
  },
  minutes: {
    stale: 300,
    revalidate: 60,
    expire: 3_600,
  },
  hours: {
    stale: 300,
    revalidate: 3_600,
    expire: 86_400,
  },
  days: {
    stale: 300,
    revalidate: 86_400,
    expire: 604_800,
  },
  weeks: {
    stale: 300,
    revalidate: 604_800,
    expire: 2_592_000,
  },
  max: {
    stale: 300,
    revalidate: 2_592_000,
    expire: 31_536_000,
  },
};

function applyCacheProfile(profile?: CacheProfile) {
  cacheLife(CACHE_LIFE_PROFILES[profile ?? "minutes"]);
}

async function readWithPrivateCache<T>(input: CachedReadInput): Promise<T> {
  "use cache: private";

  const path = buildApiPath(input.path, input.query);
  const tags = buildCacheTags(path, input.tags);

  applyCacheProfile(input.profile);
  cacheTag(...tags);

  return serverApiRequest<T>(path, { method: "GET" });
}

async function readWithDefaultCache<T>(input: CachedReadInput): Promise<T> {
  "use cache";

  const path = buildApiPath(input.path, input.query);
  const tags = buildCacheTags(path, input.tags);

  applyCacheProfile(input.profile);
  cacheTag(...tags);

  return serverApiRequest<T>(path, { method: "GET" }, { skipForwardHeaders: true });
}

async function readWithRemoteCache<T>(input: CachedReadInput): Promise<T> {
  "use cache: remote";

  const path = buildApiPath(input.path, input.query);
  const tags = buildCacheTags(path, input.tags);

  applyCacheProfile(input.profile);
  cacheTag(...tags);

  const response = await fetch(buildServerApiUrl(path), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-gymrats-cache-scope": "remote",
    },
  });

  const payload = await parseServerApiJsonResponse(response);
  if (!response.ok) {
    throw new Error(
      typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof (payload as { error?: unknown }).error === "string"
        ? ((payload as { error: string }).error ?? "Erro de leitura remota")
        : `API request failed for ${path}`,
    );
  }

  return payload as T;
}

export async function readCachedApi<T>(input: CachedReadInput): Promise<T> {
  if (input.scope === "none") {
    return serverApiRequest<T>(buildApiPath(input.path, input.query), {
      method: "GET",
    });
  }

  if (input.scope === "remote") {
    return readWithRemoteCache<T>(input);
  }

  if (input.scope === "default") {
    return readWithDefaultCache<T>(input);
  }

  return readWithPrivateCache<T>(input);
}

export function isServerApiError(error: unknown): error is ServerApiError {
  return (
    error instanceof Error &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  );
}
