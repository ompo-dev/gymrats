export type CacheScope = "private" | "remote" | "default" | "none";
export type CacheProfile =
  | "default"
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | "weeks"
  | "max"
  | "realtime"
  | "dashboard"
  | "catalog";

type TagInference = {
  tags: string[];
  area: string;
  resource: string;
  profile: CacheProfile;
  scope: CacheScope;
};

function sanitizeTagPart(value: string | null | undefined) {
  if (!value) {
    return "unknown";
  }

  return value
    .trim()
    .replace(/[^a-zA-Z0-9:_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function inferAreaFromSegments(segments: string[]) {
  const firstSegment = segments[0] ?? "unknown";

  if (
    [
      "students",
      "workouts",
      "nutrition",
      "subscriptions",
      "memberships",
      "payment-methods",
    ].includes(firstSegment)
  ) {
    return "student";
  }

  if (["gyms", "gym", "gym-subscriptions"].includes(firstSegment)) {
    return "gym";
  }

  if (["personals"].includes(firstSegment)) {
    return "personal";
  }

  if (["auth", "users"].includes(firstSegment)) {
    return "auth";
  }

  if (["payments"].includes(firstSegment)) {
    return "payments";
  }

  if (["boost-campaigns"].includes(firstSegment)) {
    return "marketing";
  }

  return firstSegment;
}

function inferProfileFromResource(area: string, resource: string): CacheProfile {
  if (resource.includes("access") || resource.includes("checkin")) {
    return "realtime";
  }

  if (
    [
      "dashboard",
      "stats",
      "payments",
      "students",
      "financial-summary",
      "financialsummary",
      "subscription",
      "bootstrap",
    ].includes(resource)
  ) {
    return "dashboard";
  }

  if (
    ["plans", "membership-plans", "equipment", "locations", "foods"].includes(
      resource,
    )
  ) {
    return "catalog";
  }

  if (area === "auth") {
    return "seconds";
  }

  return "minutes";
}

function inferScope(area: string, resource: string): CacheScope {
  if (area === "auth") {
    return "private";
  }

  if (
    [
      "locations",
      "foods",
      "boost-campaigns",
      "nearby",
      "catalog",
      "swagger",
      "api-docs",
    ].includes(resource)
  ) {
    return "remote";
  }

  return "private";
}

export function inferCacheMetadata(path: string): TagInference {
  const normalizedPath = path.split("?")[0] ?? path;
  const segments = normalizedPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const apiSegments =
    segments[0] === "api"
      ? segments.slice(1)
      : segments[0] === ""
        ? segments.slice(2)
        : segments;
  const area = sanitizeTagPart(inferAreaFromSegments(apiSegments));
  const resource = sanitizeTagPart(apiSegments[1] ?? apiSegments[0] ?? "root");
  const resourceId = sanitizeTagPart(apiSegments[2] ?? "");
  const profile = inferProfileFromResource(area, resource);
  const scope = inferScope(area, resource);
  const tags = [`${area}:all`, `${area}:${resource}`];

  if (resourceId && resourceId !== "unknown") {
    tags.push(`${area}:${resource}:${resourceId}`);
  }

  if (resource === "bootstrap") {
    tags.push(`${area}:bootstrap`);
  }

  return {
    tags,
    area,
    resource,
    profile,
    scope,
  };
}

export function buildCacheTags(path: string, tags?: readonly string[]) {
  const inferred = inferCacheMetadata(path).tags;

  if (!tags?.length) {
    return inferred;
  }

  return Array.from(
    new Set([...inferred, ...tags.map((tag) => sanitizeTagPart(tag))]),
  );
}
