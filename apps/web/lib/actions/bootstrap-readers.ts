import "server-only";

import type { BootstrapResponse } from "@gymrats/types/bootstrap";
import type { GymDataSection, GymUnifiedData } from "@/lib/types/gym-unified";
import type {
  PersonalDataSection,
  PersonalUnifiedData,
} from "@/lib/types/personal-unified";
import type {
  StudentData,
  StudentDataSection,
} from "@/lib/types/student-unified";
import { readCachedApi } from "./cached-reader";

function buildSectionTags(area: "student" | "gym" | "personal", sections?: readonly string[]) {
  const normalizedSections =
    sections && sections.length > 0 ? [...sections].sort() : ["all"];

  return [
    `${area}:bootstrap`,
    ...normalizedSections.map((section) => `${area}:bootstrap:${section}`),
  ];
}

export async function readStudentBootstrap(
  sections?: readonly StudentDataSection[],
) {
  return readCachedApi<BootstrapResponse<Partial<StudentData>>>({
    path: "/api/students/bootstrap",
    query:
      sections && sections.length > 0
        ? {
            sections: sections.join(","),
          }
        : undefined,
    tags: buildSectionTags("student", sections),
    profile: "dashboard",
    scope: "private",
  });
}

export async function readGymBootstrap(sections?: readonly GymDataSection[]) {
  return readCachedApi<BootstrapResponse<Partial<GymUnifiedData>>>({
    path: "/api/gyms/bootstrap",
    query:
      sections && sections.length > 0
        ? {
            sections: sections.join(","),
          }
        : undefined,
    tags: buildSectionTags("gym", sections),
    profile: "dashboard",
    scope: "private",
  });
}

export async function readPersonalBootstrap(
  sections?: readonly PersonalDataSection[],
) {
  return readCachedApi<BootstrapResponse<Partial<PersonalUnifiedData>>>({
    path: "/api/personals/bootstrap",
    query:
      sections && sections.length > 0
        ? {
            sections: sections.join(","),
          }
        : undefined,
    tags: buildSectionTags("personal", sections),
    profile: "dashboard",
    scope: "private",
  });
}
