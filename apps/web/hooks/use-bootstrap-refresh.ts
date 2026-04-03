"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { invalidateDomainBootstrapCache } from "@/hooks/shared/use-domain-bootstrap";
import { clearBootstrapHydrationState } from "@/lib/query/bootstrap-runtime";

export type BootstrapDomain = "student" | "gym" | "personal";

export function invalidateBootstrapDomains(domains: readonly BootstrapDomain[]) {
  for (const domain of domains) {
    clearBootstrapHydrationState(domain);
    invalidateDomainBootstrapCache(domain);
  }
}

export function invalidateBootstrapDomain(domain: BootstrapDomain) {
  invalidateBootstrapDomains([domain]);
}

function useInvalidateBootstrap(domain: BootstrapDomain) {
  const router = useRouter();

  return useCallback(async () => {
    invalidateBootstrapDomain(domain);
    router.refresh();
  }, [domain, router]);
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
