import type { BootstrapResponse } from "@gymrats/types/bootstrap";
import { ServerApiError, serverApiGet } from "@/lib/api/server";
import type { GymDataSection, GymUnifiedData } from "@/lib/types/gym-unified";
import type {
  PersonalDataSection,
  PersonalUnifiedData,
} from "@/lib/types/personal-unified";
import type {
  StudentData,
  StudentDataSection,
} from "@/lib/types/student-unified";

function buildSectionsQuery(sections?: readonly string[]) {
  if (!sections || sections.length === 0) {
    return "";
  }

  const params = new URLSearchParams({
    sections: sections.join(","),
  });

  return `?${params.toString()}`;
}

function createLegacyStudentBootstrapResponse(
  data: Partial<StudentData>,
): BootstrapResponse<Partial<StudentData>> {
  return {
    data,
    meta: {
      version: "legacy-students-all",
      generatedAt: new Date().toISOString(),
      requestId: "legacy-students-all-server",
      sectionTimings: {},
      cache: {
        hit: false,
        strategy: "legacy-students-all",
      },
    },
  };
}

export async function getStudentBootstrapServerRequest(
  sections?: readonly StudentDataSection[],
) {
  try {
    return await serverApiGet<BootstrapResponse<Partial<StudentData>>>(
      `/api/students/bootstrap${buildSectionsQuery(sections)}`,
    );
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) {
      const legacyData = await serverApiGet<Partial<StudentData>>(
        `/api/students/all${buildSectionsQuery(sections)}`,
      );

      return createLegacyStudentBootstrapResponse(legacyData ?? {});
    }

    throw error;
  }
}

export async function getGymBootstrapServerRequest(
  sections?: readonly GymDataSection[],
) {
  return serverApiGet<BootstrapResponse<Partial<GymUnifiedData>>>(
    `/api/gyms/bootstrap${buildSectionsQuery(sections)}`,
  );
}

export async function getPersonalBootstrapServerRequest(
  sections?: readonly PersonalDataSection[],
) {
  return serverApiGet<BootstrapResponse<Partial<PersonalUnifiedData>>>(
    `/api/personals/bootstrap${buildSectionsQuery(sections)}`,
  );
}
