import { buildTag, withMetadata } from "./helpers";
import type { CacheMetadata, RouteContext } from "./types";

export function resolveGymMetadata(context: RouteContext): CacheMetadata | null {
  const [root, resource, resourceId, nestedResource] = context.segments;

  if (root === "gym-subscriptions") {
    return withMetadata(
      "gym",
      "subscription",
      "minutes",
      "private",
      ["gym:subscription"],
      ["gym:dashboard", "gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "access") {
    const directTags = ["gym:access"];
    const leafTags: string[] = [];

    if (nestedResource) {
      leafTags.push(buildTag("gym", "access", nestedResource));
    } else if (resourceId) {
      leafTags.push(buildTag("gym", "access", resourceId));
    }

    return withMetadata(
      "gym",
      "access",
      "seconds",
      "private",
      [...directTags, ...leafTags],
      ["gym:dashboard", "gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && (resource === "checkin" || resource === "checkout")) {
    return withMetadata(
      "gym",
      "access",
      "seconds",
      "private",
      ["gym:access", "gym:access:feed", "gym:access:presence"],
      ["gym:dashboard", "gym:students", "gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "checkins") {
    return withMetadata(
      "gym",
      "access",
      "seconds",
      "private",
      ["gym:access", "gym:access:feed"],
      ["gym:dashboard", "gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "profile") {
    return withMetadata(
      "gym",
      "profile",
      "days",
      "private",
      ["gym:profile", "gym:profile:self", "gym:settings"],
      ["gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "stats") {
    return withMetadata(
      "gym",
      "dashboard",
      "minutes",
      "private",
      ["gym:dashboard", "gym:stats"],
      ["gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "students") {
    return withMetadata(
      "gym",
      "students",
      "minutes",
      "private",
      [
        "gym:students",
        ...(resourceId ? [buildTag("gym", "students", resourceId)] : []),
      ],
      ["gym:dashboard", "gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "payments") {
    return withMetadata(
      "gym",
      "payments",
      resourceId ? "seconds" : "minutes",
      "private",
      [
        "gym:payments",
        ...(resourceId ? [buildTag("gym", "payments", resourceId)] : []),
      ],
      ["gym:financial-summary", "gym:dashboard", "gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "financial-summary") {
    return withMetadata(
      "gym",
      "financial-summary",
      "minutes",
      "private",
      ["gym:financial-summary"],
      ["gym:dashboard", "gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "plans") {
    return withMetadata(
      "gym",
      "plans",
      "hours",
      "private",
      ["gym:plans", ...(resourceId ? [buildTag("gym", "plans", resourceId)] : [])],
      ["gym:bootstrap:self", "public:gym-plans"],
    );
  }

  if (root === "gyms" && resource === "equipment") {
    return withMetadata(
      "gym",
      "equipment",
      "hours",
      "private",
      [
        "gym:equipment",
        ...(resourceId ? [buildTag("gym", "equipment", resourceId)] : []),
      ],
      ["gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "expenses") {
    return withMetadata(
      "gym",
      "expenses",
      "minutes",
      "private",
      ["gym:expenses"],
      ["gym:financial-summary", "gym:dashboard", "gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "coupons") {
    return withMetadata(
      "gym",
      "coupons",
      "minutes",
      "private",
      ["gym:coupons"],
      ["gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "boost-campaigns") {
    return withMetadata(
      "gym",
      "campaigns",
      "minutes",
      "private",
      ["gym:campaigns"],
      ["gym:dashboard", "gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "members") {
    return withMetadata(
      "gym",
      "students",
      "minutes",
      "private",
      ["gym:students"],
      ["gym:payments", "gym:dashboard", "gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "list") {
    return withMetadata(
      "gym",
      "list",
      "minutes",
      "private",
      ["gym:list", "gym:list:self"],
      ["gym:bootstrap:self"],
    );
  }

  if (root === "gyms" && resource === "set-active") {
    return withMetadata(
      "gym",
      "list",
      "seconds",
      "private",
      ["gym:list", "gym:list:self", "auth:session"],
      ["gym:bootstrap:self", "personal:bootstrap:self", "student:bootstrap:self"],
    );
  }

  return null;
}
