import { buildTag, withMetadata } from "./helpers";
import type { CacheMetadata, RouteContext } from "./types";

export function resolveStudentMetadata(
  context: RouteContext,
): CacheMetadata | null {
  const [root, resource, resourceId] = context.segments;

  if (root === "workouts") {
    return withMetadata(
      "student",
      "workouts",
      "hours",
      "private",
      ["student:workouts", "student:weekly-plan"],
      resourceId
        ? [buildTag("student", "workouts", resourceId)]
        : ["student:bootstrap:self"],
    );
  }

  if (root === "nutrition") {
    return withMetadata(
      "student",
      "nutrition",
      "hours",
      "private",
      ["student:nutrition"],
      ["student:bootstrap:self"],
    );
  }

  if (
    root === "subscriptions" ||
    root === "memberships" ||
    root === "payment-methods"
  ) {
    return withMetadata(
      "student",
      "subscription",
      "minutes",
      "private",
      ["student:subscription", "student:payments"],
      ["student:bootstrap:self"],
    );
  }

  if (root !== "students") {
    return null;
  }

  if (resource === "profile" || resource === "student") {
    return withMetadata(
      "student",
      "profile",
      "days",
      "private",
      ["student:profile", "student:profile:self"],
      ["student:bootstrap:self"],
    );
  }

  if (resource === "progress") {
    return withMetadata(
      "student",
      "dashboard",
      "minutes",
      "private",
      ["student:dashboard", "student:progress"],
      ["student:bootstrap:self"],
    );
  }

  if (resource === "weight" || resource === "weight-history") {
    return withMetadata(
      "student",
      "weight-history",
      "weeks",
      "private",
      ["student:weight-history", "student:weight-history:self"],
      ["student:profile", "student:dashboard", "student:bootstrap:self"],
    );
  }

  if (resource === "payments") {
    return withMetadata(
      "student",
      "payments",
      resourceId ? "seconds" : "minutes",
      "private",
      [
        "student:payments",
        ...(resourceId ? [buildTag("student", "payments", resourceId)] : []),
      ],
      ["student:subscription", "student:bootstrap:self"],
    );
  }

  if (
    resource === "subscription" ||
    resource === "memberships" ||
    resource === "day-passes" ||
    resource === "referrals"
  ) {
    return withMetadata(
      "student",
      resource === "referrals" ? "payments" : "subscription",
      "minutes",
      "private",
      [
        resource === "referrals" ? "student:payments" : "student:subscription",
      ],
      ["student:dashboard", "student:bootstrap:self"],
    );
  }

  if (resource === "friends") {
    return withMetadata(
      "student",
      "social",
      "days",
      "private",
      ["student:social"],
      ["student:bootstrap:self"],
    );
  }

  return withMetadata(
    "student",
    resource ?? "unknown",
    "minutes",
    "private",
    ["student:dashboard", buildTag("student", resource ?? "unknown")],
    ["student:bootstrap:self"],
  );
}
