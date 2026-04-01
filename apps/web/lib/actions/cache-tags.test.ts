import { describe, expect, it } from "vitest";
import {
  buildBootstrapCacheTags,
  createScopeTag,
  inferCacheMetadata,
  resolveMutationCacheTags,
} from "./cache-tags";

describe("cache tag policy", () => {
  it("maps auth session to private seconds with auth and bootstrap tags", () => {
    const metadata = inferCacheMetadata("/api/auth/session");

    expect(metadata.profile).toBe("seconds");
    expect(metadata.scope).toBe("private");
    expect(metadata.directTags).toEqual(
      expect.arrayContaining(["auth:session", "auth:viewer:user:self"]),
    );
    expect(metadata.derivedTags).toEqual(
      expect.arrayContaining([
        "student:bootstrap:self",
        "gym:bootstrap:self",
        "personal:bootstrap:self",
      ]),
    );
  });

  it("maps student weight history to weeks with profile and dashboard tags", () => {
    const metadata = inferCacheMetadata("/api/students/weight-history");

    expect(metadata.profile).toBe("weeks");
    expect(metadata.scope).toBe("private");
    expect(metadata.directTags).toEqual(
      expect.arrayContaining([
        "student:weight-history",
        "student:weight-history:self",
      ]),
    );
    expect(metadata.derivedTags).toEqual(
      expect.arrayContaining([
        "student:profile",
        "student:dashboard",
        "student:bootstrap:self",
      ]),
    );
  });

  it("maps student workouts to hours with weekly plan tags", () => {
    const metadata = inferCacheMetadata("/api/workouts/weekly-plan");

    expect(metadata.profile).toBe("hours");
    expect(metadata.scope).toBe("private");
    expect(metadata.directTags).toEqual(
      expect.arrayContaining(["student:workouts", "student:weekly-plan"]),
    );
    expect(metadata.derivedTags).toContain("student:bootstrap:self");
  });

  it("maps payment status to seconds", () => {
    const metadata = inferCacheMetadata("/api/payments/pay_123");

    expect(metadata.profile).toBe("seconds");
    expect(metadata.scope).toBe("private");
    expect(metadata.directTags).toEqual(
      expect.arrayContaining(["payments:status", "payments:status:pay_123"]),
    );
  });

  it("resolves gym settle payment invalidation with direct and aggregate tags", () => {
    const tags = resolveMutationCacheTags("/api/gyms/payments/pay_123/settle");

    expect(tags.updateTags).toEqual(
      expect.arrayContaining(["gym:payments", "gym:payments:pay_123"]),
    );
    expect(tags.revalidateTags).toEqual(
      expect.arrayContaining([
        "gym:financial-summary",
        "gym:dashboard",
        "gym:bootstrap:self",
      ]),
    );
  });

  it("maps public gym plans to remote hours", () => {
    const metadata = inferCacheMetadata("/api/students/gyms/gym_1/plans");

    expect(metadata.profile).toBe("hours");
    expect(metadata.scope).toBe("remote");
    expect(metadata.directTags).toEqual(
      expect.arrayContaining([
        "public:gym-plans",
        "public:gym-plans:gym_1",
      ]),
    );
    expect(metadata.derivedTags).toContain("discovery:gyms");
  });

  it("maps search queries to scoped remote catalog tags", () => {
    const metadata = inferCacheMetadata("/api/foods/search?q=banana");

    expect(metadata.profile).toBe("hours");
    expect(metadata.scope).toBe("remote");
    expect(metadata.directTags).toContain("catalog:foods");
    expect(metadata.directTags).toContain(
      createScopeTag("discovery:foods", { q: "banana" }),
    );
  });

  it("builds bootstrap tags with section fan-out", () => {
    const tags = buildBootstrapCacheTags("student", [
      "profile",
      "weightHistory",
    ]);

    expect(tags).toEqual(
      expect.arrayContaining([
        "student:bootstrap",
        "student:bootstrap:self",
        "student:bootstrap:profile",
        "student:bootstrap:weight-history",
        "student:profile",
        "student:weight-history",
        "student:dashboard",
      ]),
    );
  });

  it("keeps explicit mutation tags for revalidation without promoting all of them to update", () => {
    const tags = resolveMutationCacheTags("/api/gyms/students", [
      "gym:list:self",
      "gym:bootstrap:self",
    ]);

    expect(tags.updateTags).toContain("gym:students");
    expect(tags.revalidateTags).toEqual(
      expect.arrayContaining([
        "gym:dashboard",
        "gym:bootstrap:self",
        "gym:list:self",
      ]),
    );
    expect(tags.revalidateTags).not.toContain("gym:students");
  });
});
