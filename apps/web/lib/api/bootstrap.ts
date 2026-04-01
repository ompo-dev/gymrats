import type { BootstrapResponse } from "@gymrats/types/bootstrap";
import type { GymDataSection } from "@gymrats/types/gym-unified";
import { actionClient, webActions } from "@/lib/actions/client";
import type { GymUnifiedData } from "@/lib/types/gym-unified";
import type {
  PersonalDataSection,
  PersonalUnifiedData,
} from "@/lib/types/personal-unified";
import type {
  StudentData,
  StudentDataSection,
} from "@/lib/types/student-unified";

export async function getStudentBootstrapRequest(
  sections?: readonly StudentDataSection[],
) {
  return webActions.getStudentBootstrapAction(sections);
}

export async function getGymBootstrapRequest(
  sections?: readonly GymDataSection[],
) {
  return webActions.getGymBootstrapAction(sections);
}

export async function getPersonalBootstrapRequest(
  sections?: readonly PersonalDataSection[],
) {
  return webActions.getPersonalBootstrapAction(sections);
}

export async function getPaymentStatusRequest(paymentId: string) {
  const response = await actionClient.get<{ id: string; status: string }>(
    `/api/payments/${paymentId}`,
    {
      profile: "seconds",
      scope: "private",
      tags: [
        "payments:status",
        `payments:status:${paymentId}`,
        "student:payments",
        "student:subscription",
        "student:bootstrap:self",
      ],
    },
  );
  return response.data;
}
