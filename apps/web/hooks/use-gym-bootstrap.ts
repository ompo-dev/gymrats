"use client";

import { useQuery } from "@tanstack/react-query";
import { getGymBootstrapRequest } from "@/lib/api/bootstrap";
import { queryKeys } from "@/lib/query/query-keys";
import type { GymDataSection } from "@/lib/types/gym-unified";

export function useGymBootstrap(
  sections?: readonly GymDataSection[],
  options?: {
    enabled?: boolean;
  },
) {
  return useQuery({
    queryKey: queryKeys.gymBootstrap(sections),
    queryFn: () => getGymBootstrapRequest(sections),
    enabled: options?.enabled ?? true,
  });
}
