import type {
  CacheMetadata,
  CacheProfile,
  CacheScope,
  RouteContext,
  SerializableQueryValue,
} from "./types";

export function sanitizeTagPart(value: string | null | undefined) {
  if (!value) {
    return "unknown";
  }

  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9:_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function uniqueTags(tags: readonly string[]) {
  return Array.from(
    new Set(tags.map((tag) => sanitizeTagPart(tag)).filter(Boolean)),
  );
}

export function buildTag(...parts: Array<string | null | undefined>) {
  return uniqueTags([parts.map((part) => sanitizeTagPart(part)).join(":")])[0];
}

export function normalizeCachePath(path: string): RouteContext {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const parsed = new URL(normalizedPath, "https://gymrats-cache.local");
  const rawSegments = parsed.pathname.split("/").filter(Boolean);
  const segments = rawSegments[0] === "api" ? rawSegments.slice(1) : rawSegments;
  const query = Object.fromEntries(parsed.searchParams.entries());

  return {
    path,
    pathname: parsed.pathname,
    segments,
    query,
  };
}

export function createScopeHash(query: Record<string, string>) {
  const entries = Object.entries(query)
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right));

  if (entries.length === 0) {
    return "all";
  }

  const raw = entries.map(([key, value]) => `${key}=${value}`).join("&");
  let hash = 5381;

  for (let index = 0; index < raw.length; index += 1) {
    hash = (hash * 33) ^ raw.charCodeAt(index);
  }

  return Math.abs(hash >>> 0).toString(36);
}

export function withMetadata(
  area: string,
  resource: string,
  profile: CacheProfile,
  scope: CacheScope,
  directTags: readonly string[],
  derivedTags: readonly string[] = [],
): CacheMetadata {
  const normalizedDirectTags = uniqueTags(directTags);
  const normalizedDerivedTags = uniqueTags(
    derivedTags.filter(
      (tag) => !normalizedDirectTags.includes(sanitizeTagPart(tag)),
    ),
  );

  return {
    area: sanitizeTagPart(area),
    resource: sanitizeTagPart(resource),
    profile,
    scope,
    directTags: normalizedDirectTags,
    derivedTags: normalizedDerivedTags,
    tags: uniqueTags([...normalizedDirectTags, ...normalizedDerivedTags]),
  };
}

export function getSectionNames(value?: string) {
  if (!value) {
    return ["all"];
  }

  return value
    .split(",")
    .map((section) => section.trim())
    .filter(Boolean)
    .sort();
}

export function createScopeTag(
  prefix: string,
  query: Record<string, SerializableQueryValue>,
) {
  const normalized = Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, String(value)]),
  );

  return buildTag(prefix, createScopeHash(normalized));
}
