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
import { buildBootstrapCacheTags } from "./cache-tags";
import { readCachedApi } from "./cached-reader";

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
    tags: buildBootstrapCacheTags("student", sections),
    profile: "minutes",
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
    tags: buildBootstrapCacheTags("gym", sections),
    profile: "minutes",
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
    tags: buildBootstrapCacheTags("personal", sections),
    profile: "minutes",
    scope: "private",
  });
}
