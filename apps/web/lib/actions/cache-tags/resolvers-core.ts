import { buildBootstrapTags } from "./bootstrap";
import { buildTag, createScopeHash, getSectionNames, withMetadata } from "./helpers";
import type { CacheMetadata, RouteContext } from "./types";

export function resolveAuthMetadata(context: RouteContext): CacheMetadata | null {
  if (context.segments[0] !== "auth") {
    return null;
  }

  if (context.segments[1] === "session") {
    return withMetadata(
      "auth",
      "session",
      "seconds",
      "private",
      ["auth:session", "auth:viewer:user:self"],
      ["student:bootstrap:self", "gym:bootstrap:self", "personal:bootstrap:self"],
    );
  }

  return withMetadata(
    "auth",
    context.segments[1] ?? "unknown",
    "seconds",
    "private",
    ["auth:session"],
    ["student:bootstrap:self", "gym:bootstrap:self", "personal:bootstrap:self"],
  );
}

export function resolveAdminMetadata(context: RouteContext): CacheMetadata | null {
  if (
    context.segments[0] !== "admin" ||
    context.segments[1] !== "observability"
  ) {
    return null;
  }

  const resource = context.segments[2] ?? "summary";
  return withMetadata(
    "admin",
    "observability",
    "seconds",
    "private",
    ["admin:observability", buildTag("admin", "observability", resource)],
    ["admin:dashboard"],
  );
}

export function resolveBootstrapMetadata(
  context: RouteContext,
): CacheMetadata | null {
  if (context.segments[1] !== "bootstrap") {
    return null;
  }

  const sections = getSectionNames(context.query.sections);

  if (context.segments[0] === "students") {
    const { directTags, derivedTags } = buildBootstrapTags("student", sections);
    return withMetadata(
      "student",
      "bootstrap",
      "minutes",
      "private",
      directTags,
      derivedTags,
    );
  }

  if (context.segments[0] === "gyms") {
    const { directTags, derivedTags } = buildBootstrapTags("gym", sections);
    return withMetadata(
      "gym",
      "bootstrap",
      "minutes",
      "private",
      directTags,
      derivedTags,
    );
  }

  if (context.segments[0] === "personals") {
    const { directTags, derivedTags } = buildBootstrapTags("personal", sections);
    return withMetadata(
      "personal",
      "bootstrap",
      "minutes",
      "private",
      directTags,
      derivedTags,
    );
  }

  return null;
}

export function resolveCatalogMetadata(
  context: RouteContext,
): CacheMetadata | null {
  const filterHash = createScopeHash(context.query);

  if (context.segments[0] === "foods" && context.segments[1] === "search") {
    return withMetadata(
      "catalog",
      "foods",
      "hours",
      "remote",
      ["catalog:foods", buildTag("discovery", "foods", filterHash)],
    );
  }

  if (
    context.segments[0] === "exercises" &&
    context.segments[1] === "search"
  ) {
    return withMetadata(
      "catalog",
      "exercises",
      "hours",
      "remote",
      ["catalog:exercises", buildTag("discovery", "exercises", filterHash)],
    );
  }

  if (context.segments[0] === "swagger") {
    return withMetadata(
      "public",
      "swagger",
      "days",
      "remote",
      ["public:swagger"],
    );
  }

  return null;
}

export function resolvePaymentsMetadata(
  context: RouteContext,
): CacheMetadata | null {
  if (context.segments[0] !== "payments") {
    return null;
  }

  const paymentId = context.segments[1];

  return withMetadata(
    "payments",
    "status",
    "seconds",
    "private",
    ["payments:status", buildTag("payments", "status", paymentId)],
  );
}
