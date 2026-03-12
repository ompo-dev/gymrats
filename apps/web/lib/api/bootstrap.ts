import type { BootstrapResponse } from "@gymrats/types/bootstrap";
import { apiClient } from "@/lib/api/client";
import type { GymUnifiedData } from "@/lib/types/gym-unified";
import type {
  PersonalDataSection,
  PersonalUnifiedData,
} from "@/lib/types/personal-unified";
import type {
  StudentData,
  StudentDataSection,
} from "@/lib/types/student-unified";
import type { GymDataSection } from "@gymrats/types/gym-unified";

function buildSectionsQuery(sections?: readonly string[]) {
  if (!sections || sections.length === 0) {
    return "";
  }

  const params = new URLSearchParams({
    sections: sections.join(","),
  });

  return `?${params.toString()}`;
}

export async function getStudentBootstrapRequest(
  sections?: readonly StudentDataSection[],
) {
  const response = await apiClient.get<BootstrapResponse<Partial<StudentData>>>(
    `/api/students/bootstrap${buildSectionsQuery(sections)}`,
  );
  return response.data;
}

export async function getGymBootstrapRequest(
  sections?: readonly GymDataSection[],
) {
  const response = await apiClient.get<BootstrapResponse<Partial<GymUnifiedData>>>(
    `/api/gyms/bootstrap${buildSectionsQuery(sections)}`,
  );
  return response.data;
}

export async function getPersonalBootstrapRequest(
  sections?: readonly PersonalDataSection[],
) {
  const response = await apiClient.get<
    BootstrapResponse<Partial<PersonalUnifiedData>>
  >(`/api/personals/bootstrap${buildSectionsQuery(sections)}`);
  return response.data;
}

export async function getPaymentStatusRequest(paymentId: string) {
  const response = await apiClient.get<{ id: string; status: string }>(
    `/api/payments/${paymentId}`,
  );
  return response.data;
}
