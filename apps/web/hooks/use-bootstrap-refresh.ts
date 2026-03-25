"use client";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export type BootstrapDomain = "student" | "gym" | "personal";

export async function invalidateBootstrapQueries(
  queryClient: QueryClient,
  domain: BootstrapDomain,
) {
  await queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey[0] === domain &&
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
