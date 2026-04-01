import { buildTag, withMetadata } from "./helpers";
import type { CacheMetadata, RouteContext } from "./types";

export function inferFallbackMetadata(context: RouteContext): CacheMetadata {
  const firstSegment = context.segments[0] ?? "unknown";
  const secondSegment = context.segments[1] ?? firstSegment;
  const thirdSegment = context.segments[2];

  const area =
    firstSegment === "students" ||
    ["workouts", "nutrition", "subscriptions", "memberships"].includes(firstSegment)
      ? "student"
      : firstSegment === "gyms" || firstSegment === "gym-subscriptions"
        ? "gym"
        : firstSegment === "personals"
          ? "personal"
          : firstSegment;

  const directTags = [buildTag(area, secondSegment)];
  if (thirdSegment) {
    directTags.push(buildTag(area, secondSegment, thirdSegment));
  }

  return withMetadata(area, secondSegment, "minutes", "private", directTags);
}
