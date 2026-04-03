import { buildTag, createScopeHash, withMetadata } from "./helpers";
import type { CacheMetadata, RouteContext } from "./types";

export function resolveDiscoveryGymMetadata(
  context: RouteContext,
): CacheMetadata | null {
  const [, secondSegment, gymId] = context.segments;
  const filterHash = createScopeHash(context.query);

  if (secondSegment === "locations") {
    return withMetadata(
      "discovery",
      "gyms",
      "hours",
      "remote",
      ["discovery:gyms", buildTag("discovery", "gyms", filterHash)],
    );
  }

  if (context.segments[0] === "students" && secondSegment === "gyms") {
    if (context.segments[3] === "profile" && gymId) {
      return withMetadata(
        "public",
        "gym-profile",
        "hours",
        "remote",
        ["public:gym-profile", buildTag("public", "gym-profile", gymId)],
        ["discovery:gyms"],
      );
    }

    if (context.segments[3] === "plans" && gymId) {
      return withMetadata(
        "public",
        "gym-plans",
        "hours",
        "remote",
        ["public:gym-plans", buildTag("public", "gym-plans", gymId)],
        ["discovery:gyms"],
      );
    }

    return withMetadata(
      "student",
      "subscription",
      "minutes",
      "private",
      ["student:subscription", "student:payments"],
      ["student:bootstrap:self", "gym:students", "gym:dashboard"],
    );
  }

  return null;
}

export function resolveDiscoveryPersonalMetadata(
  context: RouteContext,
): CacheMetadata | null {
  const [, secondSegment, personalId] = context.segments;
  const filterHash = createScopeHash(context.query);

  if (context.segments[0] === "students" && secondSegment === "personals") {
    if (context.segments[2] === "nearby") {
      return withMetadata(
        "discovery",
        "personals",
        "minutes",
        "remote",
        ["discovery:personals", buildTag("discovery", "personals", filterHash)],
      );
    }

    if (context.segments[3] === "profile" && personalId) {
      return withMetadata(
        "public",
        "personal-profile",
        "hours",
        "remote",
        [
          "public:personal-profile",
          buildTag("public", "personal-profile", personalId),
        ],
        ["discovery:personals"],
      );
    }

    return withMetadata(
      "student",
      "payments",
      "seconds",
      "private",
      ["student:payments"],
      ["student:subscription", "student:bootstrap:self"],
    );
  }

  if (context.segments[0] === "gym" && secondSegment === "personals") {
    return withMetadata(
      "discovery",
      "personals",
      "minutes",
      "remote",
      ["discovery:personals", buildTag("discovery", "personals", filterHash)],
      ["gym:dashboard"],
    );
  }

  return null;
}
