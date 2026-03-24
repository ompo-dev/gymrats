import type { StudentProfileData } from "./types";

export function hasCompletedStudentProfile(
  profile: StudentProfileData | null | undefined,
) {
  return Boolean(
    profile &&
      typeof profile.height === "number" &&
      typeof profile.weight === "number" &&
      typeof profile.fitnessLevel === "string" &&
      profile.fitnessLevel.length > 0,
  );
}
