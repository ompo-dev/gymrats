import type { BootstrapResponse } from "@gymrats/types/bootstrap";
import type { GymDataSection } from "@gymrats/types/gym-unified";
import { apiClient } from "@/lib/api/client";
import {
  disableClientApiCapability,
  isClientApiCapabilityEnabled,
  isRouteNotFoundError,
} from "@/lib/api/route-capabilities";
import type { GymUnifiedData } from "@/lib/types/gym-unified";
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
      requestId: "legacy-students-all",
      sectionTimings: {},
      cache: {
        hit: false,
        strategy: "legacy-students-all",
      },
    },
  };
}

async function getLegacyStudentBootstrapRequest(
  sections?: readonly StudentDataSection[],
) {
  const response = await apiClient.get<Partial<StudentData>>(
    `/api/students/all${buildSectionsQuery(sections)}`,
  );

  return createLegacyStudentBootstrapResponse(response.data ?? {});
}

export async function getStudentBootstrapRequest(
  sections?: readonly StudentDataSection[],
) {
  if (!isClientApiCapabilityEnabled("studentBootstrap")) {
    return getLegacyStudentBootstrapRequest(sections);
  }

  try {
    const response = await apiClient.get<
      BootstrapResponse<Partial<StudentData>>
    >(`/api/students/bootstrap${buildSectionsQuery(sections)}`);
    return response.data;
  } catch (error) {
    if (isRouteNotFoundError(error, "/api/students/bootstrap")) {
      disableClientApiCapability("studentBootstrap");
      return getLegacyStudentBootstrapRequest(sections);
    }
    throw error;
  }
}

export async function getGymBootstrapRequest(
  sections?: readonly GymDataSection[],
) {
  if (!isClientApiCapabilityEnabled("gymBootstrap")) {
    throw new Error("gym bootstrap disabled");
  }

  try {
    const response = await apiClient.get<
      BootstrapResponse<Partial<GymUnifiedData>>
    >(`/api/gyms/bootstrap${buildSectionsQuery(sections)}`);
    return response.data;
  } catch (error) {
    if (isRouteNotFoundError(error, "/api/gyms/bootstrap")) {
      disableClientApiCapability("gymBootstrap");
    }
    throw error;
  }
}

export async function getPersonalBootstrapRequest(
  sections?: readonly PersonalDataSection[],
) {
  if (!isClientApiCapabilityEnabled("personalBootstrap")) {
    throw new Error("personal bootstrap disabled");
  }

  try {
    const response = await apiClient.get<
      BootstrapResponse<Partial<PersonalUnifiedData>>
    >(`/api/personals/bootstrap${buildSectionsQuery(sections)}`);
    return response.data;
  } catch (error) {
    if (isRouteNotFoundError(error, "/api/personals/bootstrap")) {
      disableClientApiCapability("personalBootstrap");
    }
    throw error;
  }
}

export async function getPaymentStatusRequest(paymentId: string) {
  const response = await apiClient.get<{ id: string; status: string }>(
    `/api/payments/${paymentId}`,
  );
  return response.data;
}
