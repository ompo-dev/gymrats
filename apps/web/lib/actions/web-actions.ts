"use server";

import { cookies } from "next/headers";
import { revalidateTag, updateTag } from "next/cache";
import type { GymDataSection } from "@/lib/types/gym-unified";
import type { PersonalDataSection } from "@/lib/types/personal-unified";
import type { StudentDataSection } from "@/lib/types/student-unified";
import { buildApiPath } from "@/lib/api/server-action-utils";
import { serverApiRequest } from "@/lib/api/server";
import {
  readGymBootstrap,
  readPersonalBootstrap,
  readStudentBootstrap,
} from "./bootstrap-readers";
import { readAuthSession, type AuthSessionPayload } from "./auth-readers";
import {
  buildCacheTags,
  inferCacheMetadata,
  type CacheProfile,
  type CacheScope,
} from "./cache-tags";
import { readCachedApi } from "./cached-reader";

type SerializableQuery = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface WebReadActionInput {
  path: string;
  query?: SerializableQuery;
  headers?: Record<string, string>;
  tags?: readonly string[];
  profile?: CacheProfile;
  scope?: CacheScope;
  fresh?: boolean;
}

export interface WebMutationActionInput {
  path: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: SerializableQuery;
  headers?: Record<string, string>;
  tags?: readonly string[];
}

function invalidateTags(tags: readonly string[]) {
  for (const tag of tags) {
    updateTag(tag);
    revalidateTag(tag, "max");
  }
}

function resolveMutationTags(input: Pick<WebMutationActionInput, "path" | "tags">) {
  return buildCacheTags(input.path, input.tags);
}

export async function getAuthSessionAction(): Promise<AuthSessionPayload> {
  return readAuthSession();
}

export async function signOutAction() {
  try {
    await serverApiRequest("/api/auth/sign-out", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{}",
    });
  } finally {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    cookieStore.delete("better-auth.session_token");
    invalidateTags(["auth:all", "auth:session"]);
  }
}

export async function getStudentBootstrapAction(
  sections?: readonly StudentDataSection[],
) {
  return readStudentBootstrap(sections);
}

export async function getGymBootstrapAction(
  sections?: readonly GymDataSection[],
) {
  return readGymBootstrap(sections);
}

export async function getPersonalBootstrapAction(
  sections?: readonly PersonalDataSection[],
) {
  return readPersonalBootstrap(sections);
}

export async function executeWebReadAction<T>(
  input: WebReadActionInput,
): Promise<T> {
  const inferred = inferCacheMetadata(input.path);
  const path = buildApiPath(input.path, input.query);

  if (input.fresh) {
    return serverApiRequest<T>(path, {
      method: "GET",
      headers: input.headers,
    });
  }

  return readCachedApi<T>({
    path: input.path,
    query: input.query,
    tags: input.tags,
    profile: input.profile ?? inferred.profile,
    scope: input.scope ?? inferred.scope,
  });
}

export async function executeWebMutationAction<T>(
  input: WebMutationActionInput,
): Promise<T> {
  const path = buildApiPath(input.path, input.query);
  const payload = await serverApiRequest<T>(path, {
    method: input.method,
    headers: {
      ...(input.body === undefined
        ? {}
        : {
            "Content-Type": "application/json",
          }),
      ...(input.headers ?? {}),
    },
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
  });

  invalidateTags(resolveMutationTags(input));

  return payload;
}
