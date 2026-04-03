import { buildTag, withMetadata } from "./helpers";
import type { CacheMetadata, RouteContext } from "./types";

export function resolvePersonalMetadata(
  context: RouteContext,
): CacheMetadata | null {
  const [root, resource, resourceId, nestedResource, leafId] = context.segments;

  if (root === "personals" && resource === "bootstrap") {
    return null;
  }

  if (root === "personals" && resource === "gyms" && nestedResource === "access") {
    return withMetadata(
      "personal",
      "access",
      "seconds",
      "private",
      [
        "personal:access",
        ...(leafId ? [buildTag("personal", "access", leafId)] : []),
      ],
      ["personal:dashboard", "personal:bootstrap:self"],
    );
  }

  if (root === "personals" && resource === "students" && resourceId) {
    const baseTags = [
      "personal:students",
      buildTag("personal", "students", resourceId),
    ];

    if (nestedResource === "student-data") {
      return withMetadata(
        "personal",
        "student-detail",
        "minutes",
        "private",
        [...baseTags, buildTag("personal", "student-detail", resourceId)],
        ["personal:directory", "personal:dashboard", "personal:bootstrap:self"],
      );
    }

    if (nestedResource === "weekly-plan" || nestedResource === "workouts") {
      return withMetadata(
        "personal",
        "student-workouts",
        "minutes",
        "private",
        [
          ...baseTags,
          "student:workouts",
          "student:weekly-plan",
          buildTag("personal", "student-workouts", resourceId),
          ...(leafId ? [buildTag("personal", "student-workouts", resourceId, leafId)] : []),
        ],
        ["personal:dashboard", "personal:bootstrap:self"],
      );
    }

    if (nestedResource === "nutrition") {
      return withMetadata(
        "personal",
        "student-nutrition",
        "minutes",
        "private",
        [
          ...baseTags,
          "student:nutrition",
          buildTag("personal", "student-nutrition", resourceId),
          ...(leafId ? [buildTag("personal", "student-nutrition", resourceId, leafId)] : []),
        ],
        ["personal:dashboard", "personal:bootstrap:self"],
      );
    }
  }

  if (root === "personals" && resource === "profile") {
    return withMetadata(
      "personal",
      "profile",
      "days",
      "private",
      ["personal:profile", "personal:profile:self", "personal:settings"],
      ["personal:bootstrap:self"],
    );
  }

  if (root === "personals" && resource === "affiliations") {
    return withMetadata(
      "personal",
      "affiliations",
      "minutes",
      "private",
      ["personal:affiliations"],
      ["personal:dashboard", "personal:bootstrap:self"],
    );
  }

  if (root === "personals" && resource === "students") {
    return withMetadata(
      "personal",
      "students",
      "minutes",
      "private",
      [
        "personal:students",
        ...(resourceId ? [buildTag("personal", "students", resourceId)] : []),
      ],
      ["personal:dashboard", "personal:bootstrap:self"],
    );
  }

  if (root === "personals" && resource === "payments") {
    return withMetadata(
      "personal",
      "payments",
      resourceId ? "seconds" : "minutes",
      "private",
      [
        "personal:payments",
        ...(resourceId ? [buildTag("personal", "payments", resourceId)] : []),
      ],
      ["personal:financial-summary", "personal:dashboard", "personal:bootstrap:self"],
    );
  }

  if (root === "personals" && resource === "financial-summary") {
    return withMetadata(
      "personal",
      "financial-summary",
      "minutes",
      "private",
      ["personal:financial-summary"],
      ["personal:dashboard", "personal:bootstrap:self"],
    );
  }

  if (root === "personals" && resource === "membership-plans") {
    return withMetadata(
      "personal",
      "plans",
      "hours",
      "private",
      [
        "personal:plans",
        ...(resourceId ? [buildTag("personal", "plans", resourceId)] : []),
      ],
      ["personal:bootstrap:self"],
    );
  }

  if (root === "personals" && resource === "subscription") {
    return withMetadata(
      "personal",
      "subscription",
      "minutes",
      "private",
      ["personal:subscription"],
      ["personal:dashboard", "personal:bootstrap:self"],
    );
  }

  if (root === "personals" && resource === "expenses") {
    return withMetadata(
      "personal",
      "expenses",
      "minutes",
      "private",
      ["personal:expenses"],
      ["personal:financial-summary", "personal:dashboard", "personal:bootstrap:self"],
    );
  }

  if (root === "personals" && resource === "coupons") {
    return withMetadata(
      "personal",
      "coupons",
      "minutes",
      "private",
      ["personal:coupons"],
      ["personal:bootstrap:self"],
    );
  }

  if (root === "personals" && resource === "boost-campaigns") {
    return withMetadata(
      "personal",
      "campaigns",
      "minutes",
      "private",
      ["personal:campaigns"],
      ["personal:dashboard", "personal:bootstrap:self"],
    );
  }

  return null;
}
