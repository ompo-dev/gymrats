import { buildBootstrapCacheTags } from "./cache-tags/bootstrap";
import { inferFallbackMetadata } from "./cache-tags/fallback";
import { createScopeTag, normalizeCachePath, uniqueTags } from "./cache-tags/helpers";
import {
  resolveAdminMetadata,
  resolveAuthMetadata,
  resolveBootstrapMetadata,
  resolveCatalogMetadata,
  resolvePaymentsMetadata,
} from "./cache-tags/resolvers-core";
import {
  resolveDiscoveryGymMetadata,
  resolveDiscoveryPersonalMetadata,
} from "./cache-tags/resolvers-discovery";
import { resolveGymMetadata } from "./cache-tags/resolvers-gym";
import { resolvePersonalMetadata } from "./cache-tags/resolvers-personal";
import { resolveStudentMetadata } from "./cache-tags/resolvers-student";
import {
  EMPTY_METADATA,
  type CacheMetadata,
  type CacheProfile,
  type CacheScope,
} from "./cache-tags/types";

export type { CacheMetadata, CacheProfile, CacheScope } from "./cache-tags/types";
export { buildBootstrapCacheTags, createScopeTag };

export function inferCacheMetadata(path: string): CacheMetadata {
  const context = normalizeCachePath(path);

  return (
    resolveAuthMetadata(context) ??
    resolveAdminMetadata(context) ??
    resolveBootstrapMetadata(context) ??
    resolveCatalogMetadata(context) ??
    resolveDiscoveryGymMetadata(context) ??
    resolveDiscoveryPersonalMetadata(context) ??
    resolvePaymentsMetadata(context) ??
    resolveStudentMetadata(context) ??
    resolveGymMetadata(context) ??
    resolvePersonalMetadata(context) ??
    inferFallbackMetadata(context) ??
    EMPTY_METADATA
  );
}

export function buildCacheTags(path: string, tags?: readonly string[]) {
  const inferred = inferCacheMetadata(path).tags;
  const explicit = uniqueTags(tags ?? []);
  return uniqueTags([...inferred, ...explicit]);
}

export function resolveMutationCacheTags(path: string, tags?: readonly string[]) {
  const inferred = inferCacheMetadata(path);
  const explicit = uniqueTags(tags ?? []);
  const fallbackUpdateTags =
    inferred.directTags.length > 0
      ? uniqueTags(inferred.directTags)
      : explicit.slice(0, 1);
  const explicitRevalidateTags = explicit.filter(
    (tag) => !fallbackUpdateTags.includes(tag),
  );

  return {
    updateTags: fallbackUpdateTags,
    revalidateTags: uniqueTags([
      ...inferred.derivedTags,
      ...explicitRevalidateTags,
    ]),
  };
}
