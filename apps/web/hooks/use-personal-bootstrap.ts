"use client";

import { useQuery } from "@tanstack/react-query";
import { getPersonalBootstrapRequest } from "@/lib/api/bootstrap";
import { queryKeys } from "@/lib/query/query-keys";
import type { PersonalDataSection } from "@/lib/types/personal-unified";

export function usePersonalBootstrap(
  sections?: readonly PersonalDataSection[],
  options?: {
    enabled?: boolean;
  },
) {
  return useQuery({
    queryKey: queryKeys.personalBootstrap(sections),
    queryFn: () => getPersonalBootstrapRequest(sections),
    enabled: options?.enabled ?? true,
  });
}
