"use client";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { clearBootstrapHydrationState } from "@/lib/query/bootstrap-runtime";

export type BootstrapDomain = "student" | "gym" | "personal";

function matchesDomain(queryKey: unknown, domain: string) {
  return Array.isArray(queryKey) && queryKey[0] === domain;
}

export async function invalidateQueryDomains(
  queryClient: QueryClient,
  domains: readonly string[],
) {
  await Promise.all(
    domains.map(async (domain) => {
      clearBootstrapHydrationState(domain as BootstrapDomain);
      await queryClient.invalidateQueries({
        predicate: (query) => matchesDomain(query.queryKey, domain),
      });
    }),
  );
}

export async function invalidateBootstrapQueries(
  queryClient: QueryClient,
  domain: BootstrapDomain,
) {
  clearBootstrapHydrationState(domain);
  await queryClient.invalidateQueries({
    predicate: (query) =>
      matchesDomain(query.queryKey, domain) &&
      query.queryKey[1] === "bootstrap",
  });
}

export function useInvalidateBootstrap(domain: BootstrapDomain) {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await invalidateBootstrapQueries(queryClient, domain);
  }, [domain, queryClient]);
}

export function useInvalidateStudentBootstrap() {
  return useInvalidateBootstrap("student");
}

export function useInvalidateGymBootstrap() {
  return useInvalidateBootstrap("gym");
}

export function useInvalidatePersonalBootstrap() {
  return useInvalidateBootstrap("personal");
}
