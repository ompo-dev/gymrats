export type BootstrapDomain = "student" | "gym" | "personal";

interface BootstrapCacheMeta {
  hit?: boolean;
  strategy?: string;
  ttlMs?: number;
}

export interface BootstrapResponseMeta {
  requestId?: string | null;
  generatedAt?: string | null;
  sectionTimings?: unknown;
  cache?: BootstrapCacheMeta | null;
}

const hydratedBootstrapRequests = new Map<string, string>();

export function normalizeBootstrapSections(sections?: readonly string[]) {
  return sections && sections.length > 0
    ? [...sections].sort().join(",")
    : "all";
}

export function buildBootstrapHydrationKey(
  domain: BootstrapDomain,
  sections?: readonly string[],
) {
  return `${domain}:${normalizeBootstrapSections(sections)}`;
}

export function resolveBootstrapRequestId(
  meta: BootstrapResponseMeta | null | undefined,
  normalizedSections: string,
) {
  return meta?.requestId ?? meta?.generatedAt ?? normalizedSections;
}

export function markBootstrapHydrated(hydrationKey: string, requestId: string) {
  if (hydratedBootstrapRequests.get(hydrationKey) === requestId) {
    return false;
  }

  hydratedBootstrapRequests.set(hydrationKey, requestId);
  return true;
}

export function clearBootstrapHydrationState(domain?: BootstrapDomain) {
  if (!domain) {
    hydratedBootstrapRequests.clear();
    return;
  }

  const prefix = `${domain}:`;
  for (const key of hydratedBootstrapRequests.keys()) {
    if (key.startsWith(prefix)) {
      hydratedBootstrapRequests.delete(key);
    }
  }
}
